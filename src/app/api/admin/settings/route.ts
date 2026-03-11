import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all settings
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findMany({
      orderBy: {
        label: 'asc',
      },
    });

    return NextResponse.json({ data: settings });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

// PUT - Update settings
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { settings } = await request.json();

    // Update each setting
    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.settings.update({
        where: { key },
        data: { value: String(value) },
      })
    );

    await Promise.all(updates);

    return NextResponse.json({
      message: "Configurações atualizadas com sucesso"
    });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao atualizar configurações" },
      { status: 500 }
    );
  }
}
