'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  icon: string;
}

interface Province {
  id: number;
  name: string;
}

interface Props {
  categories: Category[];
  provinces: Province[];
}

export default function SearchFilters({ categories, provinces }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedProvince, setSelectedProvince] = useState(searchParams.get('province') || '');
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || '');
  const [selectedSort, setSelectedSort] = useState(searchParams.get('sort') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max') || '');

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedProvince(searchParams.get('province') || '');
    setSelectedCondition(searchParams.get('condition') || '');
    setSelectedSort(searchParams.get('sort') || '');
    setMinPrice(searchParams.get('min') || '');
    setMaxPrice(searchParams.get('max') || '');
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    const q = searchParams.get('q');
    if (q) params.set('q', q);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedProvince) params.set('province', selectedProvince);
    if (selectedCondition) params.set('condition', selectedCondition);
    if (selectedSort) params.set('sort', selectedSort);
    if (minPrice) params.set('min', minPrice);
    if (maxPrice) params.set('max', maxPrice);
    router.push(`/search?${params.toString()}`);
    setOpen(false);
  };

  const clearFilters = () => {
    const q = searchParams.get('q');
    router.push(q ? `/search?q=${q}` : '/search');
    setOpen(false);
  };

  const activeCount = [selectedCategory, selectedProvince, selectedCondition, selectedSort, minPrice, maxPrice]
    .filter(Boolean).length;

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const optionBtn = (active: boolean) => ({
    padding: '0.4rem 0.875rem',
    borderRadius: '999px',
    fontSize: '0.78rem',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    background: active ? 'var(--primary-light)' : 'var(--surface)',
    color: active ? 'var(--primary)' : 'var(--text-secondary)',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <>
      {/* Botón abrir filtros */}
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text-secondary)', fontSize: '0.8rem',
          fontWeight: 500, cursor: 'pointer', flexShrink: 0,
          position: 'relative',
        }}
      >
        <SlidersHorizontal size={15} />
        Filtros
        {activeCount > 0 && (
          <span style={{
            width: '1.1rem', height: '1.1rem', borderRadius: '50%',
            background: 'var(--primary)', color: '#fff',
            fontSize: '0.6rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {activeCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel de filtros - drawer desde la derecha */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100%',
        width: 'min(22rem, 100vw)',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 50,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1,
        }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Filtros
          </h2>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Categoría */}
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Categoría
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              <button onClick={() => setSelectedCategory('')} style={optionBtn(!selectedCategory)}>Todas</button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id.toString())}
                  style={optionBtn(selectedCategory === cat.id.toString())}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Provincia */}
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Provincia
            </p>
            <select
              value={selectedProvince}
              onChange={e => setSelectedProvince(e.target.value)}
              style={inputStyle}
            >
              <option value="">Todas las provincias</option>
              {provinces.map(prov => (
                <option key={prov.id} value={prov.id.toString()}>{prov.name}</option>
              ))}
            </select>
          </div>

          {/* Rango de precio */}
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rango de precio (CUP)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Mínimo</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  placeholder="0"
                  min={0}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Máximo</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  placeholder="Sin límite"
                  min={0}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Ordenar */}
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ordenar por
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {[
                { label: 'Más recientes', value: '' },
                { label: 'Menor precio', value: 'price_asc' },
                { label: 'Mayor precio', value: 'price_desc' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedSort(opt.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.8rem',
                    fontWeight: selectedSort === opt.value ? 600 : 400,
                    cursor: 'pointer',
                    border: `1px solid ${selectedSort === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                    background: selectedSort === opt.value ? 'var(--primary-light)' : 'var(--surface)',
                    color: selectedSort === opt.value ? 'var(--primary)' : 'var(--text-secondary)',
                    textAlign: 'left' as const,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: '0.75rem',
          position: 'sticky', bottom: 0,
          background: 'var(--surface)',
        }}>
          <button
            onClick={clearFilters}
            style={{
              flex: 1, padding: '0.625rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem', fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Limpiar
          </button>
          <button
            onClick={applyFilters}
            className="btn-primary"
            style={{ flex: 1, justifyContent: 'center', padding: '0.625rem' }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </>
  );
}