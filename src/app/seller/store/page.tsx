import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SellerStorePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, seller_account, subscription_status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'seller') redirect('/');

  // Si no tiene suscripción activa, al dashboard
  if (!profile.seller_account || profile.subscription_status !== 'active') {
    redirect('/dashboard');
  }

  // Buscar su primera tienda
  const { data: stores } = await supabase
    .from('stores')
    .select('id')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1);

  if (stores && stores.length > 0) {
    // Tiene tienda, ir directamente a publicar producto
    redirect(`/seller/store/${stores[0].id}/products/new`);
  } else {
    // No tiene tienda, ir al dashboard para crearla
    redirect('/dashboard?tab=tienda');
  }
}