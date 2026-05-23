'use client';

import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: Date;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      setTimeLeft({
        days:    Math.floor(diff / 86400000),
        hours:   Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isExpired: false,
      });
    };
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) return null;

  if (timeLeft.isExpired) {
    return (
      <p className="font-serif-display italic text-princess-rose font-bold text-sm animate-pulse">
        ✨ O grande dia chegou! ✨
      </p>
    );
  }

  const items = [
    { label: 'dias',  value: timeLeft.days },
    { label: 'horas', value: timeLeft.hours },
    { label: 'min',   value: timeLeft.minutes },
    { label: 'seg',   value: timeLeft.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 max-w-[260px] mx-auto">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="w-full rounded-xl bg-princess-pink-light/70 border border-princess-rose/15 py-2 text-center">
            <span className="font-serif-display text-[17px] font-bold text-princess-rose leading-none">
              {item.value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="text-[9px] font-bold tracking-wider text-princess-text/45 uppercase">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
