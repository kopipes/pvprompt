import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Get single project with all entries (auth required)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true } },
                entries: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        images: { orderBy: { order: "asc" } },
                        prompt: { select: { id: true, title: true, aiTool: true } },
                    },
                },
                _count: { select: { entries: true } },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Only owner or admin can view
        if (project.userId !== auth.userId && auth.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        return NextResponse.json({ project });
    } catch (error) {
        console.error("Error fetching project:", error);
        return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
    }
}

// PUT - Update project title/description (owner or admin)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { title, description } = await request.json();

        if (!title?.trim()) {
            return NextResponse.json({ error: "Project title is required" }, { status: 400 });
        }

        const existing = await prisma.project.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (existing.userId !== auth.userId && auth.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const project = await prisma.project.update({
            where: { id },
            data: {
                title: title.trim(),
                description: description?.trim() || null,
            },
        });

        return NextResponse.json({ project });
    } catch (error) {
        console.error("Error updating project:", error);
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
}

// DELETE - Delete project (owner or admin)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const existing = await prisma.project.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (existing.userId !== auth.userId && auth.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.project.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}
