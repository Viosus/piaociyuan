"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

type Event = {
  id: number;
  name: string;
  cover: string;
  city: string;
  date: string;
  category: string;
  saleStatus: string;
};

type SectionEvent = {
  id: string;
  eventId: number;
  order: number;
  event: Event;
};

type Section = {
  id: string;
  title: string;
  events: SectionEvent[];
};

type Props = {
  section: Section;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ManageEventsDialog({ section, onClose, onSuccess }: Props) {
  const [events, setEvents] = useState<SectionEvent[]>(section.events);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [searching, setSearching] = useState(false);

  // 搜索活动
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/events/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.ok) {
        // 过滤掉已添加的活动
        const existingIds = new Set(events.map(e => e.event.id));
        const filtered = data.data.filter((e: Event) => !existingIds.has(e.id));
        setSearchResults(filtered);
      }
    } catch {
      // 静默处理搜索失败
    } finally {
      setSearching(false);
    }
  };

  // 添加活动
  const handleAddEvent = async (event: Event) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/homepage-sections/${section.id}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ eventId: event.id })
      });

      const data = await res.json();
      if (data.ok) {
        // 添加到本地列表
        setEvents([...events, data.data]);
        // 从搜索结果中移除
        setSearchResults(searchResults.filter(e => e.id !== event.id));
        alert("✅ 活动添加成功");
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch {
      // 静默处理添加活动失败
      alert("❌ 添加失败");
    }
  };

  // 移除活动
  const handleRemoveEvent = async (eventId: number) => {
    if (!confirm("确定要移除这个活动吗？")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/admin/homepage-sections/${section.id}/events/${eventId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = await res.json();
      if (data.ok) {
        setEvents(events.filter(e => e.event.id !== eventId));
        alert("✅ 活动移除成功");
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch {
      // 静默处理移除活动失败
      alert("❌ 移除失败");
    }
  };

  // 拖拽排序
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(events);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 更新顺序
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));
    setEvents(updatedItems);

    // 更新服务器
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/homepage-sections/${section.id}/events`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          eventOrders: updatedItems.map(item => ({
            eventId: item.event.id,
            order: item.order
          }))
        })
      });

      const data = await res.json();
      if (!data.ok) {
        alert(`错误：${data.message}`);
      }
    } catch {
      // 静默处理更新排序失败
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              管理活动 - {section.title}
            </h2>
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 搜索添加活动 */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">添加活动</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="搜索活动名称、城市或场馆..."
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
              >
                {searching ? "搜索中..." : "搜索"}
              </button>
            </div>

            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map(event => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200"
                  >
                    <img
                      src={event.cover}
                      alt={event.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{event.name}</h4>
                      <p className="text-sm text-gray-600">
                        {event.city} · {event.date}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddEvent(event)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                    >
                      添加
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 已添加的活动列表 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              已添加的活动 ({events.length})
            </h3>

            {events.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">还没有添加任何活动</p>
                <p className="text-sm text-gray-400 mt-1">使用上方搜索功能添加活动</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="events">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {events.map((sectionEvent, index) => (
                        <Draggable
                          key={sectionEvent.id}
                          draggableId={sectionEvent.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 bg-white p-3 rounded-lg border-2 ${
                                snapshot.isDragging
                                  ? "border-purple-500 shadow-lg"
                                  : "border-gray-200"
                              }`}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-gray-400"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>
                              <img
                                src={sectionEvent.event.cover}
                                alt={sectionEvent.event.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {sectionEvent.event.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {sectionEvent.event.city} · {sectionEvent.event.date}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveEvent(sectionEvent.event.id)}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                              >
                                移除
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
