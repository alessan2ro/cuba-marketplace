'use client';

import Link from 'next/link';
import { CheckCircle, Store } from 'lucide-react';

interface FeaturedStore {
  id: string;
  name: string;
  image_url: string | null;
  is_verified: boolean;
  rating_avg: number;
  categories?: { name: string; icon: string }[] | null;
}

interface Props {
  stores: FeaturedStore[];
}

export default function FeaturedStores({ stores }: Props) {
  if (!stores || stores.length === 0) return null;

  return (
    <section style={{ padding: '1.5rem 0 0' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', paddingLeft: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tiendas recomendadas
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
            fontSize: '0.65rem', fontWeight: 600,
            padding: '0.15rem 0.5rem', borderRadius: '999px',
            background: '#eff6ff', color: '#1d4ed8',
            border: '1px solid #bfdbfe',
          }}>
            <CheckCircle size={9} /> Verificadas
          </span>
        </div>
      </div>

      {/* Scroll horizontal */}
      <div style={{
        display: 'flex',
        gap: '1.25rem',
        overflowX: 'auto',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        paddingBottom: '0.75rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {stores.map(store => (
          <Link
            key={store.id}
            href={`/store/${store.id}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              flexShrink: 0,
              textDecoration: 'none',
              width: '5rem',
            }}
          >
            {/* Foto circular */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2.5px solid var(--primary)',
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {store.image_url ? (
                  <img
                    src={store.image_url}
                    alt={store.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Store size={22} style={{ color: 'var(--primary)' }} />
                )}
              </div>
              {/* Badge verificado */}
              {store.is_verified && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: '1.1rem',
                  height: '1.1rem',
                  borderRadius: '50%',
                  background: '#1d4ed8',
                  border: '2px solid var(--background)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <CheckCircle size={8} color="white" />
                </div>
              )}
            </div>

            {/* Nombre */}
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              textAlign: 'center',
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              width: '100%',
            }}>
              {store.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}