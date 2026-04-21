import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ProductCard from '@/components/ui/ProductCard';
import AdsBanner from '@/components/ui/AdsBanner';
import Link from 'next/link';
import { Product, Category, Province } from '@/types';
import {
  Search, Tag, MapPin, Package,
  ShoppingBag, Store, ChevronRight
} from 'lucide-react';

export default async function HomePage() {
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>

      <Navbar />

      {/* Categorías */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-3">
        </div>
        <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Link
            href="/"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: 'var(--primary)',
              color: '#fff',
              border: '1px solid transparent',
            }}
          >
            <Package size={14} />
            Todo
          </Link>
          {categories?.map((cat: Category) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.id}`}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap"
              style={{
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
      {!user && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="btn-accent flex items-center justify-center gap-2">
            <Store size={16} />
            Publicar anuncio
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
            style={{ border: '1.5px solid var(--primary-muted)', color: '#000' }}
          >
            <ShoppingBag size={16} />
            Iniciar sesión
          </Link>
        </div>
      )}


      <main className="flex-1">

        {/* Hero */}
        {/* <section style={{ background: 'var(--primary)' }} className="py-14 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Compra y Vende en Cuba
            </h1>
            <p className="text-base md:text-lg mb-8" style={{ color: 'var(--primary-muted)' }}>
              Encuentra lo que necesitas en tu provincia
            </p>

            {!user && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register" className="btn-accent flex items-center justify-center gap-2">
                  <Store size={16} />
                  Publicar anuncio
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
                  style={{ border: '1.5px solid var(--primary-muted)', color: '#fff' }}
                >
                  <ShoppingBag size={16} />
                  Iniciar sesión
                </Link>
              </div>
            )}
          </div>
        </section>*/}

        {/* Banner de publicidad */}
        {ads && ads.length > 0 && <AdsBanner ads={ads} />}


        {/* Provincias */}
        <section className="max-w-7xl mx-auto px-4 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={15} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Filtrar por provincia
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {provinces?.map((prov: Province) => (
              <Link
                key={prov.id}
                href={`/search?province=${prov.id}`}
                className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                style={{
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
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">Últimos anuncios</h2>
            <Link
              href="/search"
              className="flex items-center gap-1 text-sm font-medium transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Ver todos
              <ChevronRight size={15} />
            </Link>
          </div>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 card">
              <Search size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                No hay productos todavía
              </p>
              <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
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