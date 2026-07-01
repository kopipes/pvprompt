"use client";

import Link from "next/link";
import { useState } from "react";
import { AI_TOOLS } from "@/lib/constants";

interface Category {
    id: string;
    name: string;
    color: string;
}

interface PromptCardProps {
    prompt: {
        id: string;
        title: string;
        aiTool: string;
        promptText: string;
        beforeImage: string | null;
        afterImage: string | null;
        categories: Category[];
        createdAt: string;
    };
}

export default function PromptCard({ prompt }: PromptCardProps) {
    const aiTool = AI_TOOLS.find((t) => t.value === prompt.aiTool);
    const displayImage = prompt.afterImage || prompt.beforeImage;
    const hasBothImages = prompt.beforeImage && prompt.afterImage;
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(prompt.promptText).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="relative group">
            <Link href={`/prompts/${prompt.id}`}>
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-[#b42d27] hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
                    {/* Image Preview */}
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                        {displayImage ? (
                            <img
                                src={displayImage}
                                alt={prompt.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
                                🖼️
                            </div>
                        )}

                        {/* Before/After badge */}
                        {hasBothImages && (
                            <div className="absolute top-3 right-3 px-2 py-1 bg-[#b42d27] rounded-lg text-xs font-medium text-white">
                                Before & After
                            </div>
                        )}

                        {/* AI Tool badge */}
                        <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-white/90 rounded-lg text-sm font-medium text-gray-900 flex items-center gap-1.5 shadow-sm">
                            <span>{aiTool?.icon || "🤖"}</span>
                            <span>{aiTool?.label || prompt.aiTool}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-[#b42d27] transition-colors">
                            {prompt.title}
                        </h3>

                        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                            {prompt.promptText}
                        </p>

                        {/* Categories */}
                        {prompt.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {prompt.categories.slice(0, 3).map((cat) => (
                                    <span
                                        key={cat.id}
                                        className="px-2 py-1 rounded-md text-xs font-medium"
                                        style={{
                                            backgroundColor: `${cat.color}15`,
                                            color: cat.color,
                                        }}
                                    >
                                        {cat.name}
                                    </span>
                                ))}
                                {prompt.categories.length > 3 && (
                                    <span className="px-2 py-1 rounded-md text-xs font-medium text-gray-500 bg-gray-100">
                                        +{prompt.categories.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            {/* Copy button — outside Link to avoid navigation */}
            <button
                type="button"
                onClick={handleCopy}
                className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-sm bg-white/90 text-gray-700 hover:bg-white hover:text-[#b42d27] border border-gray-200"
                aria-label="Copy prompt text"
            >
                {copied ? "Copied!" : "Copy"}
            </button>
        </div>
    );
}
