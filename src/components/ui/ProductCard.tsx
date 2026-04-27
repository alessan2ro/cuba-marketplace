'use client';

import Link from 'next/link';
import { MapPin, Store, Tag, Package } from 'lucide-react';
import { Product, StoreProduct } from '@/types';
import PriceDisplay from './PriceDisplay';

interface ProductCardProps {
  product: Product | StoreProduct;
  usdToCup?: number;
}

export default function ProductCard({ product, usdToCup = 530 }: ProductCardProps) {
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

  return (
    <>
      <style>{`
        .product-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.2s, transform 0.2s;
          box-shadow: var(--shadow-sm);
          text-decoration: none;
          color: inherit;
          cursor: pointer;
        }
        .product-card:hover {
          box-shadow: var(--shadow);
          transform: translateY(-2px);
        }
        .product-card:hover .product-img {
          transform: scale(1.04);
        }
        .product-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 0.5rem;
          transition: transform 0.25s ease;
        }
      `}</style>

      <Link href={href} className="product-card">

        {/* Imagen */}
        <div style={{
          width: '100%',
          aspectRatio: '4/3',
          background: 'var(--surface-2)',
          overflow: 'hidden',
          position: 'relative',
          flexShrink: 0,
        }}>
          {mainImage ? (
            <img src={mainImage.image_url} alt={title} className="product-img" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={36} style={{ color: 'var(--text-muted)' }} />
            </div>
          )}

          {/* Badges */}
          <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {!isStoreProduct && regularProduct.condition && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 600,
                padding: '0.2rem 0.5rem', borderRadius: '999px',
                background: regularProduct.condition === 'nuevo' ? '#dcfce7' : 'var(--surface-2)',
                color: regularProduct.condition === 'nuevo' ? '#166534' : 'var(--text-secondary)',
                border: `1px solid ${regularProduct.condition === 'nuevo' ? '#bbf7d0' : 'var(--border)'}`,
              }}>
                {regularProduct.condition === 'nuevo' ? 'Nuevo' : 'Usado'}
              </span>
            )}
            {isStoreProduct && storeProduct.has_discount && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 700,
                padding: '0.2rem 0.5rem', borderRadius: '999px',
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

        {/* Contenido */}
        <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>

          {/* Tienda / ubicación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', minWidth: 0 }}>
            {isStoreProduct ? (
              <>
                <Store size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--accent)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '8rem' }}>
                  {storeInfo?.name || '—'}
                </span>
                {storeProduct.category && (
                  <>
                    <span style={{ color: 'var(--border)', fontSize: '0.68rem' }}>·</span>
                    <Tag size={9} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '6rem' }}>
                      {storeProduct.category}
                    </span>
                  </>
                )}
              </>
            ) : (
              <>
                <MapPin size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {regularProduct.provinces?.name || ''}
                </span>
                {regularProduct.categories && (
                  <>
                    <span style={{ color: 'var(--border)', fontSize: '0.68rem' }}>·</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {regularProduct.categories.name}
                    </span>
                  </>
                )}
              </>
            )}
          </div>

          {/* Título */}
          <h3 style={{
            fontSize: '0.85rem', fontWeight: 600,
            color: 'var(--text-primary)', lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0,
          }}>
            {title}
          </h3>

          {/* Descripción */}
          {description && (
            <p style={{
              fontSize: '0.72rem', color: 'var(--text-secondary)',
              lineHeight: 1.5, display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', margin: 0,
            }}>
              {description}
            </p>
          )}

          {/* Precio */}
          <div style={{ marginTop: 'auto', paddingTop: '0.375rem' }}>
            <PriceDisplay
              price={product.price}
              currencyType={currencyType}
              usdToCup={usdToCup}
              size="sm"
              hasDiscount={isStoreProduct ? storeProduct.has_discount : false}
              originalPrice={isStoreProduct ? storeProduct.original_price : null}
              
            />
          </div>
        </div>
      </Link>
    </>
  );
}