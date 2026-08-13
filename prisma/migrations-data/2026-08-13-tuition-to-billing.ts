/**
 * Data migration: Tuition -> Billing.
 *
 * Two financial models coexisted. `Tuition` charged the *student* and was read
 * only by the admin revenue figure; `Billing` charges the *guardian* and is what
 * the whole financial module emits. This moves the history across so the legacy
 * tables can be dropped without losing anything.
 *
 * Run with:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' \
 *     prisma/migrations-data/2026-08-13-tuition-to-billing.ts [--dry-run]
 *
 * Idempotent: a Tuition already migrated is recognised by the `legacyTuitionId`
 * marker in the Billing notes, so a re-run converts only what is missing.
 */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

const MARKER = "legacyTuitionId=";

interface Report {
  total: number;
  migrated: number;
  alreadyDone: number;
  paymentsCreated: number;
  withoutGuardian: string[];
}

/**
 * Who to charge. The financial guardian is the right answer; the direct
 * `parentId` is the fallback for older records that predate
 * GuardianRelationship.
 */
async function resolvePayer(studentId: string): Promise<string | null> {
  const financial = await prisma.guardianRelationship.findFirst({
    where: {
      studentId,
      guardianType: { in: ["FINANCIAL", "BOTH"] },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    select: { parentId: true },
  });

  if (financial) return financial.parentId;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { parentId: true },
  });

  return student?.parentId ?? null;
}

async function main() {
  console.log(
    `\nTuition -> Billing${dryRun ? " (dry run: nothing will be written)" : ""}\n`
  );

  const tuitions = await prisma.tuition.findMany({
    include: {
      student: { select: { firstName: true, lastName: true } },
      plan: { select: { name: true, gradeLevel: true } },
      discount: { select: { code: true, name: true, type: true, value: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const report: Report = {
    total: tuitions.length,
    migrated: 0,
    alreadyDone: 0,
    paymentsCreated: 0,
    withoutGuardian: [],
  };

  const alreadyMigrated = await prisma.billing.findMany({
    where: { notes: { contains: MARKER } },
    select: { notes: true },
  });

  const doneIds = new Set(
    alreadyMigrated
      .map((billing) => billing.notes?.match(/legacyTuitionId=([\w-]+)/)?.[1])
      .filter((id): id is string => Boolean(id))
  );

  for (const tuition of tuitions) {
    if (doneIds.has(tuition.id)) {
      report.alreadyDone += 1;
      continue;
    }

    const parentId = await resolvePayer(tuition.studentId);

    if (!parentId) {
      // Nobody to charge: reported rather than guessed at.
      report.withoutGuardian.push(tuition.invoiceNumber);
      continue;
    }

    // Tuition kept the gross amount with the discount beside it; Billing carries
    // the amount actually charged.
    const gross = new Prisma.Decimal(tuition.amount);
    const discount = new Prisma.Decimal(tuition.discountAmount ?? 0);
    const net = Prisma.Decimal.max(gross.minus(discount), new Prisma.Decimal(0));

    const studentName = `${tuition.student.firstName} ${tuition.student.lastName}`;
    const noteParts = [
      `Migrado do modelo antigo de mensalidade (${MARKER}${tuition.id})`,
      `Aluno: ${studentName}`,
      tuition.plan ? `Plano: ${tuition.plan.name}` : null,
      discount.greaterThan(0)
        ? `Desconto aplicado: R$ ${discount.toFixed(2)}${
            tuition.discount ? ` (${tuition.discount.code})` : ""
          }`
        : null,
      tuition.notes,
    ].filter(Boolean);

    if (dryRun) {
      report.migrated += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const billing = await tx.billing.create({
        data: {
          // Prefixed so it cannot collide with a number from the live sequence.
          invoiceNumber: `LEG-${tuition.invoiceNumber}`,
          parentId,
          type: "TUITION",
          description: `Mensalidade ${tuition.plan?.gradeLevel ?? ""} - ${studentName}`.trim(),
          amount: net,
          dueDate: tuition.dueDate,
          paidDate: tuition.paidDate,
          status: tuition.status,
          isRecurring: false,
          recurrence: "NONE",
          paymentMethod: tuition.paymentMethod,
          transactionId: tuition.transactionId,
          notes: noteParts.join(" | "),
          createdAt: tuition.createdAt,
        },
      });

      // A paid charge needs its receipt, or the derived status would contradict
      // the money on the next recalculation.
      if (tuition.status === "PAID" && tuition.paidDate) {
        await tx.payment.create({
          data: {
            billingId: billing.id,
            amount: net,
            paidAt: tuition.paidDate,
            method: mapPaymentMethod(tuition.paymentMethod),
            notes: "Pagamento migrado do modelo antigo",
            createdAt: tuition.createdAt,
          },
        });
        report.paymentsCreated += 1;
      }
    });

    report.migrated += 1;
  }

  console.log(`  encontradas:        ${report.total}`);
  console.log(`  migradas:           ${report.migrated}`);
  console.log(`  já migradas antes:  ${report.alreadyDone}`);
  console.log(`  recibos criados:    ${report.paymentsCreated}`);

  if (report.withoutGuardian.length > 0) {
    console.log(
      `\n  ATENÇÃO: ${report.withoutGuardian.length} mensalidade(s) sem responsável ` +
        `e portanto não migradas:\n    ${report.withoutGuardian.join(", ")}`
    );
    console.log(
      "  Vincule um responsável a esses alunos e rode novamente antes de remover as tabelas antigas."
    );
  }

  console.log("");
}

/** The old free-text payment method mapped onto the PaymentMethod enum. */
function mapPaymentMethod(
  method: string | null
): "PIX" | "BOLETO" | "CARD" | "CASH" | "TRANSFER" {
  const value = (method ?? "").toLowerCase();

  if (value.includes("pix")) return "PIX";
  if (value.includes("boleto")) return "BOLETO";
  if (value.includes("cart") || value.includes("card") || value.includes("débito"))
    return "CARD";
  if (value.includes("dinheiro") || value.includes("cash")) return "CASH";
  return "TRANSFER";
}

main()
  .catch((error) => {
    console.error("\nFalha na migração:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
