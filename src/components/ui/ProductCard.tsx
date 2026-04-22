import Link from 'next/link';
import { Product, StoreProduct } from '@/types';

interface ProductCardProps {
  product: Product | StoreProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isStoreProduct = 'name' in product;
  const mainImage = isStoreProduct
    ? product.store_product_images?.find(img => img.is_main) || product.store_product_images?.[0]
    : product.product_images?.find(img => img.is_main) || product.product_images?.[0];
  const title = isStoreProduct ? product.name : product.title;
  const href = isStoreProduct ? `/store/${product.store_id}` : `/products/${product.id}`;
  const locationLabel = isStoreProduct
    ? product.stores?.name || 'Tienda'
    : product.provinces?.name || '';
  const categoryLabel = isStoreProduct
    ? product.category || ''
    : `${product.categories?.icon || ''} ${product.categories?.name || ''}`.trim();
  const ownerLabel = isStoreProduct
    ? product.stores?.name || ''
    : product.profiles?.username || '';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency: 'CUP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link href={href}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer group">

        {/* Imagen */}
        <div className="relative w-full h-48 bg-gray-100">
          {mainImage ? (
            <img
              src={mainImage.image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Badge condición */}
          {!isStoreProduct && (
            <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-1 rounded-full ${product.condition === 'nuevo'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
              }`}>
              {product.condition === 'nuevo' ? 'Nuevo' : 'Usado'}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-gray-800 truncate group-hover:text-red-600 transition-colors">
            {title}
          </h3>

          <p className="text-lg font-bold text-red-600 mt-1">
            {formatPrice(product.price)}
          </p>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{locationLabel ? `📍 ${locationLabel}` : ''}</span>
            <span>{categoryLabel}</span>
          </div>

          {ownerLabel && (
            <div className="mt-2 text-xs text-gray-400">
              👤 {ownerLabel}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
