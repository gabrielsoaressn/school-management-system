import { withAuth } from "@/lib/api-auth";
import { ok, serverError } from "@/lib/api-response";
import { findTeachableClasses } from "@/lib/teaching";

/**
 * GET /api/teacher/classes
 *
 * Classes the caller may work with in the current academic year. A teacher gets
 * the ones they are assigned to in ClassSubjectTeacher; coordination, secretarial
 * staff and admins get all of them.
 *
 * This used to return every class in the school to every teacher: the branch for
 * teachers loaded their subjects, discarded the result and then ran the same
 * unfiltered query as the admin branch.
 */
export const GET = withAuth(
  async (request, { user }) => {
    try {
      const classes = await findTeachableClasses(user);

      return ok(classes);
    } catch (error) {
      return serverError(error, "Erro ao buscar turmas");
    }
  },
  {
    roles: ["ADMIN", "TEACHER", "COORDINATOR", "SECRETARY"],
    permission: "class:read",
  }
);
