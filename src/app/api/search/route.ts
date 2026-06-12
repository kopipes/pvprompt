import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Search prompts
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q") || "";
        const aiTool = searchParams.get("aiTool");
        const categoryId = searchParams.get("categoryId");

        if (!q.trim()) {
            return NextResponse.json({ prompts: [] });
        }

        const where: Record<string, unknown> = {
            OR: [
                { title: { contains: q } },
                { promptText: { contains: q } },
                { aiTool: { contains: q } },
                { negativePrompt: { contains: q } },
            ],
        };

        if (aiTool) where.aiTool = aiTool;
        if (categoryId) {
            where.categories = {
                some: { id: categoryId },
            };
        }

        const prompts = await prisma.prompt.findMany({
            where,
            include: {
                categories: true,
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        return NextResponse.json({ prompts });
    } catch (error) {
        console.error("Error searching prompts:", error);
        return NextResponse.json(
            { error: "Failed to search prompts" },
            { status: 500 }
        );
    }
}
