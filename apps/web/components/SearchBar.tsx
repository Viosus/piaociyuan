// components/SearchBar.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { EVENT_CATEGORY_LABELS, EVENT_CATEGORY_ICONS, EventCategory } from "@/lib/eventUtils";

interface SearchResult {
  id: number;
  name: string;
  city: string;
  date: string;
  time: string;
  venue: string;
  cover: string;
  category: string;
}

export default function SearchBar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 防抖搜索
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiGet(`/api/events/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          setResults(response.data);
        }
      } catch (error) {
        console.error("搜索失败:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 点击外部关闭搜索框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    router.push(`/events/${result.id}`);
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setSelectedIndex(-1);
  };

  return (
    <div ref={searchRef} className="relative">
      {/* 搜索按钮（收起状态） */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="w-10 h-10 rounded-full bg-white/80 hover:bg-white border border-[#FFEBF5] flex items-center justify-center transition-all hover:shadow-lg"
          title="搜索活动"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      )}

      {/* 搜索框（展开状态） */}
      {isOpen && (
        <div className="absolute right-0 top-0 w-96 bg-white rounded-2xl shadow-2xl border border-[#FFEBF5] z-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="搜索活动名称、城市、场馆..."
                className="flex-1 outline-none text-gray-700 text-sm placeholder-gray-400"
                autoComplete="off"
              />
              <button
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                  setResults([]);
                  setSelectedIndex(-1);
                }}
                className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 快捷键提示 */}
            <div className="flex gap-2 text-xs text-gray-400 mb-2">
              <span className="px-1.5 py-0.5 bg-gray-100 rounded">↑↓</span>
              <span>导航</span>
              <span className="px-1.5 py-0.5 bg-gray-100 rounded">Enter</span>
              <span>选择</span>
              <span className="px-1.5 py-0.5 bg-gray-100 rounded">Esc</span>
              <span>关闭</span>
            </div>
          </div>

          {/* 搜索结果 */}
          {query && (
            <div className="border-t border-gray-100 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : results.length > 0 ? (
                <div className="p-2">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className={`w-full text-left p-3 rounded-lg transition-colors mb-1 ${
                        index === selectedIndex
                          ? "bg-purple-50 border border-purple-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={result.cover}
                          alt={result.name}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              result.category === 'concert' ? 'bg-purple-100 text-purple-700' :
                              result.category === 'sports' ? 'bg-blue-100 text-blue-700' :
                              result.category === 'drama' ? 'bg-pink-100 text-pink-700' :
                              result.category === 'exhibition' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {EVENT_CATEGORY_ICONS[result.category as EventCategory]} {EVENT_CATEGORY_LABELS[result.category as EventCategory]}
                            </span>
                          </div>
                          <h3 className="font-medium text-sm text-gray-900 line-clamp-1 mb-1">
                            {result.name}
                          </h3>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {result.city} · {result.date} {result.time}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                            {result.venue}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">未找到相关活动</p>
                  <p className="text-gray-400 text-xs mt-1">试试其他关键词</p>
                </div>
              )}
            </div>
          )}

          {/* 默认状态（未输入） */}
          {!query && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-gray-400 text-sm">输入关键词开始搜索</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
