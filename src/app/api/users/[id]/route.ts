import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, hashPassword } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT - Update user role or reset password (admin only)
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
        const body = await request.json();
        const { role, newPassword } = body;

        // Handle password reset
        if (newPassword) {
            if (newPassword.length < 6) {
                return NextResponse.json(
                    { error: "Password must be at least 6 characters" },
                    { status: 400 }
                );
            }

            const hashedPassword = await hashPassword(newPassword);
            await prisma.user.update({
                where: { id },
                data: { password: hashedPassword },
            });

            return NextResponse.json({ success: true, message: "Password updated" });
        }

        // Handle role change
        if (role) {
            if (!["admin", "member"].includes(role)) {
                return NextResponse.json(
                    { error: "Invalid role" },
                    { status: 400 }
                );
            }

            // Prevent admin from demoting themselves
            if (id === auth.userId && role !== "admin") {
                return NextResponse.json(
                    { error: "Cannot change your own role" },
                    { status: 400 }
                );
            }

            const user = await prisma.user.update({
                where: { id },
                data: { role },
                select: { id: true, email: true, name: true, role: true },
            });

            return NextResponse.json({ user });
        }

        return NextResponse.json(
            { error: "No action specified" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

// DELETE - Delete user (admin only)
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

        // Prevent admin from deleting themselves
        if (id === auth.userId) {
            return NextResponse.json(
                { error: "Cannot delete yourself" },
                { status: 400 }
            );
        }

        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
