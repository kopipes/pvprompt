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

        // Validate file type and derive extension from MIME type (don't trust client extension)
        const mimeToExt: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/gif": ".gif",
            "image/webp": ".webp",
        };

        if (!mimeToExt[file.type]) {
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

        // Generate unique filename using server-determined extension from MIME type
        const ext = mimeToExt[file.type];
        const baseName = path.basename(file.name, path.extname(file.name)).replace(/[^a-zA-Z0-9]/g, "_").slice(0, 64);
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
