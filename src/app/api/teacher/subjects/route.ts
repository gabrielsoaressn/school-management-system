import { withAuth } from "@/lib/api-auth";
import { fail, ok, serverError } from "@/lib/api-response";
import { findTeachableSubjects } from "@/lib/teaching";

/**
 * GET /api/teacher/subjects?classId=...
 *
 * Subjects the caller may work with in that class, from the class curriculum.
 * A teacher sees only the subjects they are assigned to — the grade's whole
 * subject list is no longer the answer.
 */
export const GET = withAuth(
  async (request, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const classId = searchParams.get("classId");

      if (!classId) {
        return fail("Informe classId");
      }

      const subjects = await findTeachableSubjects(user, classId);

      return ok(subjects);
    } catch (error) {
      return serverError(error, "Erro ao buscar disciplinas");
    }
  },
  {
    roles: ["ADMIN", "TEACHER", "COORDINATOR", "SECRETARY"],
    permission: "class:read",
  }
);
