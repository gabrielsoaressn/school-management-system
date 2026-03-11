import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Count draft billings
    const count = await prisma.billing.count({
      where: { status: "DRAFT" },
    });

    if (count === 0) {
      return NextResponse.json(
        { message: "Nenhuma cobrança pendente de aprovação" },
        { status: 400 }
      );
    }

    // Update all DRAFT billings to PENDING
    await prisma.billing.updateMany({
      where: { status: "DRAFT" },
      data: { status: "PENDING" },
    });

    return NextResponse.json({
      message: `${count} cobrança(s) aprovada(s) com sucesso`,
    });
  } catch (error: any) {
    console.error("Error approving all billings:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao aprovar cobranças" },
      { status: 500 }
    );
  }
}
