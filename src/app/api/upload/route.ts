import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthUser();
        if (!auth) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // Validate file type (images only)
        const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

        if (!validImageTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Supported: JPEG, PNG, GIF, WebP" },
                { status: 400 }
            );
        }

        // Validate file size (10MB max for images)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB" },
                { status: 400 }
            );
        }

        // Generate unique filename
        const ext = path.extname(file.name) || ".jpg";
        const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, "_");
        const timestamp = Date.now();
        const filename = `${baseName}_${timestamp}${ext}`;

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/${filename}`;

        return NextResponse.json({
            url: publicUrl,
            filename,
            size: file.size,
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json(
            { error: "Failed to upload file. Please try again." },
            { status: 500 }
        );
    }
}
