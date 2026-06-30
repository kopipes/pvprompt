import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET - List projects for authenticated user
export async function GET() {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projects = await prisma.project.findMany({
            where: { userId: auth.userId },
            include: {
                _count: { select: { entries: true } },
                entries: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    include: {
                        images: {
                            where: { type: "result" },
                            orderBy: { order: "asc" },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json({ projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
    }
}

// POST - Create new project
export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, description } = await request.json();

        if (!title?.trim()) {
            return NextResponse.json({ error: "Project title is required" }, { status: 400 });
        }

        const project = await prisma.project.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                userId: auth.userId,
            },
            include: {
                _count: { select: { entries: true } },
            },
        });

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error("Error creating project:", error);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
