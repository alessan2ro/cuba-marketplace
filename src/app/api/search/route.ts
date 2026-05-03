import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const province = searchParams.get('province') || '';
  const sort = searchParams.get('sort') || '';
  const min = searchParams.get('min') || '';
  const max = searchParams.get('max') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

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

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
  }

  if (min) query = query.gte('price', parseFloat(min));
  if (max) query = query.lte('price', parseFloat(max));

  if (sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (sort === 'price_desc') query = query.order('price', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  query = query.range(from, to);

  const { data: products, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let filtered = products || [];

  if (province) {
    filtered = filtered.filter(p => {
      const store = Array.isArray(p.stores) ? p.stores[0] : p.stores;
      return (store as { province_id?: number })?.province_id?.toString() === province;
    });
  }

  if (category) {
    const { data: catStores } = await supabase
      .from('stores')
      .select('id')
      .eq('category_id', parseInt(category));
    if (catStores) {
      const ids = catStores.map(s => s.id);
      filtered = filtered.filter(p => ids.includes(p.store_id));
    }
  }

  return NextResponse.json({ products: filtered, total: count || 0 });
}