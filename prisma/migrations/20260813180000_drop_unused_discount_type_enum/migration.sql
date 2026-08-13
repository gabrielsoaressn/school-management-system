-- DiscountType is no longer a Prisma enum: the enrolment discount is a request
-- parameter (see src/lib/tuition.ts), not a stored column. Dropping the type
-- keeps the database and the schema identical.
-- DropEnum
DROP TYPE "DiscountType";

