"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import AuthModal from "./AuthModal";

export default function Navbar() {
    const { user, loading, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const isAdmin = user?.role === "admin";

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-[#b42d27] rounded-xl flex items-center justify-center shadow-lg group-hover:bg-[#8f2420] transition-all">
                                <span className="text-xl text-white">🎨</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">
                                Pro<span className="text-[#b42d27]">Vault</span>
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-6">
                            <Link
                                href="/"
                                className="text-gray-600 hover:text-[#b42d27] transition-colors font-medium"
                            >
                                Browse
                            </Link>
                            <Link
                                href="/categories"
                                className="text-gray-600 hover:text-[#b42d27] transition-colors font-medium"
                            >
                                Categories
                            </Link>
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className="text-[#b42d27] hover:text-[#8f2420] transition-colors font-medium"
                                >
                                    Admin
                                </Link>
                            )}

                            {!loading && (
                                <>
                                    {user ? (
                                        <div className="flex items-center gap-4">
                                            <Link
                                                href="/prompts/new"
                                                className="px-4 py-2 bg-[#b42d27] text-white font-semibold rounded-lg hover:bg-[#8f2420] transition-all shadow-md"
                                            >
                                                + Add Prompt
                                            </Link>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-[#b42d27] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                                                    </div>
                                                    {isAdmin && (
                                                        <span className="px-2 py-0.5 bg-[#b42d27]/10 text-[#b42d27] text-xs font-medium rounded">
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={logout}
                                                    className="text-gray-500 hover:text-[#b42d27] transition-colors text-sm"
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowAuthModal(true)}
                                            className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
                                        >
                                            Sign In
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden text-gray-600 hover:text-[#b42d27]"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {showMobileMenu ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3">
                        <Link
                            href="/"
                            className="block text-gray-600 hover:text-[#b42d27] transition-colors font-medium py-2"
                            onClick={() => setShowMobileMenu(false)}
                        >
                            Browse
                        </Link>
                        <Link
                            href="/categories"
                            className="block text-gray-600 hover:text-[#b42d27] transition-colors font-medium py-2"
                            onClick={() => setShowMobileMenu(false)}
                        >
                            Categories
                        </Link>
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="block text-[#b42d27] hover:text-[#8f2420] transition-colors font-medium py-2"
                                onClick={() => setShowMobileMenu(false)}
                            >
                                Admin Panel
                            </Link>
                        )}
                        {!loading && (
                            <>
                                {user ? (
                                    <>
                                        <Link
                                            href="/prompts/new"
                                            className="block w-full px-4 py-2 bg-[#b42d27] text-white font-semibold rounded-lg text-center"
                                            onClick={() => setShowMobileMenu(false)}
                                        >
                                            + Add Prompt
                                        </Link>
                                        <button
                                            onClick={() => { logout(); setShowMobileMenu(false); }}
                                            className="w-full text-left text-gray-500 hover:text-[#b42d27] transition-colors py-2"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => { setShowAuthModal(true); setShowMobileMenu(false); }}
                                        className="w-full px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg"
                                    >
                                        Sign In
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </nav>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </>
    );
}
