-- Match the index name Prisma derives from the model, so the schema and the
-- database stay byte-identical.
ALTER INDEX "Assessment_studentId_subjectId_assessmentTypeId_term_academi_ke"
    RENAME TO "Assessment_studentId_subjectId_assessmentTypeId_term_academ_key";
