import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT - Update category (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth || auth.role !== "admin") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const { name, description, color } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        const category = await prisma.category.update({
            where: { id },
            data: {
                name: name.trim(),
                description,
                color,
            },
        });

        return NextResponse.json({ category });
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

// DELETE - Delete category (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth || auth.role !== "admin") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const { id } = await params;

        await prisma.category.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}
