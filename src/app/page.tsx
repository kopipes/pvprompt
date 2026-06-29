"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PromptCard from "@/components/PromptCard";
import SearchBar from "@/components/SearchBar";

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
  const [searchParams, setSearchParams] = useState<SearchParams>({
    q: "",
    aiTool: "",
    categoryId: initialCategoryId,
  });

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error);
  }, []);

  // Fetch prompts based on search params
  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.q) params.set("q", searchParams.q);
      if (searchParams.aiTool) params.set("aiTool", searchParams.aiTool);
      if (searchParams.categoryId) params.set("categoryId", searchParams.categoryId);

      const url = searchParams.q ? `/api/search?${params}` : `/api/prompts?${params}`;
      const res = await fetch(url);
      const data = await res.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

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
          <SearchBar onSearch={setSearchParams} categories={categories} initialCategoryId={initialCategoryId} />

          {/* Stats */}
          <div className="flex justify-center gap-8 text-center">
            <div className="px-6 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{prompts.length}</div>
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
            {[...Array(6)].map((_, i) => (
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
        )}
      </div>
    </div>
  );
}
