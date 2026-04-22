import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ProductCard from '@/components/ui/ProductCard';
import {
    MapPin, Clock, Phone, Globe,
    CheckCircle, Star, Truck, Package
} from 'lucide-react';
import { StoreProduct } from '@/types';

interface Props {
    params: Promise<{ storeId: string }>;
}

export default async function PublicStorePage({ params }: Props) {
    const { storeId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    let navProfile = null;
    if (user) {
        const { data } = await supabase
            .from('profiles')
            .select('username, role')
            .eq('id', user.id)
            .single();
        navProfile = data;
    }

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

    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const today = days[new Date().getDay()];
    const todaySchedule = store.schedule?.[today];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
            <Navbar />

            {/* Banner tienda */}
            <div style={{ background: 'var(--primary)', padding: '2rem 1rem' }}>
                <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
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
                            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>
                                {store.description}
                            </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            {store.rating_count > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Star size={13} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{store.rating_avg}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>({store.rating_count})</span>
                                </div>
                            )}
                            {store.delivery && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Truck size={13} color="rgba(255,255,255,0.8)" />
                                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>Envío a domicilio</span>
                                </div>
                            )}
                            {todaySchedule && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={13} color="rgba(255,255,255,0.8)" />
                                    <span style={{ fontSize: '0.8rem', color: todaySchedule.open ? '#86efac' : '#fca5a5', fontWeight: 600 }}>
                                        {todaySchedule.open ? `Abierto · ${todaySchedule.from} - ${todaySchedule.to}` : 'Cerrado hoy'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1.5rem 1rem 4rem', display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr' }} className="store-layout">
                <style>{`
          @media (min-width: 768px) {
            .store-layout { grid-template-columns: 16rem 1fr !important; align-items: start; }
          }
        `}</style>

                {/* Sidebar info */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                            Información
                        </h3>

                        {store.address && (
                            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
                                <MapPin size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '0.1rem' }} />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{store.address}</span>
                            </div>
                        )}

                        {store.phones && store.phones.length > 0 && store.phones.map((p: string, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                                <Phone size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                <a href={`tel:${p}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>{p}</a>
                            </div>
                        ))}

                        {store.website_url && (
                            <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                                <Globe size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                <a href={store.website_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>
                                    Sitio web
                                </a>
                            </div>
                        )}

                        {/* Redes */}
                        {(store.facebook || store.instagram || store.twitter) && (
                            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem' }}>
                                {(store.facebook || store.instagram || store.twitter) && (
                                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.25rem' }}>
                                        {store.facebook && (
                                            <a href={store.facebook} target="_blank" rel="noopener noreferrer"
                                                style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius)', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                                                </svg>
                                            </a>
                                        )}
                                        {store.instagram && (
                                            <a href={store.instagram} target="_blank" rel="noopener noreferrer"
                                                style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius)', background: '#fdf2f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9d174d' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                                    <circle cx="12" cy="12" r="4" />
                                                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                                                </svg>
                                            </a>
                                        )}
                                        {store.twitter && (
                                            <a href={store.twitter} target="_blank" rel="noopener noreferrer"
                                                style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                </svg>
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pagos y moneda */}
                        {store.payment_methods?.length > 0 && (
                            <div>
                                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pagos</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {store.payment_methods.map((m: string) => (
                                        <span key={m} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-light)' }}>
                                            {m}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {store.currency?.length > 0 && (
                            <div>
                                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monedas</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                    {store.currency.map((c: string) => (
                                        <span key={c} style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'var(--gold-light)', color: 'var(--gold)' }}>
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Horario */}
                    {store.schedule && Object.keys(store.schedule).length > 0 && (
                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.875rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                                Horario
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                {days.map(day => {
                                    const s = store.schedule[day];
                                    const isToday = day === today;
                                    return s ? (
                                        <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius)', background: isToday ? 'var(--primary-light)' : 'transparent' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: isToday ? 700 : 400, color: isToday ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                                {day.slice(0, 3)}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: s.open ? (isToday ? 'var(--primary)' : 'var(--success)') : 'var(--text-muted)' }}>
                                                {s.open ? `${s.from} - ${s.to}` : 'Cerrado'}
                                            </span>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}
                </aside>

                {/* Productos */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            Productos ({products?.length || 0})
                        </h2>
                    </div>

                    {products && products.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }} className="products-grid">
                            <style>{`
                @media (min-width: 640px) {
                  .products-grid { grid-template-columns: repeat(3, 1fr) !important; }
                }
              `}</style>
                            {products.map(product => (
                                <ProductCard key={product.id} product={product as StoreProduct} />
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                            <Package size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Sin productos</p>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Esta tienda no tiene productos activos aún</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}