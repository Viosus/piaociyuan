"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import CreateSectionDialog from "./CreateSectionDialog";
import EditSectionDialog from "./EditSectionDialog";
import ManageEventsDialog from "./ManageEventsDialog";

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
  subtitle: string | null;
  icon: string | null;
  bgGradient: string;
  moreLink: string | null;
  order: number;
  isActive: boolean;
  type: string;
  autoConfig: string | null;
  events: SectionEvent[];
};

export default function HomepageSectionsClient() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [managingSection, setManagingSection] = useState<Section | null>(null);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch("/api/admin/homepage-sections", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.ok) {
        setSections(data.data);
      }
    } catch {
      // 静默处理加载栏目失败
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 更新本地状态
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));
    setSections(updatedItems);

    // 更新服务器
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/homepage-sections/order", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sectionOrders: updatedItems.map(item => ({
            id: item.id,
            order: item.order
          }))
        })
      });

      const data = await res.json();
      if (!data.ok) {
        alert(`错误：${data.message}`);
        loadSections(); // 重新加载
      }
    } catch {
      // 静默处理更新排序失败
      loadSections(); // 重新加载
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除「${title}」栏目吗？这将同时删除栏目中的所有活动配置。`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/homepage-sections/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.ok) {
        alert("✅ 删除成功");
        loadSections();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch {
      // 静默处理删除失败
      alert("❌ 删除失败");
    }
  };

  const handleToggleActive = async (section: Section) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/homepage-sections/${section.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: !section.isActive
        })
      });

      const data = await res.json();
      if (data.ok) {
        loadSections();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch {
      // 静默处理切换启用状态失败
      alert("❌ 操作失败");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">首页栏目管理</h1>
            <p className="text-gray-600 mt-2">管理首页展示的栏目和活动</p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            ➕ 添加栏目
          </button>
        </div>

        {/* 栏目列表 */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {sections.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white rounded-lg border-2 p-6 ${
                          snapshot.isDragging
                            ? "border-purple-500 shadow-2xl"
                            : "border-gray-200 hover:border-gray-300"
                        } transition-all`}
                      >
                        <div className="flex items-start gap-4">
                          {/* 拖拽手柄 */}
                          <div
                            {...provided.dragHandleProps}
                            className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>

                          {/* 栏目信息 */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {section.icon && <span className="text-2xl">{section.icon}</span>}
                              <h3 className="text-xl font-bold text-gray-900">{section.title}</h3>
                              {!section.isActive && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                                  已禁用
                                </span>
                              )}
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                section.type === 'manual'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {section.type === 'manual' ? '手动' : '自动'}
                              </span>
                            </div>
                            {section.subtitle && (
                              <p className="text-gray-600 mb-3">{section.subtitle}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>渐变：{section.bgGradient}</span>
                              {section.moreLink && <span>链接：{section.moreLink}</span>}
                              <span>活动数：{section.events.length}</span>
                            </div>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleActive(section)}
                              className={`px-4 py-2 rounded-lg transition ${
                                section.isActive
                                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                  : "bg-green-100 text-green-700 hover:bg-green-200"
                              }`}
                            >
                              {section.isActive ? "禁用" : "启用"}
                            </button>
                            <button
                              onClick={() => setManagingSection(section)}
                              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                            >
                              管理活动
                            </button>
                            <button
                              onClick={() => setEditingSection(section)}
                              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDelete(section.id, section.title)}
                              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {sections.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">还没有创建任何栏目</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              创建第一个栏目
            </button>
          </div>
        )}
      </div>

      {/* 对话框 */}
      {showCreateDialog && (
        <CreateSectionDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadSections();
          }}
        />
      )}
      {editingSection && (
        <EditSectionDialog
          section={editingSection}
          onClose={() => setEditingSection(null)}
          onSuccess={() => {
            setEditingSection(null);
            loadSections();
          }}
        />
      )}
      {managingSection && (
        <ManageEventsDialog
          section={managingSection}
          onClose={() => setManagingSection(null)}
          onSuccess={() => {
            setManagingSection(null);
            loadSections();
          }}
        />
      )}
    </div>
  );
}
