"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-[#FFE3F0] to-blue-400 bg-clip-text text-transparent mb-2">
            ⚙️ 偏好设置
          </h1>
          <p className="text-white/60 mb-8">个性化你的票次元体验</p>

          {/* 占位内容 */}
          <div className="space-y-6">
            {/* 提示信息 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-xl font-semibold text-white mb-2">
                功能开发中
              </h2>
              <p className="text-white/60 mb-6">
                更多个性化设置功能即将上线，敬请期待！
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl mb-2">🎨</div>
                  <h3 className="text-white font-medium mb-1">主题设置</h3>
                  <p className="text-sm text-white/40">
                    自定义界面主题颜色和显示模式
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl mb-2">🔔</div>
                  <h3 className="text-white font-medium mb-1">通知偏好</h3>
                  <p className="text-sm text-white/40">
                    管理活动提醒和消息推送设置
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl mb-2">🌐</div>
                  <h3 className="text-white font-medium mb-1">语言和地区</h3>
                  <p className="text-sm text-white/40">
                    选择界面语言和时区设置
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-2xl mb-2">🔐</div>
                  <h3 className="text-white font-medium mb-1">隐私设置</h3>
                  <p className="text-sm text-white/40">
                    管理你的数据和隐私偏好
                  </p>
                </div>
              </div>
            </div>

            {/* 快捷链接 */}
            <div className="flex gap-4">
              <Link
                href="/account"
                className="flex-1 py-3 text-center bg-gradient-to-r from-purple-500 to-[#EAF353] text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition"
              >
                👤 返回个人中心
              </Link>
              <button
                onClick={() => router.back()}
                className="px-8 py-3 border border-white/10 text-white/80 rounded-lg font-medium hover:bg-white/5 transition"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
