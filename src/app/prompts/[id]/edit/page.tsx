"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import PromptForm from "@/components/PromptForm";
import { useAuth } from "@/components/AuthContext";

interface Category {
    id: string;
    name: string;
    color: string;
}

interface Prompt {
    id: string;
    title: string;
    aiTool: string;
    promptText: string;
    negativePrompt: string | null;
    modelVersion: string | null;
    aspectRatio: string | null;
    beforeImage: string | null;
    afterImage: string | null;
    categories: { id: string }[];
    user: { id: string };
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditPromptPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(`/api/prompts/${resolvedParams.id}`).then((res) => res.json()),
            fetch("/api/categories").then((res) => res.json()),
        ])
            .then(([promptData, categoryData]) => {
                setPrompt(promptData.prompt);
                setCategories(categoryData.categories || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [resolvedParams.id]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        // Allow if owner OR admin
        if (prompt && user) {
            const isOwner = prompt.user.id === user.id;
            const isAdmin = user.role === "admin";
            if (!isOwner && !isAdmin) {
                router.push(`/prompts/${resolvedParams.id}`);
            }
        }
    }, [prompt, user, resolvedParams.id, router]);

    if (loading || authLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-8" />
                    <div className="bg-white rounded-2xl p-8 border border-gray-200">
                        <div className="space-y-6">
                            <div className="h-12 bg-gray-100 rounded" />
                            <div className="h-12 bg-gray-100 rounded" />
                            <div className="h-32 bg-gray-100 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!prompt) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <div className="text-6xl mb-4">😕</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Prompt not found</h2>
                <p className="text-gray-500">This prompt may have been deleted.</p>
            </div>
        );
    }

    // Check permissions
    const isOwner = user && prompt.user.id === user.id;
    const isAdmin = user?.role === "admin";
    if (!user || (!isOwner && !isAdmin)) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Prompt</h1>
            <PromptForm
                categories={categories}
                initialData={{
                    id: prompt.id,
                    title: prompt.title,
                    aiTool: prompt.aiTool,
                    promptText: prompt.promptText,
                    negativePrompt: prompt.negativePrompt || "",
                    modelVersion: prompt.modelVersion || "",
                    aspectRatio: prompt.aspectRatio || "",
                    beforeImage: prompt.beforeImage || "",
                    afterImage: prompt.afterImage || "",
                    categoryIds: prompt.categories.map((c) => c.id),
                }}
            />
        </div>
    );
}
