"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UploadedImage {
    url: string;
    order: number;
}

interface PageProps {
    params: Promise<{ id: string; entryId: string }>;
}

export default function EditEntryPage({ params }: PageProps) {
    const { id, entryId } = use(params);
    const router = useRouter();

    const [notes, setNotes] = useState("");
    const [promptText, setPromptText] = useState("");
    const [inputImages, setInputImages] = useState<UploadedImage[]>([]);
    const [resultImages, setResultImages] = useState<UploadedImage[]>([]);
    const [uploadingInput, setUploadingInput] = useState(false);
    const [uploadingResult, setUploadingResult] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const inputRef = useRef<HTMLInputElement>(null);
    const resultRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`/api/projects/${id}/entries/${entryId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.entry) {
                    setNotes(data.entry.notes || "");
                    setPromptText(data.entry.promptText || "");
                    setInputImages(data.entry.images.filter((i: { type: string; url: string; order: number }) => i.type === "input").map((i: { url: string; order: number }) => ({ url: i.url, order: i.order })));
                    setResultImages(data.entry.images.filter((i: { type: string; url: string; order: number }) => i.type === "result").map((i: { url: string; order: number }) => ({ url: i.url, order: i.order })));
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id, entryId]);

    const uploadFiles = async (files: FileList, type: "input" | "result") => {
        const setter = type === "input" ? setInputImages : setResultImages;
        const setUploading = type === "input" ? setUploadingInput : setUploadingResult;
        setUploading(true);
        setError("");
        try {
            const uploaded: UploadedImage[] = [];
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append("file", files[i]);
                const res = await fetch("/api/upload", { method: "POST", body: formData });
                if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Upload failed"); }
                const data = await res.json();
                uploaded.push({ url: data.url, order: i });
            }
            setter((prev) => [...prev, ...uploaded.map((u, i) => ({ ...u, order: prev.length + i }))]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (type: "input" | "result", idx: number) => {
        const setter = type === "input" ? setInputImages : setResultImages;
        setter((prev) => prev.filter((_, i) => i !== idx).map((img, i) => ({ ...img, order: i })));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const res = await fetch(`/api/projects/${id}/entries/${entryId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes, promptText, inputImages, resultImages }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save"); }
            router.push(`/projects/${id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                    <div className="h-40 bg-gray-200 rounded-2xl" />
                    <div className="h-40 bg-gray-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/projects" className="hover:text-[#b42d27] transition-colors">Projects</Link>
                <span>/</span>
                <Link href={`/projects/${id}`} className="hover:text-[#b42d27] transition-colors">Project</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium">Edit Entry</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Entry</h1>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-[#b42d27] rounded-lg text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Notes (optional)</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Context, ideas, or notes..." rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b42d27] resize-none text-sm" />
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900">Input / Reference Images</label>
                            <p className="text-xs text-gray-500 mt-0.5">Gambar referensi (optional)</p>
                        </div>
                        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploadingInput} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 transition-colors">
                            {uploadingInput ? "Uploading..." : "+ Upload"}
                        </button>
                    </div>
                    <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files, "input")} />
                    {inputImages.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {inputImages.map((img, i) => (
                                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={img.url} alt="input" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeImage("input", i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-lg">×</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#b42d27] transition-colors" onClick={() => inputRef.current?.click()}>
                            <p className="text-sm text-gray-400">Click to upload reference images</p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Prompt Used</label>
                    <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="Tulis prompt yang kamu gunakan..." rows={4} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b42d27] resize-none text-sm font-mono" />
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900">Result Images</label>
                            <p className="text-xs text-gray-500 mt-0.5">Hasil dari AI</p>
                        </div>
                        <button type="button" onClick={() => resultRef.current?.click()} disabled={uploadingResult} className="px-3 py-1.5 bg-[#b42d27] text-white rounded-lg text-sm hover:bg-[#8f2420] disabled:opacity-50 transition-colors">
                            {uploadingResult ? "Uploading..." : "+ Upload"}
                        </button>
                    </div>
                    <input ref={resultRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files, "result")} />
                    {resultImages.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                            {resultImages.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={img.url} alt="result" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeImage("result", i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-2xl">×</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#b42d27] transition-colors" onClick={() => resultRef.current?.click()}>
                            <p className="text-sm text-gray-400">Click to upload result images</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={() => router.push(`/projects/${id}`)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                    <button type="submit" disabled={saving || uploadingInput || uploadingResult} className="flex-1 px-5 py-2.5 bg-[#b42d27] text-white font-semibold rounded-lg hover:bg-[#8f2420] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
