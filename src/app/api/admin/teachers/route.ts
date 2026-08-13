import { prisma } from "@/lib/prisma";
import { created, fail, serverError } from "@/lib/api-response";
import { withAuth } from "@/lib/api-auth";
import { generateTemporaryPassword, hashPassword } from "@/lib/password";
import { sendTemporaryPasswordEmail } from "@/lib/notifications";
import { nextEmployeeId } from "@/lib/identifiers";

export const POST = withAuth(
  async (request) => {
    try {
      const body = await request.json();
      const { name, email, phone, subjectIds, qualification, experience } =
        body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return fail("Email já está em uso", 400);
      }

      // Split name into first and last name
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || firstName;

      // First-access password: random, e-mailed, and must be replaced on login.
      const temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await hashPassword(temporaryPassword);

      // Generate unique employee ID
      const employeeIdNumber = await nextEmployeeId();

      // Create user, employee, and teacher in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            role: "TEACHER",
            isActive: true,
            mustChangePassword: true,
          },
        });

        // Create employee
        const newEmployee = await tx.employee.create({
          data: {
            employeeId: employeeIdNumber,
            userId: newUser.id,
            firstName,
            lastName,
            dateOfBirth: new Date(1990, 0, 1), // Default date
            gender: "OTHER",
            phoneNumber: phone,
            address: "",
            employeeType: "TEACHER",
            position: "Teacher",
            department: "Academic",
            salary: 0,
            hireDate: new Date(),
          },
        });

        // Create teacher
        const teacher = await tx.teacher.create({
          data: {
            employeeId: newEmployee.id,
            qualification,
            specialization: subjectIds.join(", "),
            experience: parseInt(experience) || 0,
          },
        });

        // Link subjects to teacher
        if (subjectIds && subjectIds.length > 0) {
          await tx.teacherSubject.createMany({
            data: subjectIds.map((subjectId: string) => ({
              teacherId: teacher.id,
              subjectId: subjectId,
            })),
          });
        }

        return { user: newUser, employee: newEmployee, teacher };
      });

      await sendTemporaryPasswordEmail(email, temporaryPassword);

      return created(result, {
        message:
          "Professor criado com sucesso. A senha provisória foi enviada por e-mail.",
      });
    } catch (error: any) {
      return serverError(error, "Erro ao criar professor");
    }
  },
  { permission: "employee:write" }
);
