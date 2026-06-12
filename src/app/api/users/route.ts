import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

// GET - List all users (admin only)
export async function GET() {
    try {
        const auth = await getAuthUser();
        if (!auth || auth.role !== "admin") {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                _count: {
                    select: { prompts: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
