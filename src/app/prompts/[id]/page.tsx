"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AI_TOOLS, ASPECT_RATIOS } from "@/lib/constants";
import { useAuth } from "@/components/AuthContext";
import ConfirmModal from "@/components/ConfirmModal";

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
    categories: Category[];
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function PromptDetailPage({ params }: PageProps) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [lightbox, setLightbox] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/prompts/${resolvedParams.id}`)
            .then((res) => res.json())
            .then((data) => {
                setPrompt(data.prompt);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [resolvedParams.id]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/prompts/${resolvedParams.id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }
            router.push("/");
        } catch (error) {
            console.error("Failed to delete:", error);
            alert("Failed to delete prompt. Please try again.");
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const copyPrompt = async () => {
        if (!prompt) return;
        await navigator.clipboard.writeText(prompt.promptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="aspect-square bg-gray-100 rounded-2xl" />
                        <div className="aspect-square bg-gray-100 rounded-2xl" />
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
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
                <p className="text-gray-500 mb-6">This prompt may have been deleted or doesn&apos;t exist.</p>
                <Link href="/" className="text-[#b42d27] hover:text-[#8f2420]">
                    ← Back to home
                </Link>
            </div>
        );
    }

    const aiTool = AI_TOOLS.find((t) => t.value === prompt.aiTool);
    const aspectRatio = ASPECT_RATIOS.find((r) => r.value === prompt.aspectRatio);

    // Can edit/delete if owner OR admin
    const isOwner = user?.id === prompt.user.id;
    const isAdmin = user?.role === "admin";
    const canEdit = isOwner || isAdmin;

    const hasBothImages = prompt.beforeImage && prompt.afterImage;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            {/* Back button */}
            <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#b42d27] mb-6 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to browse
            </Link>

            {/* Before/After Images */}
            {(prompt.beforeImage || prompt.afterImage) && (
                <div className={`grid ${hasBothImages ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-8`}>
                    {prompt.beforeImage && (
                        <div className="relative">
                            <div className="absolute top-3 left-3 px-3 py-1 bg-black/70 rounded-lg text-xs font-medium text-white z-10">
                                Before / Reference
                            </div>
                            <button
                                type="button"
                                onClick={() => setLightbox(prompt.beforeImage)}
                                className="w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in"
                            >
                                <img
                                    src={prompt.beforeImage}
                                    alt="Before"
                                    className="w-full object-contain max-h-[400px]"
                                />
                            </button>
                        </div>
                    )}
                    {prompt.afterImage && (
                        <div className="relative">
                            <div className="absolute top-3 left-3 px-3 py-1 bg-[#b42d27] rounded-lg text-xs font-medium text-white z-10">
                                After / Result
                            </div>
                            <button
                                type="button"
                                onClick={() => setLightbox(prompt.afterImage)}
                                className="w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 hover:opacity-90 transition-opacity cursor-zoom-in"
                            >
                                <img
                                    src={prompt.afterImage}
                                    alt="After"
                                    className="w-full object-contain max-h-[400px]"
                                />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{prompt.title}</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1.5 bg-[#b42d27]/10 text-[#b42d27] rounded-lg text-sm font-medium border border-[#b42d27]/20">
                            {aiTool?.icon} {aiTool?.label || prompt.aiTool}
                        </span>
                        {prompt.modelVersion && (
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                                v{prompt.modelVersion}
                            </span>
                        )}
                        {aspectRatio && (
                            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                                {aspectRatio.label}
                            </span>
                        )}
                    </div>
                </div>

                {canEdit && (
                    <div className="flex gap-2">
                        <Link
                            href={`/prompts/${prompt.id}/edit`}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Edit
                        </Link>
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 bg-red-50 text-[#b42d27] rounded-lg hover:bg-red-100 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Categories */}
            {prompt.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                    {prompt.categories.map((cat) => (
                        <span
                            key={cat.id}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium"
                            style={{
                                backgroundColor: `${cat.color}15`,
                                color: cat.color,
                            }}
                        >
                            {cat.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Prompt Text */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Prompt</h3>
                    <button
                        type="button"
                        onClick={copyPrompt}
                        className="px-4 py-2 bg-[#b42d27] text-white text-sm rounded-lg hover:bg-[#8f2420] transition-colors flex items-center gap-2"
                    >
                        {copied ? (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                            </>
                        )}
                    </button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{prompt.promptText}</p>
            </div>

            {/* Negative Prompt */}
            {prompt.negativePrompt && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Negative Prompt</h3>
                    <p className="text-gray-500 whitespace-pre-wrap">{prompt.negativePrompt}</p>
                </div>
            )}

            {/* Meta info */}
            <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-200">
                <span>
                    Created by {prompt.user.name || prompt.user.email.split("@")[0]}
                </span>
                <span>
                    {new Date(prompt.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </span>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Prompt"
                message={`Are you sure you want to delete "${prompt.title}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
                isLoading={deleting}
            />

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
                    onClick={() => setLightbox(null)}
                    onKeyDown={(e) => e.key === "Escape" && setLightbox(null)}
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image preview"
                >
                    <button
                        type="button"
                        onClick={() => setLightbox(null)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none transition-colors"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                    <img
                        src={lightbox}
                        alt="preview"
                        className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
