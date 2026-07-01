import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET - List prompts with filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const aiTool = searchParams.get("aiTool");
        const categoryId = searchParams.get("categoryId");
        const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
        const skip = (page - 1) * limit;

        const mine = searchParams.get("mine") === "true";
        const auth = await getAuthUser();

        const where: Record<string, unknown> = {
            projectEntries: { none: {} },
        };

        if (aiTool) where.aiTool = aiTool;
        if (categoryId) {
            where.categories = {
                some: { id: categoryId },
            };
        }
        if (mine && auth) {
            where.userId = auth.userId;
        }

        const [prompts, total] = await Promise.all([
            prisma.prompt.findMany({
                where,
                include: {
                    categories: true,
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.prompt.count({ where }),
        ]);

        return NextResponse.json({
            prompts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching prompts:", error);
        return NextResponse.json(
            { error: "Failed to fetch prompts" },
            { status: 500 }
        );
    }
}

// POST - Create new prompt
export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
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

        if (!title || !aiTool || !promptText) {
            return NextResponse.json(
                { error: "Title, AI tool, and prompt text are required" },
                { status: 400 }
            );
        }

        const prompt = await prisma.prompt.create({
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
                userId: auth.userId,
                categories: categoryIds?.length
                    ? { connect: categoryIds.map((id: string) => ({ id })) }
                    : undefined,
            },
            include: {
                categories: true,
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
        });

        return NextResponse.json({ prompt }, { status: 201 });
    } catch (error) {
        console.error("Error creating prompt:", error);
        return NextResponse.json(
            { error: "Failed to create prompt" },
            { status: 500 }
        );
    }
}
