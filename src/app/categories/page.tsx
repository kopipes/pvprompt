"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import ConfirmModal from "@/components/ConfirmModal";

interface Category {
    id: string;
    name: string;
    description: string | null;
    color: string;
    _count: {
        prompts: number;
    };
}

const COLOR_PRESETS = [
    "#b42d27", "#ef4444", "#f97316", "#f59e0b", "#eab308",
    "#84cc16", "#22c55e", "#14b8a6", "#06b6d4",
    "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
    "#d946ef", "#ec4899",
];

export default function CategoriesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "", color: "#b42d27" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Delete confirmation state
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
        isOpen: false,
        id: "",
        name: "",
    });
    const [deleting, setDeleting] = useState(false);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/categories");
            const data = await res.json();
            setCategories(data.categories || []);
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setSaving(true);
        setError("");

        try {
            const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save");
            }

            await fetchCategories();
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (category: Category) => {
        setFormData({
            name: category.name,
            description: category.description || "",
            color: category.color,
        });
        setEditingId(category.id);
        setShowForm(true);
    };

    const openDeleteModal = (id: string, name: string) => {
        setDeleteModal({ isOpen: true, id, name });
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/categories/${deleteModal.id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }
            await fetchCategories();
            setDeleteModal({ isOpen: false, id: "", name: "" });
        } catch (err) {
            console.error("Failed to delete:", err);
            alert("Failed to delete category. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: "", description: "", color: "#b42d27" });
        setEditingId(null);
        setShowForm(false);
        setError("");
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
                    <p className="text-gray-500">Organize your prompts with custom categories</p>
                </div>
                {user && !showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-[#b42d27] text-white font-semibold rounded-lg hover:bg-[#8f2420] transition-all shadow-md"
                    >
                        + New Category
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && user && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {editingId ? "Edit Category" : "Create Category"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Character Design"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Optional description"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {COLOR_PRESETS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color })}
                                        className={`w-8 h-8 rounded-lg transition-transform ${formData.color === color ? "ring-2 ring-gray-900 ring-offset-2 scale-110" : "hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[#b42d27] text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 bg-[#b42d27] text-white font-semibold rounded-lg hover:bg-[#8f2420] disabled:opacity-50 transition-colors"
                            >
                                {saving ? "Saving..." : editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Categories List */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-white rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-4 h-4 rounded-full bg-gray-200" />
                                <div className="h-5 bg-gray-200 rounded w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                    <div className="text-5xl mb-4">📁</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories yet</h3>
                    <p className="text-gray-500 mb-6">Create categories to organize your prompts</p>
                    {user && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-[#b42d27] text-white rounded-lg hover:bg-[#8f2420] transition-colors"
                        >
                            Create your first category
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-[#b42d27] transition-colors"
                        >
                            <button
                                type="button"
                                onClick={() => router.push(`/?categoryId=${category.id}`)}
                                className="flex items-center gap-4 flex-1 text-left min-w-0 cursor-pointer"
                            >
                                <div
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: category.color }}
                                />
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900 hover:text-[#b42d27] transition-colors">
                                        {category.name}
                                    </h3>
                                    {category.description && (
                                        <p className="text-sm text-gray-500">{category.description}</p>
                                    )}
                                </div>
                            </button>
                            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                <span className="text-sm text-gray-400">
                                    {category._count.prompts} prompt{category._count.prompts !== 1 ? "s" : ""}
                                </span>
                                {user && (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(category)}
                                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openDeleteModal(category.id, category.name)}
                                            className="px-3 py-1.5 text-sm bg-red-50 text-[#b42d27] rounded hover:bg-red-100 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete Category"
                message={`Are you sure you want to delete "${deleteModal.name}"? Prompts in this category will be unlinked.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, id: "", name: "" })}
                isLoading={deleting}
            />
        </div>
    );
}
