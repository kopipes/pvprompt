"use client";

import { useState, useEffect, useCallback } from "react";
import { AI_TOOLS } from "@/lib/constants";

interface Category {
    id: string;
    name: string;
    color: string;
}

interface SearchBarProps {
    onSearch: (params: SearchParams) => void;
    categories: Category[];
}

interface SearchParams {
    q: string;
    aiTool: string;
    categoryId: string;
}

export default function SearchBar({ onSearch, categories }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [aiTool, setAiTool] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    // Debounced search
    const debouncedSearch = useCallback(
        (params: SearchParams) => {
            const timeoutId = setTimeout(() => onSearch(params), 300);
            return () => clearTimeout(timeoutId);
        },
        [onSearch]
    );

    useEffect(() => {
        const cleanup = debouncedSearch({ q: query, aiTool, categoryId });
        return cleanup;
    }, [query, aiTool, categoryId, debouncedSearch]);

    const clearFilters = () => {
        setQuery("");
        setAiTool("");
        setCategoryId("");
    };

    const hasActiveFilters = query || aiTool || categoryId;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-8 shadow-sm">
            {/* Main search input */}
            <div className="relative">
                <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search prompts, AI tools, or keywords..."
                    className="w-full pl-12 pr-32 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent transition-all text-lg"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-1.5 text-sm text-gray-500 hover:text-[#b42d27] transition-colors"
                        >
                            Clear
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${showFilters
                                ? "bg-[#b42d27] text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        Filters {hasActiveFilters && "•"}
                    </button>
                </div>
            </div>

            {/* Expandable filters */}
            {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                    {/* AI Tool select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">AI Tool</label>
                        <select
                            value={aiTool}
                            onChange={(e) => setAiTool(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent"
                        >
                            <option value="">All Tools</option>
                            {AI_TOOLS.map((tool) => (
                                <option key={tool.value} value={tool.value}>
                                    {tool.icon} {tool.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b42d27] focus:border-transparent"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}
