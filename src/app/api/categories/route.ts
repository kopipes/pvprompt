import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET - List all categories
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { prompts: true },
                },
            },
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

// POST - Create new category
export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { name, description, color } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        // Check if category already exists
        const existing = await prisma.category.findUnique({
            where: { name },
        });

        if (existing) {
            return NextResponse.json(
                { error: "Category already exists" },
                { status: 400 }
            );
        }

        const category = await prisma.category.create({
            data: {
                name,
                description,
                color: color || "#6366f1",
            },
        });

        return NextResponse.json({ category }, { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 }
        );
    }
}
