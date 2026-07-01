"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import ConfirmModal from "@/components/ConfirmModal";

interface ProjectImage {
    id: string;
    url: string;
    type: string;
    order: number;
}

interface ProjectEntry {
    id: string;
    notes: string | null;
    promptText: string | null;
    createdAt: string;
    images: ProjectImage[];
    prompt: { id: string; title: string; aiTool: string } | null;
}

interface Project {
    id: string;
    title: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    user: { id: string; name: string | null; email: string };
    entries: ProjectEntry[];
    _count: { entries: number };
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({ title: "", description: "" });
    const [saving, setSaving] = useState(false);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; entryId: string; idx: number }>({
        isOpen: false, entryId: "", idx: 0,
    });
    const [deleting, setDeleting] = useState(false);
    const [deleteProjectModal, setDeleteProjectModal] = useState(false);
    const [deletingProject, setDeletingProject] = useState(false);
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [collapsedEntries, setCollapsedEntries] = useState<Set<string>>(new Set());
    const [copiedEntryId, setCopiedEntryId] = useState<string | null>(null);

    const handleCopyPrompt = (entryId: string, text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedEntryId(entryId);
            setTimeout(() => setCopiedEntryId(null), 2000);
        });
    };

    useEffect(() => {
        if (!authLoading && !user) router.push("/");
    }, [user, authLoading, router]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/projects/${id}`);
            if (!res.ok) { router.push("/projects"); return; }
            const data = await res.json();
            setProject(data.project);
            setEditData({ title: data.project.title, description: data.project.description || "" });
            // Collapse all entries except the last one on initial load
            if (data.project.entries.length > 1) {
                setCollapsedEntries(new Set(data.project.entries.slice(0, -1).map((e: ProjectEntry) => e.id)));
            }
        } catch {
            router.push("/projects");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchProject();
    }, [user, id]);

    const handleSaveEdit = async () => {
        if (!editData.title.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setProject((p) => p ? { ...p, title: data.project.title, description: data.project.description } : p);
            setEditMode(false);
        } catch { /* ignore */ } finally {
            setSaving(false);
        }
    };

    const handleDeleteEntry = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/projects/${id}/entries/${deleteModal.entryId}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            setProject((p) => p ? { ...p, entries: p.entries.filter((e) => e.id !== deleteModal.entryId), _count: { entries: p._count.entries - 1 } } : p);
            setDeleteModal({ isOpen: false, entryId: "", idx: 0 });
        } catch { /* ignore */ } finally {
            setDeleting(false);
        }
    };

    const handleDeleteProject = async () => {
        setDeletingProject(true);
        try {
            const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            router.push("/projects");
        } catch { /* ignore */ } finally {
            setDeletingProject(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-48 bg-gray-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!project) return null;

    const isOwner = user?.id === project.user.id;
    const canEdit = isOwner || user?.role === "admin";
    const inputImages = (entry: ProjectEntry) => entry.images.filter((i) => i.type === "input");
    const resultImages = (entry: ProjectEntry) => entry.images.filter((i) => i.type === "result");

    const toggleCollapse = (entryId: string) => {
        setCollapsedEntries((prev) => {
            const next = new Set(prev);
            if (next.has(entryId)) next.delete(entryId);
            else next.add(entryId);
            return next;
        });
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/projects" className="hover:text-[#b42d27] transition-colors">Projects</Link>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate">{project.title}</span>
            </div>

            {/* Project header */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                {editMode ? (
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={editData.title}
                            onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
                            className="w-full text-2xl font-bold px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b42d27]"
                        />
                        <textarea
                            value={editData.description}
                            onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Description..."
                            rows={2}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b42d27] resize-none text-sm"
                        />
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setEditMode(false)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">Cancel</button>
                            <button type="button" onClick={handleSaveEdit} disabled={saving} className="px-4 py-1.5 bg-[#b42d27] text-white rounded-lg text-sm hover:bg-[#8f2420] disabled:opacity-50 transition-colors">{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                            {project.description && <p className="text-gray-500 mt-1 text-sm">{project.description}</p>}
                            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                                <span>{project._count.entries} / 50 entries</span>
                                <span>·</span>
                                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        {canEdit && (
                            <div className="flex gap-2 flex-shrink-0">
                                <button type="button" onClick={() => setEditMode(true)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">Edit</button>
                                <button type="button" onClick={() => setDeleteProjectModal(true)} className="px-3 py-1.5 bg-red-50 text-[#b42d27] rounded-lg text-sm hover:bg-red-100 transition-colors">Delete</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add entry button */}
            {canEdit && project._count.entries < 50 && (
                <div className="flex justify-end mb-4">
                    <Link
                        href={`/projects/${id}/entries/new`}
                        className="px-4 py-2 bg-[#b42d27] text-white rounded-lg hover:bg-[#8f2420] transition-colors font-medium text-sm"
                    >
                        + Add Entry
                    </Link>
                </div>
            )}

            {/* Entries */}
            {project.entries.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <div className="text-5xl mb-3">📸</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No entries yet</h3>
                    <p className="text-gray-500 text-sm mb-4">Add your first entry to start documenting your AI image process</p>
                    {canEdit && (
                        <Link href={`/projects/${id}/entries/new`} className="px-4 py-2 bg-[#b42d27] text-white rounded-lg hover:bg-[#8f2420] transition-colors text-sm font-medium">
                            Add First Entry
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {project.entries.map((entry, idx) => {
                        const isCollapsed = collapsedEntries.has(entry.id);
                        return (
                        <div key={entry.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            {/* Entry header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                                <span className="text-sm font-medium text-gray-500">Entry #{idx + 1}</span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleDateString()}</span>
                                    {canEdit && (
                                        <div className="flex gap-2">
                                            <Link href={`/projects/${id}/entries/${entry.id}/edit`} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Edit</Link>
                                            <button type="button" onClick={() => setDeleteModal({ isOpen: true, entryId: entry.id, idx })} className="text-xs text-gray-400 hover:text-[#b42d27] transition-colors">Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Notes */}
                                {entry.notes && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                                        <p className="text-sm text-gray-700">{entry.notes}</p>
                                    </div>
                                )}

                                {/* Input images */}
                                {inputImages(entry).length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Input Images</p>
                                        <div className="flex flex-wrap gap-2">
                                            {inputImages(entry).map((img) => (
                                                <button key={img.id} type="button" onClick={() => setLightbox(img.url)} className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-[#b42d27] transition-colors flex-shrink-0">
                                                    <img src={img.url} alt="input" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Prompt — collapsible */}
                                {entry.promptText && (
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => toggleCollapse(entry.id)}
                                            className="flex items-center gap-2 mb-1 group"
                                        >
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide group-hover:text-gray-600 transition-colors">Prompt</p>
                                            {entry.prompt && (
                                                <Link
                                                    href={`/prompts/${entry.prompt.id}`}
                                                    className="text-xs px-2 py-0.5 rounded-md bg-red-50 text-[#b42d27] border border-red-100 hover:bg-red-100 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    From library: {entry.prompt.title}
                                                </Link>
                                            )}
                                            <span className="text-gray-300 text-xs ml-1">{isCollapsed ? "▶ show" : "▼ hide"}</span>
                                        </button>
                                        <div className="flex items-center justify-between mb-1">
                                            <button
                                                type="button"
                                                onClick={() => handleCopyPrompt(entry.id, entry.promptText!)}
                                                className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-[#b42d27] transition-colors"
                                            >
                                                {copiedEntryId === entry.id ? "Copied!" : "Copy"}
                                            </button>
                                        </div>
                                        {!isCollapsed && (
                                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">{entry.promptText}</pre>
                                        )}
                                        {isCollapsed && (
                                            <p className="text-xs text-gray-400 italic truncate">
                                                {entry.promptText.slice(0, 80)}{entry.promptText.length > 80 ? "…" : ""}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Result images */}
                                {resultImages(entry).length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Results</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {resultImages(entry).map((img) => (
                                                <button key={img.id} type="button" onClick={() => setLightbox(img.url)} className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-[#b42d27] transition-colors">
                                                    <img src={img.url} alt="result" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}

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

            {/* Delete entry modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete Entry"
                message={`Delete Entry #${deleteModal.idx + 1}? This action cannot be undone.`}
                confirmText="Delete"
                onConfirm={handleDeleteEntry}
                onCancel={() => setDeleteModal({ isOpen: false, entryId: "", idx: 0 })}
                isLoading={deleting}
            />

            {/* Delete project modal */}
            <ConfirmModal
                isOpen={deleteProjectModal}
                title="Delete Project"
                message={`Delete "${project.title}"? All entries and images will be removed permanently.`}
                confirmText="Delete"
                onConfirm={handleDeleteProject}
                onCancel={() => setDeleteProjectModal(false)}
                isLoading={deletingProject}
            />
        </div>
    );
}
