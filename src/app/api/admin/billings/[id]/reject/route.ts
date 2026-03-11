import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if billing exists and is in DRAFT status
    const billing = await prisma.billing.findUnique({
      where: { id },
    });

    if (!billing) {
      return NextResponse.json(
        { message: "Cobrança não encontrada" },
        { status: 404 }
      );
    }

    if (billing.status !== "DRAFT") {
      return NextResponse.json(
        { message: "Esta cobrança já foi processada" },
        { status: 400 }
      );
    }

    // Update status to CANCELLED
    await prisma.billing.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: billing.notes
          ? `${billing.notes} | Rejeitado pelo administrador`
          : "Rejeitado pelo administrador",
      },
    });

    return NextResponse.json({
      message: "Cobrança rejeitada e cancelada",
    });
  } catch (error: any) {
    console.error("Error rejecting billing:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao rejeitar cobrança" },
      { status: 500 }
    );
  }
}
