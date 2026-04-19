'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface Ad {
  id: number;
  image_url: string;
  description: string;
  target_url: string;
}

interface AdsBannerProps {
  ads: Ad[];
}

export default function AdsBanner({ ads }: AdsBannerProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % ads.length);
  }, [ads.length]);

  const prev = () => {
    setCurrent(prev => (prev - 1 + ads.length) % ads.length);
  };

  useEffect(() => {
    if (paused || ads.length <= 1) return;
    timerRef.current = setInterval(next, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, next, ads.length]);

  if (!ads.length) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div
        className="relative rounded-xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Cards container */}
        <div className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}>
          {ads.map(ad => (
            <a
              key={ad.id}
              href={ad.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-full flex flex-col md:flex-row items-center gap-0 group"
            >
              {/* Imagen */}
              <div className="w-full md:w-64 h-40 md:h-36 shrink-0 overflow-hidden relative">

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ad.image_url}
                  alt={ad.description}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Descripción */}
              <div className="flex-1 px-6 py-4 flex items-center justify-between gap-4">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {ad.description}
                </p>
                <div
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all group-hover:scale-105"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  <ExternalLink size={12} />
                  Ver más
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Controles */}
        {ads.length > 1 && (
          <>
            <button
              onClick={e => { e.preventDefault(); prev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={e => { e.preventDefault(); next(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={16} />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {ads.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{
                    background: i === current ? 'var(--primary)' : 'var(--border-strong)',
                    width: i === current ? '1.5rem' : '0.375rem',
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}