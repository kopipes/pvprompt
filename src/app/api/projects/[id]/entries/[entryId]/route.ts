import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ id: string; entryId: string }>;
}

// GET - Get single entry (for edit page)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, entryId } = await params;

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.userId !== auth.userId && auth.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const entry = await prisma.projectEntry.findUnique({
            where: { id: entryId },
            include: { images: { orderBy: { order: "asc" } } },
        });

        if (!entry || entry.projectId !== id) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 });
        }

        return NextResponse.json({ entry });
    } catch (error) {
        console.error("Error fetching entry:", error);
        return NextResponse.json({ error: "Failed to fetch entry" }, { status: 500 });
    }
}

// PUT - Update entry
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, entryId } = await params;

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.userId !== auth.userId && auth.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const existing = await prisma.projectEntry.findUnique({ where: { id: entryId } });
        if (!existing || existing.projectId !== id) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 });
        }

        const { notes, promptText, inputImages, resultImages } = await request.json();

        await prisma.projectImage.deleteMany({ where: { entryId } });

        const entry = await prisma.projectEntry.update({
            where: { id: entryId },
            data: {
                notes: notes?.trim() || null,
                promptText: promptText?.trim() || null,
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
            include: { images: { orderBy: { order: "asc" } } },
        });

        return NextResponse.json({ entry });
    } catch (error) {
        console.error("Error updating entry:", error);
        return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
    }
}

// DELETE - Delete single entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, entryId } = await params;

        const project = await prisma.project.findUnique({ where: { id } });
        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.userId !== auth.userId && auth.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const existing = await prisma.projectEntry.findUnique({ where: { id: entryId } });
        if (!existing || existing.projectId !== id) {
            return NextResponse.json({ error: "Entry not found" }, { status: 404 });
        }

        await prisma.projectEntry.delete({ where: { id: entryId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting entry:", error);
        return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }
}
