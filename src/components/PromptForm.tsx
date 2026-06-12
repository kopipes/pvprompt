"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AI_TOOLS, ASPECT_RATIOS } from "@/lib/constants";

interface Category {
    id: string;
    name: string;
    color: string;
}

interface PromptFormProps {
    categories: Category[];
    initialData?: {
        id?: string;
        title: string;
        aiTool: string;
        promptText: string;
        negativePrompt?: string;
        modelVersion?: string;
        aspectRatio?: string;
        beforeImage?: string;
        afterImage?: string;
        categoryIds: string[];
    };
}

export default function PromptForm({ categories, initialData }: PromptFormProps) {
    const router = useRouter();
    const beforeInputRef = useRef<HTMLInputElement>(null);
    const afterInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: initialData?.title || "",
        aiTool: initialData?.aiTool || "",
        promptText: initialData?.promptText || "",
        negativePrompt: initialData?.negativePrompt || "",
        modelVersion: initialData?.modelVersion || "",
        aspectRatio: initialData?.aspectRatio || "",
        beforeImage: initialData?.beforeImage || "",
        afterImage: initialData?.afterImage || "",
        categoryIds: initialData?.categoryIds || [],
    });

    const [uploadingBefore, setUploadingBefore] = useState(false);
    const [uploadingAfter, setUploadingAfter] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleFileUpload = async (
        file: File,
        type: "before" | "after"
    ) => {
        if (type === "before") setUploadingBefore(true);
        else setUploadingAfter(true);
        setError("");

        try {
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formDataUpload,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            const data = await res.json();
            if (type === "before") {
                setFormData((prev) => ({ ...prev, beforeImage: data.url }));
            } else {
                setFormData((prev) => ({ ...prev, afterImage: data.url }));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            if (type === "before") setUploadingBefore(false);
            else setUploadingAfter(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const url = initialData?.id
                ? `/api/prompts/${initialData.id}`
                : "/api/prompts";
            const method = initialData?.id ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save prompt");
            }

            const data = await res.json();
            router.push(`/prompts/${data.prompt.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const toggleCategory = (categoryId: string) => {
        setFormData((prev) => ({
            ...prev,
            categoryIds: prev.categoryIds.includes(categoryId)
                ? prev.categoryIds.filter((id) => id !== categoryId)
                : [...prev.categoryIds, categoryId],
        }));
    };

    const ImageUploadBox = ({
        label,
        value,
        uploading,
        inputRef,
        onFileChange,
        onClear,
    }: {
        label: string;
        value: string;
        uploading: boolean;
        inputRef: React.RefObject<HTMLInputElement | null>;
        onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onClear: () => void;
    }) => (
        <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#b42d27] transition-colors bg-gray-50 min-h-[180px] flex flex-col items-center justify-center"
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                />
                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin w-8 h-8 border-2 border-[#b42d27] border-t-transparent rounded-full" />
                        <span className="text-gray-500 text-sm">Uploading...</span>
                    </div>
                ) : value ? (
                    <div className="relative w-full">
                        <img src={value} alt={label} className="max-h-40 mx-auto rounded-lg object-contain" />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClear();
                            }}
                            className="absolute top-1 right-1 p-1 bg-[#b42d27] rounded-full text-white hover:bg-[#8f2420]"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div className="text-gray-500">
                        <span className="text-3xl mb-2 block">📷</span>
                        <span className="text-sm">Click to upload</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
                {/* Title */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title <span className="text-[#b42d27]">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="e.g., Cyberpunk City at Night"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent transition-all"
                    />
                </div>

                {/* AI Tool & Model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            AI Tool <span className="text-[#b42d27]">*</span>
                        </label>
                        <select
                            value={formData.aiTool}
                            onChange={(e) => setFormData({ ...formData, aiTool: e.target.value })}
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent"
                        >
                            <option value="">Select AI Tool</option>
                            {AI_TOOLS.map((tool) => (
                                <option key={tool.value} value={tool.value}>
                                    {tool.icon} {tool.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Model Version
                        </label>
                        <input
                            type="text"
                            value={formData.modelVersion}
                            onChange={(e) => setFormData({ ...formData, modelVersion: e.target.value })}
                            placeholder="e.g., v5.2, XL 1.0"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Prompt Text */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prompt <span className="text-[#b42d27]">*</span>
                    </label>
                    <textarea
                        value={formData.promptText}
                        onChange={(e) => setFormData({ ...formData, promptText: e.target.value })}
                        required
                        rows={4}
                        placeholder="Enter your prompt here..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent resize-none"
                    />
                </div>

                {/* Negative Prompt */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Negative Prompt
                    </label>
                    <textarea
                        value={formData.negativePrompt}
                        onChange={(e) => setFormData({ ...formData, negativePrompt: e.target.value })}
                        rows={2}
                        placeholder="Things to avoid in the generation..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent resize-none"
                    />
                </div>

                {/* Aspect Ratio */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                    <select
                        value={formData.aspectRatio}
                        onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent"
                    >
                        <option value="">Select Ratio</option>
                        {ASPECT_RATIOS.map((ratio) => (
                            <option key={ratio.value} value={ratio.value}>
                                {ratio.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Before/After Image Upload */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Sample Images</label>
                    <div className="flex gap-4">
                        <ImageUploadBox
                            label="Before / Reference Image"
                            value={formData.beforeImage}
                            uploading={uploadingBefore}
                            inputRef={beforeInputRef}
                            onFileChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, "before");
                            }}
                            onClear={() => setFormData({ ...formData, beforeImage: "" })}
                        />
                        <ImageUploadBox
                            label="After / Result Image"
                            value={formData.afterImage}
                            uploading={uploadingAfter}
                            inputRef={afterInputRef}
                            onFileChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, "after");
                            }}
                            onClear={() => setFormData({ ...formData, afterImage: "" })}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Max 50MB each • JPEG, PNG, GIF, WebP</p>
                </div>

                {/* Categories */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Categories</label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => toggleCategory(cat.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.categoryIds.includes(cat.id)
                                        ? "ring-2 ring-offset-2"
                                        : "hover:opacity-80"
                                    }`}
                                style={{
                                    backgroundColor: `${cat.color}15`,
                                    color: cat.color,
                                    ...(formData.categoryIds.includes(cat.id) && {
                                        boxShadow: `0 0 0 2px white, 0 0 0 4px ${cat.color}`,
                                    }),
                                }}
                            >
                                {cat.name}
                            </button>
                        ))}
                        {categories.length === 0 && (
                            <span className="text-gray-400 text-sm">No categories yet. Create some in the Categories page.</span>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-[#b42d27]">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-[#b42d27] text-white font-semibold rounded-lg hover:bg-[#8f2420] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {saving ? "Saving..." : initialData?.id ? "Update Prompt" : "Create Prompt"}
                    </button>
                </div>
            </div>
        </form>
    );
}
