import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import SearchFilters from '@/components/ui/SearchFilters';
import InfiniteProductGrid from '@/components/ui/InfiniteProductGrid';
import { getExchangeRate } from '@/lib/exchangeRate';
import Link from 'next/link';
import { StoreProduct } from '@/types';
import { Search } from 'lucide-react';

const PAGE_SIZE = 12;

interface Props {
  searchParams: Promise<{
    q?: string;
    category?: string;
    province?: string;
    sort?: string;
    min?: string;
    max?: string;
  }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const exchangeRate = await getExchangeRate();

  let query = supabase
    .from('store_products')
    .select(`
      id, store_id, seller_id, name, description,
      category, quantity, price, has_discount,
      original_price, status, specifications,
      currency_type, created_at, updated_at,
      stores(id, name, province_id),
      store_product_images(id, image_url, is_main, imagekit_file_id, product_id)
    `, { count: 'exact' })
    .eq('status', 'active');

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%,category.ilike.%${params.q}%`);
  }

  if (params.min) query = query.gte('price', parseFloat(params.min));
  if (params.max) query = query.lte('price', parseFloat(params.max));

  if (params.sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (params.sort === 'price_desc') query = query.order('price', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  query = query.range(0, PAGE_SIZE - 1);

  const { data: products, count } = await query;

  let filteredProducts = (products || []) as unknown as StoreProduct[];


// if (params.province) {
//   filteredProducts = filteredProducts.filter(p => {
//     const store = Array.isArray(p.stores) ? p.stores[0] : p.stores;
//     return (store as { province_id?: number })?.province_id?.toString() === params.province;
//   });
// }
  if (params.category) {
    const { data: catStores } = await supabase
      .from('stores')
      .select('id')
      .eq('category_id', parseInt(params.category));
    if (catStores) {
      const ids = catStores.map(s => s.id);
      filteredProducts = filteredProducts.filter(p => ids.includes(p.store_id));
    }
  }

  const { data: categories } = await supabase.from('categories').select('*');
  const { data: provinces } = await supabase.from('provinces').select('*');

  const hasFilters = !!(params.q || params.category || params.province || params.sort || params.min || params.max);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: '48rem', margin: '0 auto', width: '100%', padding: '1.5rem 1rem 4rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.2rem' }}>
              {params.q
                ? <><span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Resultados: </span>"{params.q}"</>
                : 'Todos los productos'}
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              {count || 0} producto{(count || 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {hasFilters && (
              <Link href="/search" style={{ fontSize: '0.75rem', color: 'var(--error)', textDecoration: 'none' }}>
                Limpiar
              </Link>
            )}
            <SearchFilters categories={categories || []} provinces={provinces || []} />
          </div>
        </div>

        {/* Chips de filtros activos */}
        {hasFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1rem' }}>
            {params.q && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 500, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-muted)' }}>
                <Search size={10} /> "{params.q}"
              </span>
            )}
            {params.category && categories?.find(c => c.id.toString() === params.category) && (
              <span style={{ fontSize: '0.72rem', fontWeight: 500, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                {categories.find(c => c.id.toString() === params.category)?.name}
              </span>
            )}
            {params.province && provinces?.find(p => p.id.toString() === params.province) && (
              <span style={{ fontSize: '0.72rem', fontWeight: 500, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                📍 {provinces.find(p => p.id.toString() === params.province)?.name}
              </span>
            )}
            {params.min && (
              <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Desde {params.min} CUP
              </span>
            )}
            {params.max && (
              <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Hasta {params.max} CUP
              </span>
            )}
          </div>
        )}

        {/* Grid infinito */}
        <InfiniteProductGrid
          initialProducts={filteredProducts}
          searchParams={params}
          usdToCup={exchangeRate.usdToCup}
          totalCount={count || 0}
        />
      </main>

      <Footer />
    </div>
  );
}