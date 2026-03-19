'use client';

import { useEffect, useState } from 'react';

export default function SystemStats() {
  const [time, setTime] = useState('00:00:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 text-[10px] text-cyan-500/50">
      <div>SYS_TIME: {time}</div>
      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      <div>STATUS: ONLINE</div>
    </div>
  );
}
