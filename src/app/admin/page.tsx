"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import ConfirmModal from "@/components/ConfirmModal";

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
    _count: {
        prompts: number;
    };
}

export default function AdminPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; email: string }>({
        isOpen: false,
        id: "",
        email: "",
    });
    const [deleting, setDeleting] = useState(false);

    // Password reset state
    const [resetModal, setResetModal] = useState<{ isOpen: boolean; id: string; email: string }>({
        isOpen: false,
        id: "",
        email: "",
    });
    const [newPassword, setNewPassword] = useState("");
    const [resetting, setResetting] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setUsers(data.users || []);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== "admin") {
                router.push("/");
            } else {
                fetchUsers();
            }
        }
    }, [user, authLoading, router]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update");
            }
            await fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update role");
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/users/${deleteModal.id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete");
            }
            await fetchUsers();
            setDeleteModal({ isOpen: false, id: "", email: "" });
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete user");
        } finally {
            setDeleting(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        setResetting(true);
        try {
            const res = await fetch(`/api/users/${resetModal.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to reset password");
            }
            alert("Password reset successfully!");
            setResetModal({ isOpen: false, id: "", email: "" });
            setNewPassword("");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to reset password");
        } finally {
            setResetting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-8" />
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
                <p className="text-gray-500">Manage users, roles, and passwords</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">User</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Role</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Prompts</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Joined</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{u.name || "No name"}</div>
                                            <div className="text-sm text-gray-500">{u.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            disabled={u.id === user.id}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${u.role === "admin"
                                                    ? "bg-[#b42d27]/10 text-[#b42d27] border-[#b42d27]/20"
                                                    : "bg-gray-100 text-gray-700 border-gray-200"
                                                } ${u.id === user.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="member">Member</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-600">{u._count.prompts}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-500">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => setResetModal({ isOpen: true, id: u.id, email: u.email })}
                                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Reset Password
                                            </button>
                                            {u.id !== user.id && (
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, id: u.id, email: u.email })}
                                                    className="px-3 py-1.5 text-sm bg-red-50 text-[#b42d27] rounded-lg hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                            {u.id === user.id && (
                                                <span className="text-sm text-gray-400 py-1.5">You</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete User"
                message={`Are you sure you want to delete "${deleteModal.email}"? All their prompts will also be deleted.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, id: "", email: "" })}
                isLoading={deleting}
            />

            {/* Reset Password Modal */}
            {resetModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h2>
                        <p className="text-gray-600 mb-4">
                            Set a new password for <strong>{resetModal.email}</strong>
                        </p>

                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password (min 6 characters)"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent mb-4"
                        />

                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setResetModal({ isOpen: false, id: "", email: "" });
                                    setNewPassword("");
                                }}
                                disabled={resetting}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                disabled={resetting || newPassword.length < 6}
                                className="px-4 py-2 bg-[#b42d27] text-white rounded-lg hover:bg-[#8f2420] transition-colors disabled:opacity-50"
                            >
                                {resetting ? "Resetting..." : "Reset Password"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
