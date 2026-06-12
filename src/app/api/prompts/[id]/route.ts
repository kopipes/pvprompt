import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Get single prompt
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const prompt = await prisma.prompt.findUnique({
            where: { id },
            include: {
                categories: true,
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ prompt });
    } catch (error) {
        console.error("Error fetching prompt:", error);
        return NextResponse.json(
            { error: "Failed to fetch prompt" },
            { status: 500 }
        );
    }
}

// PUT - Update prompt (owner or admin)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();

        // Check ownership or admin status
        const existingPrompt = await prisma.prompt.findUnique({
            where: { id },
        });

        if (!existingPrompt) {
            return NextResponse.json(
                { error: "Prompt not found" },
                { status: 404 }
            );
        }

        // Allow if owner OR admin
        const isOwner = existingPrompt.userId === auth.userId;
        const isAdmin = auth.role === "admin";

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const {
            title,
            aiTool,
            promptText,
            negativePrompt,
            modelVersion,
            aspectRatio,
            beforeImage,
            afterImage,
            settings,
            categoryIds,
        } = body;

        const prompt = await prisma.prompt.update({
            where: { id },
            data: {
                title,
                aiTool,
                promptText,
                negativePrompt,
                modelVersion,
                aspectRatio,
                beforeImage,
                afterImage,
                settings: settings ? JSON.stringify(settings) : undefined,
                categories: categoryIds
                    ? { set: categoryIds.map((cid: string) => ({ id: cid })) }
                    : undefined,
            },
            include: {
                categories: true,
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json({ prompt });
    } catch (error) {
        console.error("Error updating prompt:", error);
        return NextResponse.json(
            { error: "Failed to update prompt" },
            { status: 500 }
        );
    }
}

// DELETE - Delete prompt (owner or admin)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Check ownership or admin status
        const existingPrompt = await prisma.prompt.findUnique({
            where: { id },
        });

        if (!existingPrompt) {
            return NextResponse.json(
                { error: "Prompt not found" },
                { status: 404 }
            );
        }

        // Allow if owner OR admin
        const isOwner = existingPrompt.userId === auth.userId;
        const isAdmin = auth.role === "admin";

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        await prisma.prompt.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting prompt:", error);
        return NextResponse.json(
            { error: "Failed to delete prompt" },
            { status: 500 }
        );
    }
}
