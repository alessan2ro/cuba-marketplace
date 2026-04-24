import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ProductCard from '@/components/ui/ProductCard';
import {
    MapPin, Clock, Phone, Globe,
    CheckCircle, Star, Truck, Package,
    CreditCard
} from 'lucide-react';
import { StoreProduct } from '@/types';
import StoreScheduleToggle from '@/components/ui/StoreScheduleToggle';

interface Props {
    params: Promise<{ storeId: string }>;
}

function getCubaTime() {
    const now = new Date();
    const cubaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Havana' }));
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = days[cubaTime.getDay()];
    const hours = cubaTime.getHours();
    const minutes = cubaTime.getMinutes();
    return { dayName, hours, minutes, cubaTime };
}

function parseTime12h(timeStr: string): { hours: number; minutes: number } | null {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
}

function isOpenNow(schedule: Record<string, { open: boolean; from: string; to: string }>) {
    const { dayName, hours, minutes } = getCubaTime();
    const todaySchedule = schedule?.[dayName];
    if (!todaySchedule || !todaySchedule.open) return false;

    const from = parseTime12h(todaySchedule.from);
    const to = parseTime12h(todaySchedule.to);
    if (!from || !to) return false;

    const nowMinutes = hours * 60 + minutes;
    const fromMinutes = from.hours * 60 + from.minutes;
    const toMinutes = to.hours * 60 + to.minutes;

    return nowMinutes >= fromMinutes && nowMinutes < toMinutes;
}

export default async function PublicStorePage({ params }: Props) {
    const { storeId } = await params;
    const supabase = await createClient();

    const { data: store } = await supabase
        .from('stores')
        .select('*, categories(name, icon)')
        .eq('id', storeId)
        .single();

    if (!store) notFound();

    const { data: products } = await supabase
        .from('store_products')
        .select('*, store_product_images(image_url, is_main), stores(id, name)')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    const { dayName: today } = getCubaTime();
    const todaySchedule = store.schedule?.[today];
    const open = store.schedule ? isOpenNow(store.schedule) : false;

    // Agrupar productos por categoría
    const productList = (products || []) as StoreProduct[];
    const grouped = productList.reduce((acc, product) => {
        const cat = product.category || 'Sin categoría';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(product);
        return acc;
    }, {} as Record<string, StoreProduct[]>);

    const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            <Navbar />

            {/* Banner */}
            <div style={{ background: 'var(--primary)', padding: '2rem 1rem' }}>
                <div style={{ maxWidth: '64rem', margin: '0 auto' }}>

                    {/* Fila principal */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>

                        {/* Logo tienda */}
                        {store.image_url ? (
                            <img
                                src={store.image_url}
                                alt={store.name}
                                style={{ width: '5rem', height: '5rem', borderRadius: 'var(--radius-lg)', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.2)', flexShrink: 0 }}
                            />
                        ) : (
                            <div style={{ width: '5rem', height: '5rem', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Package size={36} color="white" />
                            </div>
                        )}

                        {/* Info principal */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                                <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800, color: '#fff', margin: 0 }}>
                                    {store.name}
                                </h1>
                                {store.is_verified && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                                        <CheckCircle size={11} /> Verificado
                                    </span>
                                )}
                            </div>

                            {store.description && (
                                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                                    {store.description}
                                </p>
                            )}

                            {/* Rating */}
                            {store.rating_count > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} size={13} style={{ color: s <= Math.round(store.rating_avg) ? '#fbbf24' : 'rgba(255,255,255,0.3)', fill: s <= Math.round(store.rating_avg) ? '#fbbf24' : 'none' }} />
                                    ))}
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', marginLeft: '0.25rem' }}>{store.rating_avg}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>({store.rating_count} valoraciones)</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fila de detalles en el banner */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 2rem', padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'rgba(0,0,0,0.15)' }}>

                        {/* Dirección */}
                        {store.address && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={14} color="rgba(255,255,255,0.7)" />
                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>{store.address}</span>
                            </div>
                        )}

                        {/* Teléfonos */}
                        {store.phones?.map((p: string, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Phone size={14} color="rgba(255,255,255,0.7)" />
                                <a href={`tel:${p}`} style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>{p}</a>
                            </div>
                        ))}

                        {/* Web */}
                        {store.website_url && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Globe size={14} color="rgba(255,255,255,0.7)" />
                                <a href={store.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
                                    Sitio web
                                </a>
                            </div>
                        )}

                        {/* Domicilio */}
                        {store.delivery && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Truck size={14} color="rgba(255,255,255,0.7)" />
                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)' }}>Envío a domicilio</span>
                            </div>
                        )}

                        {/* Métodos de pago */}
                        {store.payment_methods?.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <CreditCard size={14} color="rgba(255,255,255,0.7)" />
                                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                    {store.payment_methods.map((m: string) => (
                                        <span key={m} style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Moneda */}
                        {store.currency?.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Moneda:</span>
                                {store.currency.map((c: string) => (
                                    <span key={c} style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                                        {c}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Redes sociales */}
                        {(store.facebook || store.instagram || store.twitter) && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {store.facebook && (
                                    <a href={store.facebook} target="_blank" rel="noopener noreferrer"
                                        style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                                        </svg>
                                    </a>
                                )}
                                {store.instagram && (
                                    <a href={store.instagram} target="_blank" rel="noopener noreferrer"
                                        style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="2" width="20" height="20" rx="5" />
                                            <circle cx="12" cy="12" r="4" />
                                            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                                        </svg>
                                    </a>
                                )}
                                {store.twitter && (
                                    <a href={store.twitter} target="_blank" rel="noopener noreferrer"
                                        style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Horario expandible - componente cliente */}
                        {store.schedule && Object.keys(store.schedule).length > 0 && (
                            <StoreScheduleToggle
                                schedule={store.schedule}
                                today={today}
                                todaySchedule={todaySchedule}
                                isOpen={open}
                                daysOrder={DAYS_ORDER}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Productos agrupados por categoría */}
            <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
                {Object.keys(grouped).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                        <Package size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Sin productos</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Esta tienda no tiene productos activos aún</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {Object.entries(grouped).map(([categoryName, categoryProducts]) => (
                            <div key={categoryName}>
                                {/* Header categoría */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    marginBottom: '1rem', paddingBottom: '0.625rem',
                                    borderBottom: '2px solid var(--primary-light)',
                                }}>
                                    <div style={{
                                        width: '0.25rem', height: '1.25rem',
                                        background: 'var(--primary)', borderRadius: '999px',
                                    }} />
                                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                        {categoryName}
                                    </h2>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 600,
                                        padding: '0.15rem 0.5rem', borderRadius: '999px',
                                        background: 'var(--primary-light)', color: 'var(--primary)',
                                    }}>
                                        {categoryProducts.length}
                                    </span>
                                </div>

                                {/* Grid de productos */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }} className="products-grid">
                                    <style>{`@media(min-width:640px){.products-grid{grid-template-columns:repeat(3,1fr)!important;}}@media(min-width:1024px){.products-grid{grid-template-columns:repeat(4,1fr)!important;}}`}</style>
                                    {categoryProducts.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}