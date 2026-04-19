import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select(`
    *,
    seller_provinces(
      province_id,
      provinces(id, name)
    )
  `)
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'seller') redirect('/');

  return (
    <DashboardClient
      profile={profile}
      email={user.email || ''}
      userId={user.id}
    />
  );
}