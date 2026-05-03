'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from './ProductCard';
import { StoreProduct } from '@/types';
import { Package } from 'lucide-react';

interface Props {
  initialProducts: StoreProduct[];
  searchParams: {
    q?: string;
    category?: string;
    province?: string;
    sort?: string;
    min?: string;
    max?: string;
  };
  usdToCup: number;
  totalCount: number;
}

const PAGE_SIZE = 12;

export default function InfiniteProductGrid({ initialProducts, searchParams, usdToCup, totalCount }: Props) {
  const [products, setProducts] = useState<StoreProduct[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length < totalCount);
  const observerRef = useRef<HTMLDivElement>(null);

  // Reset cuando cambian los filtros
  useEffect(() => {
    setProducts(initialProducts);
    setPage(1);
    setHasMore(initialProducts.length < totalCount);
  }, [initialProducts, totalCount]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const nextPage = page + 1;
    const ps = new URLSearchParams();
    if (searchParams.q) ps.set('q', searchParams.q);
    if (searchParams.category) ps.set('category', searchParams.category);
    if (searchParams.province) ps.set('province', searchParams.province);
    if (searchParams.sort) ps.set('sort', searchParams.sort);
    if (searchParams.min) ps.set('min', searchParams.min);
    if (searchParams.max) ps.set('max', searchParams.max);
    ps.set('page', nextPage.toString());
    ps.set('_data', '1');

    const res = await fetch(`/api/search?${ps.toString()}`);
    if (!res.ok) { setLoading(false); return; }

    const { products: newProducts, total } = await res.json();
    setProducts(prev => [...prev, ...newProducts]);
    setPage(nextPage);
    setHasMore((page + 1) * PAGE_SIZE < total);
    setLoading(false);
  }, [loading, hasMore, page, searchParams]);

  // Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [loadMore]);

  if (products.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '5rem 1rem',
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
      }}>
        <Package size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          No se encontraron productos
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {searchParams.q
            ? `No hay resultados para "${searchParams.q}". Prueba con otras palabras.`
            : 'Prueba cambiando los filtros.'}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Lista linear */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            usdToCup={usdToCup}
            layout="list"
          />
        ))}
      </div>

      {/* Trigger de carga */}
      <div ref={observerRef} style={{ height: '2rem', marginTop: '1rem' }} />

      {/* Loader */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', gap: '0.5rem' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '0.5rem', height: '0.5rem',
                borderRadius: '50%',
                background: 'var(--primary)',
                animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite`,
              }}
            />
          ))}
          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); opacity: 0.4; }
              50% { transform: translateY(-6px); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {!hasMore && products.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '1rem' }}>
          Has visto todos los productos
        </p>
      )}
    </>
  );
}