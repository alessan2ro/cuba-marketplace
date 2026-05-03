'use client';

import Link from 'next/link';
import { MapPin, Store, Tag, Package } from 'lucide-react';
import { Product, StoreProduct } from '@/types';
import PriceDisplay from './PriceDisplay';


interface ProductCardProps {
  product: Product | StoreProduct;
  usdToCup?: number;
  layout?: 'grid' | 'list';
}

export default function ProductCard({ product, usdToCup = 530, layout = 'grid' }: ProductCardProps) {
  const isStoreProduct = 'store_id' in product && !('title' in product);

  const mainImage = isStoreProduct
    ? (product as StoreProduct).store_product_images?.find(img => img.is_main)
    || (product as StoreProduct).store_product_images?.[0]
    : (product as Product).product_images?.find(img => img.is_main)
    || (product as Product).product_images?.[0];

  const title = isStoreProduct
    ? (product as StoreProduct).name
    : (product as Product).title;

  const description = isStoreProduct
    ? (product as StoreProduct).description
    : (product as Product).description;

  const href = isStoreProduct
    ? `/store/${(product as StoreProduct).store_id}/products/${product.id}`
    : `/products/${product.id}`;

  const storeProduct = product as StoreProduct;
  const regularProduct = product as Product;

  const storeRaw = isStoreProduct ? storeProduct.stores : null;
  const storeInfo = Array.isArray(storeRaw) ? storeRaw[0] : storeRaw;

  const currencyType = isStoreProduct
    ? (storeProduct.currency_type || 'CUP')
    : 'USD';

  if (layout === 'list') {
    return (
      <>
        <style>{`
          .product-card-list {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.875rem;
            text-decoration: none;
            color: inherit;
            transition: box-shadow 0.2s, transform 0.15s;
            box-shadow: var(--shadow-sm);
          }
          .product-card-list:hover {
            box-shadow: var(--shadow);
            transform: translateY(-1px);
          }
        `}</style>
        <Link href={href} className="product-card-list">

          {/* Imagen */}
          <div style={{
            width: '5rem', height: '5rem',
            flexShrink: 0,
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {mainImage ? (
              <img
                src={mainImage.image_url}
                alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.25rem' }}
              />
            ) : (
              <Package size={24} style={{ color: 'var(--text-muted)' }} />
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>

            {/* Tienda */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              {isStoreProduct ? (
                <>
                  <Store size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {storeInfo?.name || '—'}
                  </span>
                </>
              ) : (
                <>
                  <MapPin size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {regularProduct.provinces?.name || ''}
                  </span>
                </>
              )}
            </div>

            {/* Título */}
            <h3 style={{
              fontSize: '0.875rem', fontWeight: 600,
              color: 'var(--text-primary)', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {title}
            </h3>

            {/* Descripción */}
            {description && (
              <p style={{
                fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {description}
              </p>
            )}

            {/* Categoría y badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
              {isStoreProduct && storeProduct.category && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {storeProduct.category}
                </span>
              )}
              {isStoreProduct && storeProduct.has_discount && (
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700,
                  padding: '0.1rem 0.4rem', borderRadius: '999px',
                  background: '#fef2f2', color: 'var(--error)',
                  border: '1px solid #fecaca',
                }}>
                  {storeProduct.original_price
                    ? `-${Math.round((1 - storeProduct.price / storeProduct.original_price) * 100)}%`
                    : 'Oferta'}
                </span>
              )}
            </div>
          </div>

          {/* Precio */}
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <PriceDisplay
              price={product.price}
              currencyType={currencyType}
              usdToCup={usdToCup}
              size="sm"
              hasDiscount={isStoreProduct ? storeProduct.has_discount : false}
              originalPrice={isStoreProduct ? storeProduct.original_price : null}
            />
          </div>
        </Link>
      </>
    );
  }
}