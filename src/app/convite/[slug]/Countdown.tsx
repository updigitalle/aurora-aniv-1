'use client';

import React, { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: Date;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="text-center py-4 bg-white/40 backdrop-blur-md rounded-2xl border border-princess-pink/10 max-w-sm mx-auto">
        <span className="font-serif-display font-bold text-xl text-princess-rose">O grande dia chegou! 🎉</span>
      </div>
    );
  }

  const items = [
    { label: 'dias', value: timeLeft.days },
    { label: 'horas', value: timeLeft.hours },
    { label: 'min', value: timeLeft.minutes },
    { label: 'seg', value: timeLeft.seconds },
  ];

  return (
    <div className="flex justify-center items-center gap-3 max-w-md mx-auto">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/70 backdrop-blur-sm border border-princess-pink/20 shadow-sm flex flex-col items-center justify-center animate-float"
          style={{ animationDelay: `${idx * 0.4}s` }}
        >
          <span className="font-serif-display text-lg md:text-xl font-bold text-princess-rose">
            {item.value.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] md:text-xs text-princess-text/60 uppercase tracking-wider mt-0.5 font-semibold">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
