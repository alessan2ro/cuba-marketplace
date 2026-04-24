'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown } from 'lucide-react';

interface Province {
  id: number;
  name: string;
}

interface Props {
  provinces: Province[];
  selected?: string;
}

export default function ProvinceDropdown({ provinces, selected }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const selectedProvince = provinces.find(p => p.id.toString() === selected);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (provinceId?: number) => {
    setOpen(false);
    if (provinceId) {
      router.push(`/search?province=${provinceId}`);
    } else {
      router.push('/');
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.4rem 0.875rem',
          borderRadius: '999px',
          fontSize: '0.8rem',
          fontWeight: 600,
          background: 'var(--surface)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <MapPin size={13} style={{ color: 'var(--accent)' }} />
        {selectedProvince?.name || 'Todas las provincias'}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 0.5rem)',
          left: 0,
          zIndex: 50,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          minWidth: '12rem',
          maxHeight: '16rem',
          overflowY: 'auto',
          padding: '0.375rem',
        }}>
          <button
            onClick={() => handleSelect()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius)',
              fontSize: '0.8rem',
              fontWeight: !selected ? 700 : 400,
              color: !selected ? 'var(--primary)' : 'var(--text-secondary)',
              background: !selected ? 'var(--primary-light)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Todas las provincias
          </button>
          {provinces.map(prov => (
            <button
              key={prov.id}
              onClick={() => handleSelect(prov.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius)',
                fontSize: '0.8rem',
                fontWeight: selected === prov.id.toString() ? 700 : 400,
                color: selected === prov.id.toString() ? 'var(--primary)' : 'var(--text-secondary)',
                background: selected === prov.id.toString() ? 'var(--primary-light)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (selected !== prov.id.toString()) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)';
                }
              }}
              onMouseLeave={e => {
                if (selected !== prov.id.toString()) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              {prov.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}