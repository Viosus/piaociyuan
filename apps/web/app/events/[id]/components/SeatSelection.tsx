'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { useToast } from '@/components/Toast';

type SeatStatus = 'available' | 'locked' | 'sold';

type Seat = {
  id: string;
  ticketCode: string;
  seatNumber: string;
  status: SeatStatus;
  lockExpireAt: number | null;
  remainingSeconds: number | null;
};

type Props = {
  eventId: string;
  tierId: string;
  tierName: string;
  tierPrice: number;
};

export default function SeatSelection({ eventId, tierId, tierName, tierPrice }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [mode, setMode] = useState<'AUTO' | 'MANUAL' | null>(null);

  // 获取座位状态
  const fetchSeats = async () => {
    try {
      const res = await fetch(`/api/tickets/hold-smart?eventId=${eventId}&tierId=${tierId}`);
      const data = await res.json();
      if (data.ok) {
        setSeats(data.data);
      }
    } catch {
      // 静默处理获取座位状态失败
    } finally {
      setLoading(false);
    }
  };

  // 初始化和定时刷新
  useEffect(() => {
    fetchSeats();
    const timer = setInterval(fetchSeats, 3000); // 每 3 秒刷新
    return () => clearInterval(timer);
  }, [eventId, tierId]);

  // 选择/取消选择座位
  const toggleSeat = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // 购票
  const handlePurchase = async (autoMode: boolean = false) => {
    setPurchasing(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.warning('请先登录');
        router.push('/auth/login');
        return;
      }

      const body = autoMode || selectedSeats.length === 0
        ? { eventId, tierId, qty: 1 } // 自动分配
        : { eventId, tierId, specificSeatIds: selectedSeats }; // 手动选座

      const result = await apiPost('/api/tickets/hold-smart', body);

      if (result.ok) {
        setMode(result.mode);

        if (result.mode === 'AUTO') {
          toast.success(`${result.message}，已为您分配座位，请在 10 分钟内完成支付`);
        } else {
          toast.success(`${result.message}，请在 10 分钟内完成支付`);
        }

        // 跳转到订单页面
        router.push(`/order/${result.data.holdId}`);
      } else {
        toast.error(result.error || '购票失败');
        fetchSeats();
        setSelectedSeats([]);
      }
    } catch {
      toast.error('网络错误，请重试');
    } finally {
      setPurchasing(false);
    }
  };

  // 格式化倒计时
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 统计座位信息
  const availableCount = seats.filter(s => s.status === 'available').length;
  const lockedCount = seats.filter(s => s.status === 'locked').length;
  const soldCount = seats.filter(s => s.status === 'sold').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-white/60">加载座位信息...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 票档信息 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{tierName}</h3>
            <p className="text-sm text-white/60">¥{tierPrice} / 张</p>
          </div>
          <div className="text-right text-sm text-white/60">
            <div>可选: {availableCount} 张</div>
            <div>锁定中: {lockedCount} 张</div>
            <div>已售: {soldCount} 张</div>
          </div>
        </div>
      </div>

      {/* 座位图 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="mb-4 text-center">
          <div className="inline-block bg-gradient-to-r from-purple-500 to-[#E0DFFD] text-white text-sm px-6 py-2 rounded-lg">
            舞台
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-w-4xl mx-auto">
          {seats.map((seat) => {
            const isSelected = selectedSeats.includes(seat.id);
            const isAvailable = seat.status === 'available';
            const isLocked = seat.status === 'locked';
            const isSold = seat.status === 'sold';

            return (
              <button
                key={seat.id}
                disabled={!isAvailable || purchasing}
                onClick={() => isAvailable && toggleSeat(seat.id)}
                className={`
                  relative aspect-square rounded-lg text-xs font-medium
                  transition-all duration-200
                  ${isAvailable ? 'bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/50' : ''}
                  ${isLocked ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 cursor-not-allowed' : ''}
                  ${isSold ? 'bg-gray-500/20 text-foreground opacity-50 border border-gray-500/30 cursor-not-allowed' : ''}
                  ${isSelected ? 'bg-blue-500 text-white border-2 border-blue-400 scale-110' : ''}
                `}
                title={
                  isLocked && seat.remainingSeconds
                    ? `锁定中，剩余 ${formatTime(seat.remainingSeconds)}`
                    : seat.seatNumber
                }
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs">{seat.seatNumber}</span>
                  {isLocked && seat.remainingSeconds && (
                    <span className="text-[8px] opacity-80">
                      {formatTime(seat.remainingSeconds)}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-blue-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* 图例 */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500/20 border border-green-500/50 rounded"></div>
            <span className="text-white/60">可选</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 border-2 border-blue-400 rounded"></div>
            <span className="text-white/60">已选</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500/50 rounded"></div>
            <span className="text-white/60">锁定中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500/20 border border-gray-500/30 rounded"></div>
            <span className="text-white/60">已售</span>
          </div>
        </div>
      </div>

      {/* 购票按钮 */}
      <div className="space-y-3">
        {selectedSeats.length > 0 ? (
          <>
            <button
              onClick={() => handlePurchase(false)}
              disabled={purchasing}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-[#FFF5FB]0 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purchasing ? '处理中...' : `锁定所选座位 (${selectedSeats.length} 张)`}
            </button>
            <button
              onClick={() => setSelectedSeats([])}
              disabled={purchasing}
              className="w-full py-3 bg-white/5 border border-white/10 text-white/80 rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
            >
              取消选择
            </button>
          </>
        ) : (
          <button
            onClick={() => handlePurchase(true)}
            disabled={purchasing || availableCount === 0}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-[#E0DFFD] text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {purchasing ? '处理中...' : availableCount === 0 ? '暂无余票' : '🚀 快速抢票（自动分配座位）'}
          </button>
        )}

        <div className="text-center text-xs text-white/40 space-y-1">
          <p>💡 提示：可以点击座位手动选座，或直接点击"快速抢票"让系统自动分配</p>
          <p>⚡ 开售高峰期系统可能自动分配座位以保证抢票速度</p>
        </div>
      </div>

      {/* 总价 */}
      {selectedSeats.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-[#E0DFFD]/10 border border-[#46467A]/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-white/80">总价</span>
            <span className="text-2xl font-bold text-white">
              ¥{(tierPrice * selectedSeats.length).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
