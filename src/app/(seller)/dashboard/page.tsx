import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select(`*, seller_provinces(province_id, provinces(id, name))`)
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'seller') redirect('/');

  const { data: stores } = await supabase
    .from('stores')
    .select(`*, categories(name, icon)`)
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return (
    <DashboardClient
      profile={profile}
      email={user.email || ''}
      userId={user.id}
      initialStores={stores || []}
      categories={categories || []}
    />
  );
}