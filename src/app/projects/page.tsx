"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import ConfirmModal from "@/components/ConfirmModal";

interface Project {
    id: string;
    title: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { entries: number };
    entries: {
        images: { url: string; type: string }[];
    }[];
}

export default function ProjectsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: "", description: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; title: string }>({
        isOpen: false, id: "", title: "",
    });
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/projects");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setProjects(data.projects || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchProjects();
    }, [user]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) return;
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create");
            }
            const data = await res.json();
            setProjects((prev) => [{ ...data.project, entries: [] }, ...prev]);
            setShowForm(false);
            setFormData({ title: "", description: "" });
            router.push(`/projects/${data.project.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create project");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/projects/${deleteModal.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            setProjects((prev) => prev.filter((p) => p.id !== deleteModal.id));
            setDeleteModal({ isOpen: false, id: "", title: "" });
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };

    // Reset page when search changes
    useEffect(() => { setPage(1); }, [search]);

    if (authLoading || (!user && !authLoading)) return null;

    const filtered = projects.filter((p) => {
        const q = search.toLowerCase();
        return !q || p.title.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
    });
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
                    <p className="text-gray-500 mt-1">Kumpulkan gambar dan prompt dalam satu project</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-[#b42d27] text-white rounded-lg hover:bg-[#8f2420] transition-colors font-medium"
                >
                    + New Project
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b42d27]/20 focus:border-[#b42d27] bg-white text-sm transition-colors"
                />
            </div>

            {/* Create form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">New Project</h2>
                    {error && (
                        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-[#b42d27] rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                                placeholder="e.g. Character Concept Art"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Optional description..."
                                rows={2}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent resize-none"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setError(""); }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !formData.title.trim()}
                                className="px-6 py-2 bg-[#b42d27] text-white rounded-lg hover:bg-[#8f2420] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {saving ? "Creating..." : "Create Project"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Projects list */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-200 p-5">
                            <div className="aspect-video bg-gray-200 rounded-xl mb-4" />
                            <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                    <div className="text-5xl mb-4">📁</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-500 mb-6">Create a project to start collecting your AI image results</p>
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="px-5 py-2.5 bg-[#b42d27] text-white rounded-lg hover:bg-[#8f2420] transition-colors font-medium"
                    >
                        Create your first project
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-200">
                    No projects match &ldquo;{search}&rdquo;
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {paginated.map((project) => {
                            const thumb = project.entries?.[0]?.images?.[0]?.url;
                            return (
                                <div
                                    key={project.id}
                                    className="bg-white rounded-2xl border border-gray-200 hover:border-[#b42d27] hover:shadow-md transition-all flex flex-col overflow-hidden"
                                >
                                    {/* Thumbnail */}
                                    <Link href={`/projects/${project.id}`} className="block">
                                        <div className="aspect-video bg-gray-100 overflow-hidden">
                                            {thumb ? (
                                                <img src={thumb} alt={project.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🖼️</div>
                                            )}
                                        </div>
                                    </Link>
                                    {/* Info */}
                                    <div className="p-4 flex-1 flex flex-col">
                                        <Link href={`/projects/${project.id}`} className="block flex-1">
                                            <h3 className="text-base font-semibold text-gray-900 hover:text-[#b42d27] transition-colors line-clamp-1">
                                                {project.title}
                                            </h3>
                                            {project.description && (
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                                <span>{project._count.entries} / 50 entries</span>
                                                <span>·</span>
                                                <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                        </Link>
                                        <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                                            <button
                                                type="button"
                                                onClick={() => setDeleteModal({ isOpen: true, id: project.id, title: project.title })}
                                                className="text-xs text-gray-400 hover:text-[#b42d27] transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <p className="text-sm text-gray-400">
                                {filtered.length} projects · page {page} of {totalPages}
                            </p>
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    ← Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPage(p)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                            p === page
                                                ? "bg-[#b42d27] text-white border-[#b42d27]"
                                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete Project"
                message={`Delete "${deleteModal.title}"? All entries and images in this project will be removed.`}
                confirmText="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, id: "", title: "" })}
                isLoading={deleting}
            />
        </div>
    );
}
