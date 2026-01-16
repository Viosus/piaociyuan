"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGet } from '@/lib/api';

type Order = {
  id: string;
  eventId: number;
  tierId: number;
  qty: number;
  holdId: string;
  status: "PENDING" | "PAID" | "refunded";
  createdAt: number;
  paidAt?: number;
  amount: number;
  event?: {
    id: number;
    name: string;
    city: string;
    date: string;
    time: string;
  };
  tier?: {
    id: number;
    name: string;
    price: number;
  };
  tickets?: Array<{
    id: string;
    ticketCode: string;
    status: string;
    price: number;
    refundedAt?: Date | string | null;
  }>;
};

type EventOption = {
  id: number;
  name: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

// 筛选项类型定义
type FilterType = 
  | "status" 
  | "eventId" 
  | "q" 
  | "orderDate" 
  | "eventDate" 
  | "amount"
  | "sortBy";

type FilterValue = string | number | null | { start: string; end: string } | { min: string; max: string };

type FilterItem = {
  id: string;
  type: FilterType;
  label: string;
  value: FilterValue;
};

// 可用的筛选项配置
const FILTER_OPTIONS = [
  { type: "status" as FilterType, label: "订单状态", icon: "📋" },
  { type: "eventId" as FilterType, label: "活动", icon: "🎭" },
  { type: "q" as FilterType, label: "搜索订单号", icon: "🔍" },
  { type: "orderDate" as FilterType, label: "购票日期", icon: "📅" },
  { type: "eventDate" as FilterType, label: "活动日期", icon: "🎪" },
  { type: "amount" as FilterType, label: "金额范围", icon: "💰" },
];

function OrdersList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 活动筛选器
  const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const currentPage = parseInt(searchParams.get("page") || "1");

  // 验证用户登录状态
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // 验证 token 有效性
    apiGet("/api/auth/me")
      .then((data) => {
        if (data.ok) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        // API helper already handles 401 redirects
      });
  }, [router]);

  // 从 URL 初始化筛选器
  useEffect(() => {
    const filters: FilterItem[] = [];
    
    if (searchParams.get("status")) {
      filters.push({
        id: "status",
        type: "status",
        label: "订单状态",
        value: searchParams.get("status"),
      });
    }
    
    if (searchParams.get("eventId")) {
      filters.push({
        id: "eventId",
        type: "eventId",
        label: "活动",
        value: searchParams.get("eventId"),
      });
    }
    
    if (searchParams.get("q")) {
      filters.push({
        id: "q",
        type: "q",
        label: "搜索订单号",
        value: searchParams.get("q"),
      });
    }
    
    const orderStartDate = searchParams.get("orderStartDate");
    const orderEndDate = searchParams.get("orderEndDate");
    if (orderStartDate || orderEndDate) {
      filters.push({
        id: "orderDate",
        type: "orderDate",
        label: "购票日期",
        value: { start: orderStartDate || "", end: orderEndDate || "" },
      });
    }
    
    const eventStartDate = searchParams.get("eventStartDate");
    const eventEndDate = searchParams.get("eventEndDate");
    if (eventStartDate || eventEndDate) {
      filters.push({
        id: "eventDate",
        type: "eventDate",
        label: "活动日期",
        value: { start: eventStartDate || "", end: eventEndDate || "" },
      });
    }
    
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    if (minAmount || maxAmount) {
      filters.push({
        id: "amount",
        type: "amount",
        label: "金额范围",
        value: { min: minAmount || "", max: maxAmount || "" },
      });
    }
    
    setActiveFilters(filters);
  }, [searchParams]);

  // 构建 URL 参数
  const buildURLParams = useCallback((filters: FilterItem[], page: number = 1) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    
    filters.forEach((filter) => {
      switch (filter.type) {
        case "status":
          if (typeof filter.value === 'string') params.set("status", filter.value);
          break;
        case "eventId":
          if (typeof filter.value === 'string') params.set("eventId", filter.value);
          break;
        case "q":
          if (typeof filter.value === 'string') params.set("q", filter.value);
          break;
        case "orderDate":
          if (filter.value && typeof filter.value === 'object' && 'start' in filter.value) {
            if (filter.value.start) params.set("orderStartDate", filter.value.start);
            if (filter.value.end) params.set("orderEndDate", filter.value.end);
          }
          break;
        case "eventDate":
          if (filter.value && typeof filter.value === 'object' && 'start' in filter.value) {
            if (filter.value.start) params.set("eventStartDate", filter.value.start);
            if (filter.value.end) params.set("eventEndDate", filter.value.end);
          }
          break;
        case "amount":
          if (filter.value && typeof filter.value === 'object' && 'min' in filter.value) {
            if (filter.value.min) params.set("minAmount", filter.value.min);
            if (filter.value.max) params.set("maxAmount", filter.value.max);
          }
          break;
      }
    });
    
    // 保留 URL 中的排序参数
    const currentSort = searchParams.get("sortBy");
    const currentOrder = searchParams.get("sortOrder");
    if (currentSort) params.set("sortBy", currentSort);
    if (currentOrder) params.set("sortOrder", currentOrder);
    
    return params;
  }, [searchParams]);

  // 更新 URL
  const updateURL = useCallback((filters: FilterItem[], page: number = 1) => {
    const params = buildURLParams(filters, page);
    router.push(`/account/orders?${params.toString()}`);
  }, [router, buildURLParams]);

  // 加载活动列表
  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        const eventList = Array.isArray(data) ? data : data.data || [];
        setEvents(eventList);
      }
    } catch {
      // 静默处理加载活动列表失败
    }
  }, []);

  // 加载订单列表
  const loadOrders = useCallback(async (page: number) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const params = buildURLParams(activeFilters, page);
      const url = `/api/orders?${params.toString()}`;

      const data = await apiGet(url);

      if (data.ok && data.data) {
        setOrders(data.data);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        throw new Error(data.message || "数据格式错误");
      }
    } catch (err: unknown) {
      // 静默处理请求失败
      setError(err instanceof Error ? err.message : String(err) || "加载失败");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilters, buildURLParams, isAuthenticated, router]);

  // 初始化
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadOrders(currentPage);
  }, [currentPage, searchParams, loadOrders]);

  // 添加筛选项
  const addFilter = (type: FilterType) => {
    const option = FILTER_OPTIONS.find((o) => o.type === type);
    if (!option) return;
    
    // 检查是否已存在
    if (activeFilters.some((f) => f.type === type)) {
      alert("该筛选项已添加");
      return;
    }
    
    // 创建默认值
    let defaultValue: FilterValue = "";
    if (type === "orderDate" || type === "eventDate") {
      defaultValue = { start: "", end: "" };
    } else if (type === "amount") {
      defaultValue = { min: "", max: "" };
    }
    
    const newFilter: FilterItem = {
      id: type,
      type,
      label: option.label,
      value: defaultValue,
    };
    
    setActiveFilters([...activeFilters, newFilter]);
    setShowFilterMenu(false);
  };

  // 更新筛选项值
  const updateFilterValue = (id: string, value: FilterValue) => {
    setActiveFilters(
      activeFilters.map((f) => (f.id === id ? { ...f, value } : f))
    );
  };

  // 删除筛选项
  const removeFilter = (id: string) => {
    const newFilters = activeFilters.filter((f) => f.id !== id);
    setActiveFilters(newFilters);
    updateURL(newFilters, 1);
  };

  // 应用筛选
  const applyFilters = () => {
    updateURL(activeFilters, 1);
  };

  // 清空所有筛选
  const clearAllFilters = () => {
    setActiveFilters([]);
    router.push("/account/orders?page=1");
  };

  // 翻页
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      updateURL(activeFilters, page);
    }
  };

  // 渲染筛选项编辑器
  const renderFilterEditor = (filter: FilterItem) => {
    switch (filter.type) {
      case "status":
        return (
          <select
            value={(filter.value || '') as string}
            onChange={(e) => updateFilterValue(filter.id, e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待支付</option>
            <option value="PAID">已支付</option>
          </select>
        );

      case "eventId":
        return (
          <select
            value={(filter.value || '') as string}
            onChange={(e) => updateFilterValue(filter.id, e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          >
            <option value="">全部活动</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        );

      case "q":
        return (
          <input
            type="text"
            value={(filter.value || '') as string}
            onChange={(e) => {
              // 限制搜索关键词最大长度为50字符
              const value = e.target.value.slice(0, 50);
              updateFilterValue(filter.id, value);
            }}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="输入订单号（最多50字符）"
            maxLength={50}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
        );
      
      case "orderDate":
      case "eventDate": {
        const dateValue = (filter.value || { start: '', end: '' }) as { start: string; end: string };
        return (
          <div className="flex-1 flex gap-2">
            <input
              type="date"
              value={dateValue.start}
              onChange={(e) =>
                updateFilterValue(filter.id, { ...dateValue, start: e.target.value })
              }
              className="flex-1 px-3 py-2 border rounded-lg"
              placeholder="开始日期"
            />
            <span className="self-center text-[#282828] opacity-60">~</span>
            <input
              type="date"
              value={dateValue.end}
              onChange={(e) =>
                updateFilterValue(filter.id, { ...dateValue, end: e.target.value })
              }
              className="flex-1 px-3 py-2 border rounded-lg"
              placeholder="结束日期"
            />
          </div>
        );
      }

      case "amount": {
        const amountValue = (filter.value || { min: '', max: '' }) as { min: string; max: string };
        return (
          <div className="flex-1 flex gap-2">
            <input
              type="number"
              value={amountValue.min}
              onChange={(e) =>
                updateFilterValue(filter.id, { ...amountValue, min: e.target.value })
              }
              placeholder="最低金额"
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <span className="self-center text-[#282828] opacity-60">~</span>
            <input
              type="number"
              value={amountValue.max}
              onChange={(e) =>
                updateFilterValue(filter.id, { ...amountValue, max: e.target.value })
              }
              placeholder="最高金额"
              className="flex-1 px-3 py-2 border rounded-lg"
            />
          </div>
        );
      }
      
      default:
        return null;
    }
  };

  // 渲染筛选项显示标签
  const renderFilterLabel = (filter: FilterItem) => {
    switch (filter.type) {
      case "status":
        return filter.value === "PENDING" ? "待支付" : filter.value === "PAID" ? "已支付" : "全部";
      case "eventId":
        const event = events.find((e) => String(e.id) === String(filter.value));
        return event ? event.name : `活动 ${filter.value}`;
      case "q":
        return `"${filter.value}"`;
      case "orderDate":
      case "eventDate": {
        const dateVal = filter.value as { start: string; end: string };
        return `${dateVal?.start || "不限"} ~ ${dateVal?.end || "不限"}`;
      }
      case "amount": {
        const amountVal = filter.value as { min: string; max: string };
        return `¥${amountVal?.min || "0"} ~ ¥${amountVal?.max || "∞"}`;
      }
      default:
        return "";
    }
  };

  // 获取未添加的筛选项
  const availableFilters = FILTER_OPTIONS.filter(
    (option) => !activeFilters.some((f) => f.type === option.type)
  );

  // 分页组件
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(pagination.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          上一页
        </button>
        
        {start > 1 && (
          <>
            <button
              onClick={() => goToPage(1)}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              1
            </button>
            {start > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`px-3 py-2 border rounded-lg ${
              currentPage === p
                ? "bg-[#46467A] text-white"
                : "hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}
        
        {end < pagination.totalPages && (
          <>
            {end < pagination.totalPages - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => goToPage(pagination.totalPages)}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50"
            >
              {pagination.totalPages}
            </button>
          </>
        )}
        
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === pagination.totalPages}
          className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          下一页
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#E0DFFD] p-8">
      <div className="max-w-6xl mx-auto">
        {/* 标题和导航 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-[#E0DFFD] to-blue-400 bg-clip-text text-transparent">
            我的订单
          </h1>
          <Link
            href="/account/nfts"
            className="px-4 py-2 bg-[#46467A] text-white rounded-lg hover:bg-[#5a5a9e] transition-all flex items-center gap-2"
          >
            🎨 我的次元
          </Link>
        </div>

        {/* 筛选器区域 */}
        <div className="mb-6 space-y-3">
          {/* 已添加的筛选项 */}
          {activeFilters.map((filter) => {
            const option = FILTER_OPTIONS.find((o) => o.type === filter.type);
            return (
              <div key={filter.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">{option?.icon}</span>
                <span className="text-sm font-medium text-[#282828] min-w-[80px]">
                  {filter.label}
                </span>
                {renderFilterEditor(filter)}
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                  title="删除此筛选"
                >
                  ✕
                </button>
              </div>
            );
          })}

          {/* 添加筛选按钮 */}
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#46467A] hover:bg-[#f0f0ff] text-[#282828] hover:text-[#46467A] transition-colors"
              >
                {activeFilters.length === 0 ? "+ 添加筛选" : "+ 添加更多筛选"}
              </button>
              
              {/* 筛选菜单 */}
              {showFilterMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <div className="text-xs text-[#282828] px-2 py-1">选择筛选项</div>
                    {availableFilters.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-[#282828] opacity-60 text-center">
                        所有筛选项已添加
                      </div>
                    ) : (
                      availableFilters.map((option) => (
                        <button
                          key={option.type}
                          onClick={() => addFilter(option.type)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                        >
                          <span>{option.icon}</span>
                          <span className="text-sm">{option.label}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {activeFilters.length > 0 && (
              <>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-[#46467A] text-white rounded-lg hover:bg-[#5a5a9e]"
                >
                  应用筛选
                </button>
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  清空全部
                </button>
              </>
            )}
            
            <button
              onClick={() => loadOrders(currentPage)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              🔄 刷新
            </button>
          </div>
        </div>

        {/* 排序栏 - 独立显示 */}
        <div className="mb-6 flex items-center gap-3 p-3 bg-gradient-to-r from-[#f0f0ff] to-[#E0DFFD] rounded-lg border border-[#46467A]/20">
          <span className="text-lg">📊</span>
          <span className="text-sm font-medium text-[#282828] min-w-[60px]">排序</span>
          <select
            value={`${searchParams.get("sortBy") || "createdAt"}-${searchParams.get("sortOrder") || "desc"}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split("-");
              const params = new URLSearchParams(searchParams.toString());
              params.set("sortBy", sortBy);
              params.set("sortOrder", sortOrder);
              params.set("page", "1");
              router.push(`?${params.toString()}`);
            }}
            className="flex-1 px-3 py-2 border border-[#46467A]/30 rounded-lg bg-white focus:ring-2 focus:ring-[#46467A] focus:border-transparent"
          >
            <option value="createdAt-desc">📅 创建时间（新→旧）</option>
            <option value="createdAt-asc">📅 创建时间（旧→新）</option>
            <option value="paidAt-desc">💳 支付时间（新→旧）</option>
            <option value="paidAt-asc">💳 支付时间（旧→新）</option>
            <option value="amount-desc">💰 金额（高→低）</option>
            <option value="amount-asc">💰 金额（低→高）</option>
          </select>
        </div>

        {/* 统计信息 */}
        <div className="text-sm text-[#282828] mb-4">
          共 <span className="font-semibold">{pagination.total}</span> 条订单，
          当前第 <span className="font-semibold">{currentPage}</span> /
          <span className="font-semibold"> {pagination.totalPages}</span> 页
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            <div className="font-semibold">加载失败</div>
            <div className="text-sm mt-1">{error}</div>
            <button
              onClick={() => loadOrders(currentPage)}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              重试
            </button>
          </div>
        )}

        {/* 订单表格 */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm text-[#282828] border-b">
                <th className="py-3 pr-4">订单号</th>
                <th className="py-3 pr-4">活动</th>
                <th className="py-3 pr-4">票档/数量</th>
                <th className="py-3 pr-4">金额</th>
                <th className="py-3 pr-4">状态</th>
                <th className="py-3 pr-4">创建时间</th>
                <th className="py-3 pr-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#282828] opacity-60">
                    加载中...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <div className="text-[#282828] opacity-60 mb-2">暂无订单</div>
                    <Link
                      href="/events"
                      className="inline-block px-4 py-2 bg-[#46467A] text-white rounded-lg hover:bg-[#5a5a9e]"
                    >
                      去购票
                    </Link>
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  // 检查是否所有票都已退款
                  // 1. 订单状态本身是 refunded
                  // 2. 或者有票且所有票都有 refundedAt
                  const allTicketsRefunded =
                    o.status === 'refunded' ||
                    (o.tickets && o.tickets.length > 0 && o.tickets.every(t => t.refundedAt !== null && t.refundedAt !== undefined));

                  return (
                    <tr key={o.id} className={`border-t text-sm hover:bg-gray-50 ${allTicketsRefunded ? 'opacity-60' : ''}`}>
                      <td className="py-3 pr-4 font-mono text-xs">{o.id}</td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">
                          {o.event?.name ?? `活动 ${o.eventId}`}
                        </div>
                        {o.event && (
                          <div className="text-[#282828] text-xs">
                            {o.event.city} · {o.event.date} {o.event.time}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {o.tier ? `${o.tier.name} × ${o.qty}` : `票档 ${o.tierId} × ${o.qty}`}
                      </td>
                      <td className="py-3 pr-4 font-medium">¥ {o.amount.toFixed(2)}</td>
                      <td className="py-3 pr-4">
                        {allTicketsRefunded ? (
                          <span className="px-2 py-1 rounded bg-gray-100 text-[#282828] text-xs">
                            已全部退票
                          </span>
                        ) : o.status === "PAID" ? (
                          <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs">
                            已支付
                          </span>
                        ) : o.status === "refunded" ? (
                          <span className="px-2 py-1 rounded bg-gray-100 text-[#282828] text-xs">
                            已退票
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs">
                            待支付
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs text-[#282828]">
                        {new Date(o.createdAt).toLocaleString("zh-CN")}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-2">
                          {!allTicketsRefunded ? (
                            <>
                              <Link
                                href={`/order/${o.id}`}
                                className="px-3 py-1.5 rounded bg-[#46467A] text-white hover:bg-[#5a5a9e] text-xs"
                              >
                                查看详情
                              </Link>
                              {o.status === "PAID" && (
                                <Link
                                  href="/account/nfts"
                                  className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                                >
                                  我的次元
                                </Link>
                              )}
                            </>
                          ) : (
                            <span className="px-3 py-1.5 rounded bg-gray-300 text-[#282828] text-xs cursor-not-allowed">
                              已失效
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页组件 */}
        {renderPagination()}

        {/* 返回链接 */}
        <div className="mt-6 text-sm">
          <Link href="/events" className="text-[#46467A] hover:underline">
            ← 返回活动列表
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#E0DFFD] py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">加载中...</div>
        </div>
      </div>
    }>
      <OrdersList />
    </Suspense>
  );
}