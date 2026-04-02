import { useState, useEffect } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  label: string;
  isUpcoming: boolean;
  isUrgent: boolean;
}

export function useCountdown(targetDate: string): CountdownResult {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const target = new Date(targetDate).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, label: '', isUpcoming: false, isUrgent: false };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let label: string;
  if (days > 0) {
    label = `${days}天${hours}时后开始`;
  } else if (hours > 0) {
    label = `${hours}小时${minutes}分后开始`;
  } else {
    label = `${minutes}分钟后开始`;
  }

  return {
    days,
    hours,
    minutes,
    label,
    isUpcoming: true,
    isUrgent: days === 0,
  };
}
