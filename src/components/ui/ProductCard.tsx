'use client';

import Link from 'next/link';
import { ShoppingCart, Eye, MapPin, Store, Tag, Package } from 'lucide-react';
import { Product, StoreProduct } from '@/types';

interface ProductCardProps {
  product: Product | StoreProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isStoreProduct = 'store_id' in product && !('title' in product);

  const mainImage = isStoreProduct
    ? (product as StoreProduct).store_product_images?.find(img => img.is_main)
    || (product as StoreProduct).store_product_images?.[0]
    : (product as Product).product_images?.find(img => img.is_main)
    || (product as Product).product_images?.[0];

  const title = isStoreProduct ? (product as StoreProduct).name : (product as Product).title;
  const description = isStoreProduct
    ? (product as StoreProduct).description
    : (product as Product).description;

  const href = isStoreProduct
    ? `/store/${(product as StoreProduct).store_id}/products/${product.id}`
    : `/products/${product.id}`;

  const storeProduct = product as StoreProduct;
  const regularProduct = product as Product;

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: 'CUP',
      minimumFractionDigits: 0,
    }).format(p);

  return (
    <div className="product-card">
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
        }
        .product-card:hover {
          box-shadow: var(--shadow);
          transform: translateY(-2px);
        }
        .btn-ver {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 0.5rem;
          border-radius: var(--radius);
          font-size: 0.75rem;
          font-weight: 600;
          text-decoration: none;
          background: var(--primary-light);
          color: var(--primary);
          border: 1px solid var(--primary-muted);
          transition: all 0.15s;
        }
        .btn-ver:hover {
          background: var(--primary);
          color: #fff;
        }
        .btn-comprar {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 0.5rem;
          border-radius: var(--radius);
          font-size: 0.75rem;
          font-weight: 600;
          background: var(--primary);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-comprar:hover {
          background: var(--primary-hover);
        }
      `}</style>

      {/* Imagen */}
      <div style={{
        width: '100%',
        aspectRatio: '4/3',
        background: 'var(--surface-2)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {mainImage ? (
          <img
            src={mainImage.image_url}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '0.5rem',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Package size={36} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}

        {/* Badges */}
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          left: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        }}>
          {!isStoreProduct && regularProduct.condition && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              padding: '0.2rem 0.5rem',
              borderRadius: '999px',
              background: regularProduct.condition === 'nuevo' ? '#dcfce7' : 'var(--surface-2)',
              color: regularProduct.condition === 'nuevo' ? '#166534' : 'var(--text-secondary)',
              border: `1px solid ${regularProduct.condition === 'nuevo' ? '#bbf7d0' : 'var(--border)'}`,
            }}>
              {regularProduct.condition === 'nuevo' ? 'Nuevo' : 'Usado'}
            </span>
          )}
          {isStoreProduct && storeProduct.has_discount && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: '999px',
              background: '#fef2f2',
              color: 'var(--error)',
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
      <div style={{
        padding: '0.875rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>

        {/* Categoría / tienda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
          {isStoreProduct ? (
            <>
              <Store size={11} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 500 }}>
                {storeProduct.stores?.[0]?.name || 'Tienda'}
              </span>
              {storeProduct.category && (
                <>
                  <span style={{ color: 'var(--border)', fontSize: '0.7rem' }}>·</span>
                  <Tag size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {storeProduct.category}
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <MapPin size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {regularProduct.provinces?.name || ''}
              </span>
              {regularProduct.categories && (
                <>
                  <span style={{ color: 'var(--border)', fontSize: '0.7rem' }}>·</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {regularProduct.categories.icon} {regularProduct.categories.name}
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {/* Título */}
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          margin: 0,
        }}>
          {title}
        </h3>

        {/* Descripción */}
        {description && (
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0,
          }}>
            {description}
          </p>
        )}

        {/* Precio */}
        <div style={{ marginTop: 'auto', paddingTop: '0.375rem' }}>
          {isStoreProduct && storeProduct.has_discount && storeProduct.original_price ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--error)' }}>
                {formatPrice(storeProduct.price)}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                {formatPrice(storeProduct.original_price)}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Link href={href} className="btn-ver">
            <Eye size={13} />
            Ver
          </Link>
          <button className="btn-comprar" onClick={e => e.preventDefault()}>
            <ShoppingCart size={13} />
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}