import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ProductFormClient from './ProductFormClient';

interface Props {
  params: Promise<{ storeId: string }>;
}

export default async function NewProductPage({ params }: Props) {
  const { storeId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: store } = await supabase
    .from('stores')
    .select('id, name')
    .eq('id', storeId)
    .eq('seller_id', user.id)
    .single();

  if (!store) notFound();

  return <ProductFormClient storeId={storeId} storeName={store.name} userId={user.id} />;
}