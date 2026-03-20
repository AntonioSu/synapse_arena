'use client';

import { useEffect, useState } from 'react';

export default function SystemStats() {
  const [time, setTime] = useState('--:--:--');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 text-[10px] text-cyan-500/70 font-mono" aria-label="system status">
      <span>SYS_TIME: {time}</span>
      <span className="w-1.5 h-1.5 bg-cyan-400/60 rounded-full animate-pulse" aria-hidden="true" />
      <span>ONLINE</span>
    </div>
  );
}
