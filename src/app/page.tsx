import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ProductCard from '@/components/ui/ProductCard';
import AdsBanner from '@/components/ui/AdsBanner';
import FeaturedStores from '@/components/ui/FeaturedStores';
import ProvinceDropdown from '@/components/ui/ProvinceDropdown';
import Link from 'next/link';
import { StoreProduct, Category, Province } from '@/types';
import { Package, ChevronRight, Search } from 'lucide-react';
import { getCategoryIcon } from '@/lib/categoryIcons';


export default async function HomePage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('store_products')
    .select(`
      id, store_id, seller_id, name, description,
      category, quantity, price, has_discount,
      original_price, status, specifications,
      created_at, updated_at,
      stores(id, name),
      store_product_images(image_url, is_main)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6);

  const latestProducts = (products ?? []) as StoreProduct[];

  const { data: categories } = await supabase
    .from('categories')
    .select('*');

  const { data: provinces } = await supabase
    .from('provinces')
    .select('*');

  const { data: ads } = await supabase
    .from('ads')
    .select('*')
    .eq('is_active', true)
    .order('order_index');

  const { data: featuredStores } = await supabase
    .from('stores')
    .select('id, name, image_url, is_verified, rating_avg, categories(name, icon)')
    .eq('is_verified', true)
    .order('rating_avg', { ascending: false })
    .limit(10);

  const typedStores = (featuredStores ?? []).map(s => ({
    ...s,
    categories: Array.isArray(s.categories) ? s.categories : null,
  }));

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--background)',
      overflowX: 'hidden',
    }}>
      <Navbar />

      <main style={{ flex: 1 }}>

        {/* Categorías con iconos - scroll horizontal */}
        <section style={{ padding: '1rem 0 0' }}>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingBottom: '0.75rem',
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
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius)',
                fontSize: '0.7rem',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                background: 'var(--primary)',
                color: '#fff',
                minWidth: '3.5rem',
              }}
            >
              <Package size={18} />
              Todo
            </Link>
            {categories?.map((cat: Category) => {
              const Icon = getCategoryIcon(cat.name);
              return (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.id}`}
                  style={{
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
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
                  <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)' }}>
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  {cat.name}
                </Link>
              );
            })}


          </div>
        </section>

        {/* Barra de filtro provincia + título */}
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Explorar productos
          </span>
          <ProvinceDropdown provinces={provinces || []} />
        </div>

        {/* Tiendas verificadas recomendadas */}
        {typedStores.length > 0 && (
          <FeaturedStores stores={typedStores} />
        )}

        {/* Banner publicidad */}
        {ads && ads.length > 0 && (
          <div style={{ maxWidth: '80rem', margin: '0.75rem auto 0', padding: '0 1rem' }}>
            <AdsBanner ads={ads} />
          </div>
        )}

        {/* Últimos anuncios */}
        <section style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Últimos anuncios
            </h2>
            <Link
              href="/search"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                fontSize: '0.8rem', fontWeight: 500,
                color: 'var(--accent)', textDecoration: 'none',
              }}
            >
              Ver todos <ChevronRight size={14} />
            </Link>
          </div>

          {latestProducts.length > 0 ? (
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}
              className="home-products-grid"
            >
              <style>{`
                @media(min-width: 640px) { .home-products-grid { grid-template-columns: repeat(3, 1fr) !important; } }
                @media(min-width: 1024px) { .home-products-grid { grid-template-columns: repeat(3, 1fr) !important; } }
              `}</style>
              {latestProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
            }}>
              <Search size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                No hay productos todavía
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                ¡Sé el primero en publicar!
              </p>
              <Link href="/login" className="btn-primary">
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