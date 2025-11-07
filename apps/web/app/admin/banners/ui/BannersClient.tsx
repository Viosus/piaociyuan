"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import CreateBannerDialog from "./CreateBannerDialog";
import EditBannerDialog from "./EditBannerDialog";

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function BannersClient() {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // 加载 banners
  const loadBanners = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/banners", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setBanners(data.data);
      }
    } catch (error) {
      console.error("加载 Banner 失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // 删除 banner
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个 Banner 吗？")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        alert("✅ 删除成功");
        loadBanners();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("❌ 删除失败");
    }
  };

  // 切换启用状态
  const handleToggleActive = async (banner: Banner) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !banner.isActive })
      });
      const data = await res.json();
      if (data.ok) {
        loadBanners();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error("更新失败:", error);
      alert("❌ 更新失败");
    }
  };

  // 拖拽排序
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(banners);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 更新顺序
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));
    setBanners(updatedItems);

    // 更新服务器
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/banners/order", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          bannerOrders: updatedItems.map(item => ({
            id: item.id,
            order: item.order
          }))
        })
      });
      const data = await res.json();
      if (!data.ok) {
        alert(`错误：${data.message}`);
        loadBanners();
      }
    } catch (error) {
      console.error("更新排序失败:", error);
      loadBanners();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="page-background">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">轮播广告栏管理</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateDialog(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                + 新建 Banner
              </button>
              <button
                onClick={() => router.push("/admin")}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                返回管理后台
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {banners.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">还没有任何 Banner</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              创建第一个 Banner
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="banners">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {banners.map((banner, index) => (
                    <Draggable key={banner.id} draggableId={banner.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white rounded-lg shadow p-6 ${
                            snapshot.isDragging ? "shadow-2xl" : ""
                          }`}
                        >
                          <div className="flex gap-6">
                            {/* 拖拽手柄 */}
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing text-gray-400 flex items-center"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>

                            {/* Banner 预览 */}
                            <div className="relative w-64 h-32 rounded-lg overflow-hidden">
                              <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${banner.image})` }}
                              />
                              <div className={`absolute inset-0 bg-gradient-to-r ${banner.color}`} />
                              <div className="absolute inset-0 flex items-center justify-center text-center px-4">
                                <div>
                                  <h3 className="text-xl font-bold text-white drop-shadow-lg">
                                    {banner.title}
                                  </h3>
                                  <p className="text-sm text-white/90 drop-shadow-md">
                                    {banner.subtitle}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Banner 信息 */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900">{banner.title}</h3>
                                  <p className="text-sm text-gray-600">{banner.subtitle}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      banner.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {banner.isActive ? "已启用" : "已禁用"}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600 mb-3">
                                <p>🔗 链接：{banner.link}</p>
                                <p>🎨 渐变：{banner.color}</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingBanner(banner)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={() => handleToggleActive(banner)}
                                  className={`px-4 py-2 rounded-lg transition text-sm ${
                                    banner.isActive
                                      ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                      : "bg-green-100 text-green-700 hover:bg-green-200"
                                  }`}
                                >
                                  {banner.isActive ? "禁用" : "启用"}
                                </button>
                                <button
                                  onClick={() => handleDelete(banner.id)}
                                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                                >
                                  删除
                                </button>
                              </div>
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
        )}
      </main>

      {/* 对话框 */}
      {showCreateDialog && (
        <CreateBannerDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            loadBanners();
          }}
        />
      )}
      {editingBanner && (
        <EditBannerDialog
          banner={editingBanner}
          onClose={() => setEditingBanner(null)}
          onSuccess={() => {
            setEditingBanner(null);
            loadBanners();
          }}
        />
      )}
    </div>
  );
}
