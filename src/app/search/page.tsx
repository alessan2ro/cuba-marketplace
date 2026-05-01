import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ProductCard from '@/components/ui/ProductCard';
import SearchFilters from '@/components/ui/SearchFilters';
import { getExchangeRate } from '@/lib/exchangeRate';
import Link from 'next/link';
import { StoreProduct } from '@/types';
import { Search, Package, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 12;

interface Props {
    searchParams: Promise<{
        q?: string;
        category?: string;
        province?: string;
        sort?: string;
        min?: string;
        max?: string;
        page?: string;
    }>;
}

export default async function SearchPage({ searchParams }: Props) {
    const params = await searchParams;
    const supabase = await createClient();
    const exchangeRate = await getExchangeRate();

    const page = Math.max(1, parseInt(params.page || '1'));
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Query base
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

    // Filtro por texto
    if (params.q) {
        query = query.or(`name.ilike.%${params.q}%,description.ilike.%${params.q}%,category.ilike.%${params.q}%`);
    }

    // Filtro por precio (en CUP, convertimos si es USD)
    if (params.min) {
        query = query.gte('price', parseFloat(params.min));
    }
    if (params.max) {
        query = query.lte('price', parseFloat(params.max));
    }

    // Ordenar
    if (params.sort === 'price_asc') {
        query = query.order('price', { ascending: true });
    } else if (params.sort === 'price_desc') {
        query = query.order('price', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    // Paginación
    query = query.range(from, to);

    const { data: products, count } = await query;

    // Filtro por provincia (a través de la tienda)
    let filteredProducts = (products || []) as unknown as StoreProduct[];
    if (params.province) {
        filteredProducts = filteredProducts.filter(p => {
            const store = Array.isArray(p.stores) ? p.stores[0] : p.stores;
            return (store as { province_id?: number })?.province_id?.toString() === params.province;
        });
    }

    // Filtro por categoría de tienda
    if (params.category) {
        const { data: catStores } = await supabase
            .from('stores')
            .select('id')
            .eq('category_id', parseInt(params.category));
        if (catStores) {
            const storeIds = catStores.map(s => s.id);
            filteredProducts = filteredProducts.filter(p => storeIds.includes(p.store_id));
        }
    }

    const totalPages = Math.ceil((count || 0) / PAGE_SIZE);

    const { data: categories } = await supabase.from('categories').select('*');
    const { data: provinces } = await supabase.from('provinces').select('*');

    const buildPageUrl = (p: number) => {
        const ps = new URLSearchParams();
        if (params.q) ps.set('q', params.q);
        if (params.category) ps.set('category', params.category);
        if (params.province) ps.set('province', params.province);
        if (params.sort) ps.set('sort', params.sort);
        if (params.min) ps.set('min', params.min);
        if (params.max) ps.set('max', params.max);
        ps.set('page', p.toString());
        return `/search?${ps.toString()}`;
    };

    const hasFilters = !!(params.q || params.category || params.province || params.sort || params.min || params.max);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            <main style={{ flex: 1, maxWidth: '80rem', margin: '0 auto', width: '100%', padding: '1.5rem 1rem 4rem' }}>

                {/* Header de búsqueda */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
                            {params.q ? (
                                <>Resultados para <span style={{ color: 'var(--accent)' }}>"{params.q}"</span></>
                            ) : (
                                'Todos los productos'
                            )}
                        </h1>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                            {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {hasFilters && (
                            <Link
                                href="/search"
                                style={{
                                    fontSize: '0.78rem', color: 'var(--error)',
                                    textDecoration: 'none', display: 'flex',
                                    alignItems: 'center', gap: '0.25rem',
                                }}
                            >
                                Limpiar filtros
                            </Link>
                        )}
                        <SearchFilters
                            categories={categories || []}
                            provinces={provinces || []}
                        />
                    </div>
                </div>

                {/* Filtros activos como chips */}
                {hasFilters && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '1.25rem' }}>
                        {params.q && (
                            <Link href={buildPageUrl(1).replace(`q=${params.q}&`, '').replace(`q=${params.q}`, '')} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                fontSize: '0.75rem', fontWeight: 500,
                                padding: '0.25rem 0.625rem', borderRadius: '999px',
                                background: 'var(--primary-light)', color: 'var(--primary)',
                                border: '1px solid var(--primary-muted)', textDecoration: 'none',
                            }}>
                                <Search size={11} /> "{params.q}" ×
                            </Link>
                        )}
                        {params.category && categories?.find(c => c.id.toString() === params.category) && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                fontSize: '0.75rem', fontWeight: 500,
                                padding: '0.25rem 0.625rem', borderRadius: '999px',
                                background: 'var(--surface-2)', color: 'var(--text-secondary)',
                                border: '1px solid var(--border)',
                            }}>
                                {categories.find(c => c.id.toString() === params.category)?.name}
                            </span>
                        )}
                        {params.province && provinces?.find(p => p.id.toString() === params.province) && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                fontSize: '0.75rem', fontWeight: 500,
                                padding: '0.25rem 0.625rem', borderRadius: '999px',
                                background: 'var(--surface-2)', color: 'var(--text-secondary)',
                                border: '1px solid var(--border)',
                            }}>
                                📍 {provinces.find(p => p.id.toString() === params.province)?.name}
                            </span>
                        )}
                        {params.min && (
                            <span style={{
                                fontSize: '0.75rem', fontWeight: 500,
                                padding: '0.25rem 0.625rem', borderRadius: '999px',
                                background: 'var(--surface-2)', color: 'var(--text-secondary)',
                                border: '1px solid var(--border)',
                            }}>
                                Desde {params.min} CUP
                            </span>
                        )}
                        {params.max && (
                            <span style={{
                                fontSize: '0.75rem', fontWeight: 500,
                                padding: '0.25rem 0.625rem', borderRadius: '999px',
                                background: 'var(--surface-2)', color: 'var(--text-secondary)',
                                border: '1px solid var(--border)',
                            }}>
                                Hasta {params.max} CUP
                            </span>
                        )}
                    </div>
                )}

                {/* Grid de productos */}
                {filteredProducts.length > 0 ? (
                    <>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '0.75rem',
                        }} className="search-grid">
                            <style>{`
                @media(min-width: 640px) { .search-grid { grid-template-columns: repeat(3, 1fr) !important; } }
                @media(min-width: 1024px) { .search-grid { grid-template-columns: repeat(4, 1fr) !important; } }
              `}</style>
                            {filteredProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    usdToCup={exchangeRate.usdToCup}
                                />
                            ))}
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                                {page > 1 && (
                                    <Link href={buildPageUrl(page - 1)} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                                        padding: '0.5rem 0.875rem', borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)', background: 'var(--surface)',
                                        color: 'var(--text-secondary)', fontSize: '0.8rem',
                                        textDecoration: 'none', fontWeight: 500,
                                    }}>
                                        <ChevronLeft size={15} /> Anterior
                                    </Link>
                                )}

                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                                    .reduce((acc: (number | string)[], p, idx, arr) => {
                                        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((p, idx) => (
                                        typeof p === 'string' ? (
                                            <span key={`ellipsis-${idx}`} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>...</span>
                                        ) : (
                                            <Link
                                                key={p}
                                                href={buildPageUrl(p)}
                                                style={{
                                                    width: '2.25rem', height: '2.25rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    borderRadius: 'var(--radius)',
                                                    border: `1px solid ${p === page ? 'var(--primary)' : 'var(--border)'}`,
                                                    background: p === page ? 'var(--primary)' : 'var(--surface)',
                                                    color: p === page ? '#fff' : 'var(--text-secondary)',
                                                    fontSize: '0.8rem', fontWeight: p === page ? 700 : 400,
                                                    textDecoration: 'none',
                                                }}
                                            >
                                                {p}
                                            </Link>
                                        )
                                    ))
                                }

                                {page < totalPages && (
                                    <Link href={buildPageUrl(page + 1)} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                                        padding: '0.5rem 0.875rem', borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)', background: 'var(--surface)',
                                        color: 'var(--text-secondary)', fontSize: '0.8rem',
                                        textDecoration: 'none', fontWeight: 500,
                                    }}>
                                        Siguiente <ChevronRight size={15} />
                                    </Link>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{
                        textAlign: 'center', padding: '5rem 1rem',
                        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border)',
                    }}>
                        <Package size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                        <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            No se encontraron productos
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            {params.q
                                ? `No hay resultados para "${params.q}". Prueba con otras palabras.`
                                : 'Prueba cambiando los filtros de búsqueda.'}
                        </p>
                        <Link href="/search" className="btn-primary">
                            Ver todos los productos
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}