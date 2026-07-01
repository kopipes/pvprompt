import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

const MAX_ENTRIES = 50;

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - List entries for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.userId !== auth.userId && auth.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const entries = await prisma.projectEntry.findMany({
            where: { projectId: id },
            include: {
                images: { orderBy: { order: "asc" } },
                prompt: { select: { id: true, title: true, aiTool: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ entries });
    } catch (error) {
        console.error("Error fetching entries:", error);
        return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
    }
}

// POST - Add entry to project
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const project = await prisma.project.findUnique({
            where: { id },
            include: { _count: { select: { entries: true } } },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.userId !== auth.userId && auth.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (project._count.entries >= MAX_ENTRIES) {
            return NextResponse.json(
                { error: `Project has reached the maximum of ${MAX_ENTRIES} entries` },
                { status: 400 }
            );
        }

        const { notes, promptText, inputImages, resultImages, promptId } = await request.json();

        // inputImages and resultImages are arrays of { url: string, order: number }
        const entry = await prisma.projectEntry.create({
            data: {
                notes: notes?.trim() || null,
                promptText: promptText?.trim() || null,
                promptId: promptId || null,
                projectId: id,
                images: {
                    create: [
                        ...(inputImages || []).map((img: { url: string; order: number }, i: number) => ({
                            url: img.url,
                            type: "input",
                            order: img.order ?? i,
                        })),
                        ...(resultImages || []).map((img: { url: string; order: number }, i: number) => ({
                            url: img.url,
                            type: "result",
                            order: img.order ?? i,
                        })),
                    ],
                },
            },
            include: {
                images: { orderBy: { order: "asc" } },
                prompt: { select: { id: true, title: true, aiTool: true } },
            },
        });

        // Bump project updatedAt
        await prisma.project.update({ where: { id }, data: { updatedAt: new Date() } });

        return NextResponse.json({ entry }, { status: 201 });
    } catch (error) {
        console.error("Error creating entry:", error);
        return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
    }
}
