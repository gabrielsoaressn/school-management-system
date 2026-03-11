import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const billings = await prisma.billing.findMany({
      where: {
        status: "DRAFT",
      },
      include: {
        parent: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ data: billings });
  } catch (error: any) {
    console.error("Error fetching pending billings:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao buscar cobranças pendentes" },
      { status: 500 }
    );
  }
}
