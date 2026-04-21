'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft, Plus, Package, Pencil, Trash2,
  Tag, AlertCircle, CheckCircle, PauseCircle
} from 'lucide-react';
import { Store, StoreProduct } from '@/types';

interface Props {
  store: Store;
  initialProducts: StoreProduct[];
  userId: string;
}

export default function StoreProductsClient({ store, initialProducts, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [products, setProducts] = useState<StoreProduct[]>(initialProducts);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP', minimumFractionDigits: 0 }).format(p);

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    setActionLoading(productId);
    await supabase.from('store_products').delete().eq('id', productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
    setActionLoading(null);
  };

  const handleToggleStatus = async (product: StoreProduct) => {
    const newStatus = product.status === 'active' ? 'paused' : 'active';
    setActionLoading(product.id + 'status');
    await supabase.from('store_products').update({ status: newStatus }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p));
    setActionLoading(null);
  };

  const statusBadge = (status: StoreProduct['status']) => {
    const map = {
      active: { label: 'Activo', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', icon: <CheckCircle size={11} /> },
      paused: { label: 'Pausado', bg: '#fefce8', color: '#854d0e', border: '#fef08a', icon: <PauseCircle size={11} /> },
      sold_out: { label: 'Agotado', bg: '#fef2f2', color: '#991b1b', border: '#fecaca', icon: <AlertCircle size={11} /> },
    };
    const s = map[status];
    return (
      <span className="badge flex items-center gap-1" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
        {s.icon} {s.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 md:px-8 py-4 flex items-center justify-between"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-lg transition-all"
            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              {store.name}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {products.length} producto{products.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Link
          href={`/store/${store.id}/products/new`}
          className="btn-primary"
        >
          <Plus size={15} /> Nuevo producto
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">

        {products.length === 0 ? (
          <div className="text-center py-24 card">
            <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="font-semibold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
              Sin productos aún
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Agrega tu primer producto a esta tienda
            </p>
            <Link href={`/store/${store.id}/products/new`} className="btn-primary">
              <Plus size={15} /> Agregar producto
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(product => {
              const mainImg = product.store_product_images?.find(i => i.is_main)
                || product.store_product_images?.[0];
              return (
                <div
                  key={product.id}
                  className="card flex items-center gap-4"
                  style={{ padding: '0.875rem 1.25rem' }}
                >
                  {/* Imagen */}
                  <div
                    className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    {mainImg ? (
                      <img src={mainImg.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={22} style={{ color: 'var(--text-muted)' }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {product.name}
                      </p>
                      {statusBadge(product.status)}
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      {product.has_discount && product.original_price ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs line-through" style={{ color: 'var(--text-muted)' }}>
                            {formatPrice(product.original_price)}
                          </span>
                          <span className="text-sm font-bold" style={{ color: 'var(--error)' }}>
                            {formatPrice(product.price)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
                          {formatPrice(product.price)}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        · {product.quantity} unidad{product.quantity !== 1 ? 'es' : ''}
                      </span>
                      {product.category && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <Tag size={10} /> {product.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleStatus(product)}
                      disabled={actionLoading === product.id + 'status'}
                      className="p-2 rounded-lg text-xs transition-all"
                      style={{
                        background: product.status === 'active' ? '#fefce8' : 'var(--accent-light)',
                        color: product.status === 'active' ? '#854d0e' : 'var(--accent)',
                      }}
                      title={product.status === 'active' ? 'Pausar' : 'Activar'}
                    >
                      <PauseCircle size={15} />
                    </button>
                    <Link
                      href={`/store/${store.id}/products/${product.id}/edit`}
                      className="p-2 rounded-lg transition-all"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                      <Pencil size={15} />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={actionLoading === product.id}
                      className="p-2 rounded-lg transition-all"
                      style={{ background: '#fef2f2', color: 'var(--error)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}