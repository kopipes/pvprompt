import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export function generateToken(userId: string, email: string, role: string = "member"): string {
    return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}

export async function getAuthUser(): Promise<TokenPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function isAdmin(): Promise<boolean> {
    const user = await getAuthUser();
    return user?.role === "admin";
}

export async function setAuthCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}

export async function clearAuthCookie() {
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");
}
