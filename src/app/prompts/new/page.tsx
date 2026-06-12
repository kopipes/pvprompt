"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PromptForm from "@/components/PromptForm";
import { useAuth } from "@/components/AuthContext";

interface Category {
    id: string;
    name: string;
    color: string;
}

export default function NewPromptPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        fetch("/api/categories")
            .then((res) => res.json())
            .then((data) => setCategories(data.categories || []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading) {
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

    if (!user) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Prompt</h1>
            <PromptForm categories={categories} />
        </div>
    );
}
