import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Store, Tag, Package,
    MapPin, Clock, ShoppingCart, Star,
    CheckCircle, Truck
} from 'lucide-react';
import { StoreProduct, StoreProductImage, Store as StoreType } from '@/types';

interface Props {
    params: Promise<{ storeId: string; productId: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
    const { storeId, productId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const { data: productData } = await supabase
        .from('store_products')
        .select(`
      *,
      store_product_images(id, image_url, is_main, imagekit_file_id),
      stores(
        id, name, address, phones, schedule,
        delivery, is_verified, rating_avg, rating_count,
        facebook, instagram, twitter, website_url,
        payment_methods, currency, image_url, description
      )
    `)
        .eq('id', productId)
        .eq('store_id', storeId)
        .eq('status', 'active')
        .single();

    if (!productData) notFound();

    const product = productData as StoreProduct & {
        stores: StoreType & {
            phones: string[];
            payment_methods: string[];
            currency: string[];
        };
    };

    const store = product.stores as StoreType & {
        phones: string[];
        payment_methods: string[];
        currency: string[];
    };

    const images = (product.store_product_images || []) as StoreProductImage[];
    const mainImage = images.find(i => i.is_main) || images[0];
    const otherImages = images.filter(i => i.id !== mainImage?.id);

    const formatPrice = (p: number) =>
        new Intl.NumberFormat('es-CU', {
            style: 'currency',
            currency: 'CUP',
            minimumFractionDigits: 0,
        }).format(p);

    const discountPct = product.has_discount && product.original_price
        ? Math.round((1 - product.price / product.original_price) * 100)
        : null;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>

            {/* Header */}
            <div style={{
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                padding: '0.875rem 1rem',
                position: 'sticky',
                top: 0,
                zIndex: 30,
            }}>
                <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link
                        href={`/store/${storeId}`}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '2rem', height: '2rem', borderRadius: 'var(--radius)',
                            background: 'var(--surface-2)', color: 'var(--text-secondary)',
                            textDecoration: 'none', flexShrink: 0,
                        }}
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Inicio</Link>
                            {' / '}
                            <Link href={`/store/${storeId}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                                {store?.name}
                            </Link>
                            {' / '}
                            <span style={{ color: 'var(--text-primary)' }}>{product.name}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="product-detail-grid">
                    <style>{`
            @media (min-width: 768px) {
              .product-detail-grid {
                grid-template-columns: 1fr 1fr !important;
              }
            }
          `}</style>

                    {/* Columna izquierda: imágenes */}
                    <div>
                        {/* Imagen principal */}
                        <div style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                            overflow: 'hidden',
                            aspectRatio: '1/1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.75rem',
                        }}>
                            {mainImage ? (
                                <img
                                    src={mainImage.image_url}
                                    alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }}
                                />
                            ) : (
                                <Package size={64} style={{ color: 'var(--text-muted)' }} />
                            )}
                        </div>

                        {/* Miniaturas */}
                        {otherImages.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                                {[mainImage, ...otherImages].filter(Boolean).map(img => (
                                    <div
                                        key={img.id}
                                        style={{
                                            width: '4rem',
                                            height: '4rem',
                                            flexShrink: 0,
                                            borderRadius: 'var(--radius)',
                                            overflow: 'hidden',
                                            border: img.id === mainImage?.id
                                                ? '2px solid var(--primary)'
                                                : '1px solid var(--border)',
                                            background: 'var(--surface)',
                                        }}
                                    >
                                        <img
                                            src={img.image_url}
                                            alt=""
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.25rem' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Columna derecha: info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                            {product.category && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                    fontSize: '0.7rem', fontWeight: 600,
                                    padding: '0.2rem 0.6rem', borderRadius: '999px',
                                    background: 'var(--accent-light)', color: 'var(--accent)',
                                    border: '1px solid var(--accent-light)',
                                }}>
                                    <Tag size={10} /> {product.category}
                                </span>
                            )}
                            {discountPct && (
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 700,
                                    padding: '0.2rem 0.6rem', borderRadius: '999px',
                                    background: '#fef2f2', color: 'var(--error)',
                                    border: '1px solid #fecaca',
                                }}>
                                    -{discountPct}% OFF
                                </span>
                            )}
                            {product.quantity === 0 && (
                                <span style={{
                                    fontSize: '0.7rem', fontWeight: 600,
                                    padding: '0.2rem 0.6rem', borderRadius: '999px',
                                    background: 'var(--surface-2)', color: 'var(--text-muted)',
                                    border: '1px solid var(--border)',
                                }}>
                                    Agotado
                                </span>
                            )}
                        </div>

                        {/* Nombre */}
                        <h1 style={{
                            fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.2,
                            margin: 0,
                        }}>
                            {product.name}
                        </h1>

                        {/* Precio */}
                        <div>
                            {product.has_discount && product.original_price ? (
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--error)', lineHeight: 1 }}>
                                        {formatPrice(product.price)}
                                    </span>
                                    <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                        {formatPrice(product.original_price)}
                                    </span>
                                </div>
                            ) : (
                                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                                    {formatPrice(product.price)}
                                </span>
                            )}
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {product.quantity > 0
                                    ? `${product.quantity} unidad${product.quantity !== 1 ? 'es' : ''} disponible${product.quantity !== 1 ? 's' : ''}`
                                    : 'Sin stock'}
                            </p>
                        </div>

                        {/* Descripción */}
                        {product.description && (
                            <p style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.7,
                                margin: 0,
                                padding: '1rem',
                                background: 'var(--surface-2)',
                                borderRadius: 'var(--radius)',
                                border: '1px solid var(--border)',
                            }}>
                                {product.description}
                            </p>
                        )}

                        {/* Especificaciones */}
                        {product.specifications && product.specifications.length > 0 && (
                            <div style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                }}>
                                    <Tag size={14} style={{ color: 'var(--accent)' }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Especificaciones
                                    </span>
                                </div>
                                {product.specifications.map((spec, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.625rem 1rem',
                                            borderBottom: idx < product.specifications.length - 1 ? '1px solid var(--border)' : 'none',
                                            background: idx % 2 === 0 ? 'transparent' : 'var(--surface-2)',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                            {spec.tag}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                                            {spec.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Botón comprar */}
                        <button
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.875rem',
                                borderRadius: 'var(--radius)',
                                fontSize: '1rem',
                                fontWeight: 700,
                                background: product.quantity > 0 ? 'var(--primary)' : 'var(--border)',
                                color: product.quantity > 0 ? '#fff' : 'var(--text-muted)',
                                border: 'none',
                                cursor: product.quantity > 0 ? 'pointer' : 'not-allowed',
                            }}
                            disabled={product.quantity === 0}
                        >
                            <ShoppingCart size={18} />
                            {product.quantity > 0 ? 'Comprar' : 'Sin stock'}
                        </button>
                    </div>
                </div>

                {/* Info de la tienda */}
                {store && (
                    <div style={{
                        marginTop: '2rem',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}>
                            <Store size={16} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Información de la tienda
                            </span>
                        </div>

                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {/* Nombre y verificación */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {store.image_url ? (
                                    <img
                                        src={store.image_url}
                                        alt={store.name}
                                        style={{ width: '3rem', height: '3rem', borderRadius: 'var(--radius)', objectFit: 'cover', flexShrink: 0 }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '3rem', height: '3rem',
                                        borderRadius: 'var(--radius)',
                                        background: 'var(--primary-light)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Store size={20} style={{ color: 'var(--primary)' }} />
                                    </div>
                                )}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {store.name}
                                        </span>
                                        {store.is_verified && (
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                fontSize: '0.65rem', fontWeight: 600,
                                                padding: '0.15rem 0.5rem', borderRadius: '999px',
                                                background: '#eff6ff', color: '#1d4ed8',
                                                border: '1px solid #bfdbfe',
                                            }}>
                                                <CheckCircle size={10} /> Verificado
                                            </span>
                                        )}
                                    </div>
                                    {store.rating_count > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                                            <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {store.rating_avg}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                ({store.rating_count} valoraciones)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detalles */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {store.address && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <MapPin size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '0.1rem' }} />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{store.address}</span>
                                    </div>
                                )}
                                {store.delivery && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Truck size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Envío a domicilio</span>
                                    </div>
                                )}
                                {store.phones && store.phones.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            📞 {store.phones.join(' · ')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Métodos de pago y moneda */}
                            {((store.payment_methods && store.payment_methods.length > 0) ||
                                (store.currency && store.currency.length > 0)) && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                        {store.payment_methods?.map(m => (
                                            <span key={m} style={{
                                                fontSize: '0.7rem', fontWeight: 500,
                                                padding: '0.2rem 0.6rem', borderRadius: '999px',
                                                background: 'var(--accent-light)', color: 'var(--accent)',
                                                border: '1px solid var(--accent-light)',
                                            }}>
                                                {m}
                                            </span>
                                        ))}
                                        {store.currency?.map(c => (
                                            <span key={c} style={{
                                                fontSize: '0.7rem', fontWeight: 600,
                                                padding: '0.2rem 0.6rem', borderRadius: '999px',
                                                background: 'var(--gold-light)', color: 'var(--gold)',
                                                border: '1px solid var(--gold-light)',
                                            }}>
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                )}

                            {/* Horario hoy */}
                            {store.schedule && Object.keys(store.schedule).length > 0 && (() => {
                                const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                                const today = days[new Date().getDay()];
                                const todaySchedule = store.schedule[today];
                                return todaySchedule ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Hoy ({today}):
                                        </span>
                                        <span style={{
                                            fontSize: '0.8rem', fontWeight: 600,
                                            color: todaySchedule.open ? 'var(--success)' : 'var(--error)',
                                        }}>
                                            {todaySchedule.open
                                                ? `${todaySchedule.from} - ${todaySchedule.to}`
                                                : 'Cerrado'}
                                        </span>
                                    </div>
                                ) : null;
                            })()}

                            {/* Ir a la tienda */}
                            <Link
                                href={`/store/${storeId}`}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.625rem 1rem',
                                    borderRadius: 'var(--radius)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    background: 'var(--primary-light)',
                                    color: 'var(--primary)',
                                    border: '1px solid var(--primary-muted)',
                                    alignSelf: 'flex-start',
                                }}
                            >
                                <Store size={15} />
                                Ver tienda completa
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}