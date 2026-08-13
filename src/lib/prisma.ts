import { PrismaClient } from "@prisma/client";

/**
 * Models carrying a `deletedAt` column. Reads on these are filtered so that a
 * soft-deleted record disappears from the application without every query
 * having to remember the condition.
 */
const SOFT_DELETE_MODELS = new Set([
  "Student",
  "Parent",
  "Employee",
  "Billing",
  "EnrollmentRequest",
]);

const FILTERED_OPERATIONS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return base.$extends({
    name: "soft-delete",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (
            !SOFT_DELETE_MODELS.has(model) ||
            !FILTERED_OPERATIONS.has(operation)
          ) {
            return query(args);
          }

          const typed = args as { where?: Record<string, unknown> };

          // An explicit deletedAt in the call wins: that is how the trash view
          // and the restore flow read deleted rows on purpose.
          if (typed.where && "deletedAt" in typed.where) {
            return query(args);
          }

          return query({
            ...args,
            where: { ...(typed.where ?? {}), deletedAt: null },
          } as typeof args);
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
