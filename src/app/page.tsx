import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ProductCard from '@/components/ui/ProductCard';
import AdsBanner from '@/components/ui/AdsBanner';
import Link from 'next/link';
import { Product, Category, Province } from '@/types';
import { MapPin, Package, ChevronRight, Search, Store, ShoppingBag } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: products } = await supabase
    .from('products')
    .select(`*, profiles(username), categories(name, icon),
      provinces(name), product_images(image_url, is_main)`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(12);

  const { data: categories } = await supabase.from('categories').select('*');
  const { data: provinces } = await supabase.from('provinces').select('*');
  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .eq('is_active', true)
    .order('order_index');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)', overflowX: 'hidden' }}>
      <Navbar />

      <main style={{ flex: 1 }}>

        {/* Hero */}
        <section style={{ background: 'var(--primary)', padding: '3rem 1rem' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 800, color: '#fff', marginBottom: '0.75rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Compra y Vende en Cuba
            </h1>
            <p style={{ color: 'var(--primary-muted)', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', marginBottom: '2rem' }}>
              Encuentra lo que necesitas en tu provincia
            </p>
            {!user && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
                <Link
                  href="/register"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: 'var(--accent)', color: '#fff',
                    padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)',
                    fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                  }}
                >
                  <Store size={16} /> Publicar anuncio
                </Link>
                <Link
                  href="/login"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff',
                    padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)',
                    fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
                  }}
                >
                  <ShoppingBag size={16} /> Iniciar sesión
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Banner publicidad */}
        {ads && ads.length > 0 && (
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem 0' }}>
            <AdsBanner ads={ads} />
          </div>
        )}

        {/* Categorías - scroll horizontal sin romper layout */}
        <section style={{ padding: '1.5rem 0' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto', paddingLeft: '1rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Categorías
            </p>
          </div>
          {/* Contenedor de scroll - ocupa todo el ancho sin overflow oculto */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              overflowY: 'visible',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingBottom: '0.5rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <Link
              href="/"
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.4rem 1rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                background: 'var(--primary)',
                color: '#fff',
                border: '1px solid transparent',
              }}
            >
              <Package size={13} />
              Todo
            </Link>
            {categories?.map((cat: Category) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.id}`}
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.4rem 1rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  background: 'var(--surface)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Provincias */}
        <section style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <MapPin size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filtrar por provincia
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Link
              href="/"
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.875rem',
                borderRadius: '999px',
                fontWeight: 600,
                textDecoration: 'none',
                background: 'var(--primary)',
                color: '#fff',
                border: '1px solid transparent',
              }}
            >
              Todas
            </Link>
            {provinces?.map((prov: Province) => (
              <Link
                key={prov.id}
                href={`/search?province=${prov.id}`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.875rem',
                  borderRadius: '999px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  background: 'var(--surface)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                {prov.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Productos */}
        <section style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem 4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Últimos anuncios
            </h2>
            <Link
              href="/search"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                fontSize: '0.85rem', fontWeight: 500,
                color: 'var(--accent)', textDecoration: 'none',
              }}
            >
              Ver todos <ChevronRight size={15} />
            </Link>
          </div>

          {products && products.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem',
            }}
              className="md-grid-3 lg-grid-4"
            >
              {products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '4rem 1rem',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
            }}>
              <Search size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                No hay productos todavía
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                ¡Sé el primero en publicar!
              </p>
              <Link href="/register" className="btn-primary">
                Publicar ahora
              </Link>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}