import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (!session) redirect('/admin-panel-cm/login');

  let admin;
  try {
    admin = JSON.parse(session.value);
  } catch {
    redirect('/admin-panel-cm/login');
  }

  return <AdminDashboardClient adminName={admin.name} />;
}