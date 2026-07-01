"use client";

import { useState, useEffect, useRef } from "react";
import { AI_TOOLS } from "@/lib/constants";

interface PickerPrompt {
    id: string;
    title: string;
    aiTool: string;
    promptText: string;
    beforeImage: string | null;
    afterImage: string | null;
}

interface PromptPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (prompt: PickerPrompt) => void;
    isAdmin?: boolean;
}

export default function PromptPickerModal({ isOpen, onClose, onSelect, isAdmin = false }: PromptPickerModalProps) {
    const [prompts, setPrompts] = useState<PickerPrompt[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setSearch("");
        setLoading(true);
        // Admin sees all prompts; others only see their own
        const url = isAdmin ? "/api/prompts?limit=100" : "/api/prompts?limit=100&mine=true";
        fetch(url)
            .then((r) => r.json())
            .then((data) => setPrompts(data.prompts ?? []))
            .catch(() => setPrompts([]))
            .finally(() => setLoading(false));
    }, [isOpen, isAdmin]);

    // Focus search input when modal opens
    useEffect(() => {
        if (isOpen && searchRef.current) {
            setTimeout(() => searchRef.current?.focus(), 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const q = search.toLowerCase();
    const filtered = prompts.filter(
        (p) =>
            p.title.toLowerCase().includes(q) ||
            p.aiTool.toLowerCase().includes(q) ||
            p.promptText.toLowerCase().includes(q)
    );

    const handleSelect = (prompt: PickerPrompt) => {
        onSelect(prompt);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Pick from library</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Search */}
                <div className="px-6 py-3 border-b border-gray-100">
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search by title, tool, or text..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b42d27]/20 focus:border-[#b42d27] transition-colors"
                    />
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
                    {loading && (
                        <div className="text-center text-gray-400 text-sm py-10">Loading prompts...</div>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-10">
                            {prompts.length === 0 ? "No prompts in your library yet." : "No prompts match your search."}
                        </div>
                    )}
                    {!loading && filtered.map((prompt) => {
                        const tool = AI_TOOLS.find((t) => t.value === prompt.aiTool);
                        const hasImages = prompt.beforeImage || prompt.afterImage;
                        return (
                            <button
                                key={prompt.id}
                                type="button"
                                onClick={() => handleSelect(prompt)}
                                className="w-full text-left rounded-xl border border-gray-200 hover:border-[#b42d27] hover:bg-red-50/40 transition-all group overflow-hidden"
                            >
                                {/* Images row */}
                                {hasImages && (
                                    <div className="flex gap-0 h-28 bg-gray-100">
                                        {prompt.beforeImage ? (
                                            <div className="flex-1 relative overflow-hidden">
                                                <img src={prompt.beforeImage} alt="before" className="w-full h-full object-cover" />
                                                <span className="absolute bottom-1.5 left-1.5 text-[10px] px-1.5 py-0.5 bg-black/50 text-white rounded font-medium">Before</span>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-gray-300 text-2xl bg-gray-50">
                                                🖼️
                                            </div>
                                        )}
                                        {prompt.afterImage ? (
                                            <div className="flex-1 relative overflow-hidden border-l border-white/20">
                                                <img src={prompt.afterImage} alt="after" className="w-full h-full object-cover" />
                                                <span className="absolute bottom-1.5 left-1.5 text-[10px] px-1.5 py-0.5 bg-[#b42d27]/80 text-white rounded font-medium">After</span>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-gray-300 text-2xl bg-gray-50 border-l border-gray-200">
                                                🖼️
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Text content */}
                                <div className="px-4 py-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-base">{tool?.icon ?? "🤖"}</span>
                                        <span className="font-medium text-gray-900 text-sm group-hover:text-[#b42d27] transition-colors truncate">
                                            {prompt.title}
                                        </span>
                                        <span className="ml-auto text-xs text-gray-400 whitespace-nowrap shrink-0">
                                            {tool?.label ?? prompt.aiTool}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                        {prompt.promptText}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
