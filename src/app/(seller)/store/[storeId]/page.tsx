import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import StoreProductsClient from './StoreProductsClient';

interface Props {
  params: Promise<{ storeId: string }>;
}

export default async function StoreProductsPage({ params }: Props) {
  const { storeId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: store } = await supabase
    .from('stores')
    .select('*, categories(name, icon)')
    .eq('id', storeId)
    .eq('seller_id', user.id)
    .single();

  if (!store) notFound();

  const { data: products } = await supabase
    .from('store_products')
    .select('*, store_product_images(image_url, is_main, imagekit_file_id)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  return (
    <StoreProductsClient
      store={store}
      initialProducts={products || []}
      userId={user.id}
    />
  );
}