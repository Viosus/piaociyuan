// app/encore/ui/CreatePostDialog.tsx
"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePostDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreatePostDialogProps) {
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert("请输入帖子内容");
      return;
    }

    if (content.length > 5000) {
      alert("帖子内容不能超过5000字");
      return;
    }

    setLoading(true);

    try {
      const result = await apiPost("/api/posts", {
        content: content.trim(),
        location: location.trim() || null,
        images: [], // 暂时不支持图片上传
      });

      if (result.ok) {
        alert("✅ 发布成功！");
        setContent("");
        setLocation("");
        onClose();
        onSuccess(); // 刷新列表
      } else {
        alert(`❌ ${result.message || "发布失败"}`);
      }
    } catch (error) {
      console.error("Create post error:", error);
      alert("❌ 网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">✍️ 发布新帖子</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 内容输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              帖子内容 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EAF353] focus:border-transparent resize-none text-gray-800"
              rows={8}
              placeholder="分享你的演出时刻、观后感想...&#10;&#10;例如：&#10;- 今晚的演唱会太燃了！&#10;- 刚看完展览，印象派大师的作品真的太震撼了&#10;- 推荐这个乐队，现场氛围爆炸！"
              maxLength={5000}
              disabled={loading}
              required
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-500">
                支持表情、换行，分享你的真实感受
              </span>
              <span className={`text-sm ${content.length > 4500 ? 'text-red-500' : 'text-gray-500'}`}>
                {content.length} / 5000
              </span>
            </div>
          </div>

          {/* 位置输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📍 位置（可选）
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EAF353] focus:border-transparent text-gray-800"
              placeholder="例如：北京工人体育场、上海梅赛德斯奔驰文化中心..."
              maxLength={100}
              disabled={loading}
            />
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>发帖提示：</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4">
              <li>• 分享真实的观演体验和感受</li>
              <li>• 尊重他人，文明发言</li>
              <li>• 图片上传功能即将上线</li>
            </ul>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[#EAF353] text-white rounded-lg hover:bg-[#FFC9E0] transition disabled:opacity-50 font-medium"
              disabled={loading}
            >
              {loading ? "发布中..." : "发布"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
