"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PromptCard from "@/components/PromptCard";
import SearchBar from "@/components/SearchBar";

const PAGE_SIZE = 12;

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Prompt {
  id: string;
  title: string;
  aiTool: string;
  promptText: string;
  beforeImage: string | null;
  afterImage: string | null;
  categories: Category[];
  createdAt: string;
}

interface SearchParams {
  q: string;
  aiTool: string;
  categoryId: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

export default function HomePageWrapper() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  );
}

function HomePage() {
  const searchParamsFromUrl = useSearchParams();
  const initialCategoryId = searchParamsFromUrl.get("categoryId") ?? "";

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  const [searchParams, setSearchParams] = useState<SearchParams>({
    q: "",
    aiTool: "",
    categoryId: initialCategoryId,
  });

  // Reset to page 1 when filters change
  const handleSearch = useCallback((params: SearchParams) => {
    setPage(1);
    setSearchParams(params);
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error);
  }, []);

  // Fetch prompts based on search params and page
  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.q) params.set("q", searchParams.q);
      if (searchParams.aiTool) params.set("aiTool", searchParams.aiTool);
      if (searchParams.categoryId) params.set("categoryId", searchParams.categoryId);

      let url: string;
      if (searchParams.q) {
        // search route doesn't support pagination — fetch all then slice client-side
        url = `/api/search?${params}`;
      } else {
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));
        url = `/api/prompts?${params}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setPrompts(data.prompts || []);

      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        // search API returns flat list — compute pagination client-side
        const total = (data.prompts || []).length;
        setPagination({ page: 1, totalPages: 1, total });
      }
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    } finally {
      setLoading(false);
    }
  }, [searchParams, page]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  // Scroll to top of grid on page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-gray-200">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#b42d27]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gray-200/50 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-gray-900">
              Pro<span className="text-[#b42d27]">Vault</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Collect, organize, and discover the perfect prompts for your AI-generated images
            </p>
          </div>

          {/* Search Bar */}
          <SearchBar onSearch={handleSearch} categories={categories} initialCategoryId={initialCategoryId} />

          {/* Stats */}
          <div className="flex justify-center gap-8 text-center">
            <div className="px-6 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{pagination.total}</div>
              <div className="text-sm text-gray-500">Prompts</div>
            </div>
            <div className="px-6 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
              <div className="text-sm text-gray-500">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(PAGE_SIZE)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="aspect-video bg-gray-200" />
                  <div className="p-5">
                    <div className="h-6 bg-gray-200 rounded mb-3 w-3/4" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No prompts found</h3>
            <p className="text-gray-500 mb-6">
              {searchParams.q || searchParams.aiTool || searchParams.categoryId
                ? "Try adjusting your search or filters"
                : "Start by adding your first prompt!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prompts.map((prompt, i) => (
                <div
                  key={prompt.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <PromptCard prompt={prompt} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {/* Prev */}
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-[#b42d27] hover:text-[#b42d27] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ←
                </button>

                {/* Page numbers */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // show first, last, current ±2
                    return p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 2;
                  })
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handlePageChange(item as number)}
                        className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                          item === page
                            ? "bg-[#b42d27] border-[#b42d27] text-white"
                            : "bg-white border-gray-200 text-gray-600 hover:border-[#b42d27] hover:text-[#b42d27]"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                {/* Next */}
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-[#b42d27] hover:text-[#b42d27] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  →
                </button>
              </div>
            )}

            {/* Page info */}
            {pagination.totalPages > 1 && (
              <p className="text-center text-sm text-gray-400 mt-3">
                Page {page} of {pagination.totalPages} &middot; {pagination.total} prompts
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
