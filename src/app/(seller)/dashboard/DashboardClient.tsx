'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Store as StoreType, Category, DaySchedule } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import {
  User, Bell, Settings, Store, BarChart2, LogOut,
  Lock, ChevronRight, MapPin, MessageCircle, Phone,
  AlertCircle, CheckCircle, Menu, X, Plus, Trash2,
  Pencil, Clock, CreditCard, Upload, Building2
} from 'lucide-react';


interface Province {
  id: number;
  name: string;
}

interface SellerProvince {
  province_id: number;
  provinces: Province;
}

interface Profile {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  role: string;
  seller_account: boolean;
  subscription_status: 'inactive' | 'pending' | 'active' | 'suspended';
  subscription_start: string | null;
  subscription_end: string | null;
  created_at: string;
  seller_provinces: SellerProvince[];
}

interface Props {
  profile: Profile;
  email: string;
  userId: string;
  initialStores: StoreType[];
  categories: Category[];
}

const PLANS = [
  { months: 1, label: '1 mes', price: 200, saving: null, popular: false },
  { months: 3, label: '3 meses', price: 500, saving: 100, popular: true },
  { months: 6, label: '6 meses', price: 900, saving: 300, popular: false },
  { months: 12, label: '1 año', price: 1600, saving: 800, popular: false },
];

const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'QvaPay'];
const WA_NUMBER = '5354250705';
type PanelType = 'perfil' | 'tienda' | 'metricas' | 'notificaciones' | 'ajustes';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const HOURS = [
  '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM',
  '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM',
];

const defaultSchedule = (): Record<string, DaySchedule> =>
  Object.fromEntries(DAYS.map(d => [d, { open: false, from: '08:00 AM', to: '05:00 PM' }]));

interface StoreForm {
  name: string;
  description: string;
  category_id: string;
  payment_methods: string[];
  phones: string[];
  website_url: string;
  address: string;
  schedule: Record<string, DaySchedule>;
  currency: string[];
  delivery: boolean;
  facebook: string;
  instagram: string;
  twitter: string;
  image_url: string;
  imagekit_file_id: string;
}

const emptyStoreForm: StoreForm = {
  name: '',
  description: '',
  category_id: '',
  payment_methods: [],
  phones: [],
  website_url: '',
  address: '',
  schedule: defaultSchedule(),
  currency: [],
  delivery: false,
  facebook: '',
  instagram: '',
  twitter: '',
  image_url: '',
  imagekit_file_id: '',
};
const CURRENCIES = ['CUP', 'USD', 'MLC'];


export default function DashboardClient({ profile, email, userId, initialStores, categories }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [activePanel, setActivePanel] = useState<PanelType>('perfil');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState<typeof PLANS[0] | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(profile.subscription_status);
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Tienda
  const [stores, setStores] = useState<StoreType[]>(initialStores);
  const [storeForm, setStoreForm] = useState<StoreForm>(emptyStoreForm);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showStoreForm, setShowStoreForm] = useState(false);

  const now = new Date();
  const subEnd = profile.subscription_end ? new Date(profile.subscription_end) : null;
  const isPending = subscriptionStatus === 'pending';
  const isExpired = subscriptionStatus === 'active' && subEnd ? subEnd < now : false;
  const isActive = subscriptionStatus === 'active' && !isExpired;

  const statusLabel = isExpired ? 'Vencida' : {
    inactive: 'Inactiva', pending: 'Pendiente',
    active: 'Activa', suspended: 'Suspendida',
  }[subscriptionStatus];

  const statusStyle = isExpired
    ? { background: '#fef2f2', color: 'var(--error)', border: '1px solid #fecaca' }
    : {
      inactive: { background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
      pending: { background: '#fefce8', color: '#854d0e', border: '1px solid #fef08a' },
      active: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' },
      suspended: { background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
    }[subscriptionStatus];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const navigate = (panel: PanelType, locked: boolean) => {
    if (locked) return;
    setActivePanel(panel);
    setSidebarOpen(false);
  };

  const buildWhatsAppMessage = (plan: typeof PLANS[0]) => {
    const date = new Date().toLocaleDateString('es-CU');
    return `*Solicitud de suscripción LoTengo*\n\nID de usuario: ${userId}\nUsuario: @${profile.username}\nPlan: ${plan.label}\nPrecio: ${plan.price} CUP\nFecha: ${date}`;
  };

  const handleSendWhatsApp = async () => {
    if (!modalPlan) return;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(modalPlan))}`, '_blank');
    await supabase.from('profiles').update({ subscription_status: 'pending' }).eq('id', userId);
    setSubscriptionStatus('pending');
    setModalPlan(null);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveMsg('');
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', userId);
    setSaving(false);
    setSaveMsg(error ? 'Error al guardar' : '¡Guardado!');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  // ── Tienda ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'stores');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.url) {
      setStoreForm(prev => ({ ...prev, image_url: data.url, imagekit_file_id: data.fileId }));
    }
    setUploadingImage(false);
  };

  const togglePayment = (method: string) => {
    setStoreForm(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method],
    }));
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreLoading(true);
    setStoreError('');

    if (!storeForm.name.trim()) {
      setStoreError('El nombre del negocio es obligatorio');
      setStoreLoading(false);
      return;
    }

    const payload = {
      seller_id: userId,
      name: storeForm.name,
      description: storeForm.description || null,
      category_id: storeForm.category_id ? parseInt(storeForm.category_id) : null,
      payment_methods: storeForm.payment_methods,
      phones: storeForm.phones,
      website_url: storeForm.website_url || null,
      address: storeForm.address || null,
      schedule: storeForm.schedule,
      currency: storeForm.currency,
      delivery: storeForm.delivery,
      facebook: storeForm.facebook || null,
      instagram: storeForm.instagram || null,
      twitter: storeForm.twitter || null,
      image_url: storeForm.image_url || null,
      imagekit_file_id: storeForm.imagekit_file_id || null,
      updated_at: new Date().toISOString(),
    };

    if (editingStoreId) {
      const { error } = await supabase.from('stores').update(payload).eq('id', editingStoreId);
      if (error) { setStoreError(error.message); setStoreLoading(false); return; }
    } else {
      const { error } = await supabase.from('stores').insert(payload);
      if (error) { setStoreError(error.message); setStoreLoading(false); return; }
    }

    const { data } = await supabase
      .from('stores')
      .select('*, categories(name, icon)')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    setStores(data || []);
    setStoreForm(emptyStoreForm);
    setEditingStoreId(null);
    setShowStoreForm(false);
    setStoreLoading(false);
  };

  const handleEditStore = (store: StoreType) => {
    setStoreForm({
      name: store.name,
      description: store.description || '',
      category_id: store.category_id?.toString() || '',
      payment_methods: store.payment_methods || [],
      phones: store.phones || [],
      website_url: store.website_url || '',
      address: store.address || '',
      schedule: Object.keys(store.schedule || {}).length > 0
        ? store.schedule
        : defaultSchedule(),
      currency: store.currency || [],
      delivery: store.delivery || false,
      facebook: store.facebook || '',
      instagram: store.instagram || '',
      twitter: store.twitter || '',
      image_url: store.image_url || '',
      imagekit_file_id: store.imagekit_file_id || '',
    });
    setEditingStoreId(store.id);
    setShowStoreForm(true);
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('¿Eliminar esta tienda?')) return;
    await supabase.from('stores').delete().eq('id', storeId);
    setStores(prev => prev.filter(s => s.id !== storeId));
  };

  const navItems = [
    { key: 'perfil' as PanelType, label: 'Mi perfil', icon: <User size={16} />, locked: false },
    { key: 'tienda' as PanelType, label: 'Mi tienda', icon: <Store size={16} />, locked: !isActive },
    { key: 'metricas' as PanelType, label: 'Métricas', icon: <BarChart2 size={16} />, locked: !isActive },
    { key: 'notificaciones' as PanelType, label: 'Notificaciones', icon: <Bell size={16} />, locked: !isActive },
    { key: 'ajustes' as PanelType, label: 'Ajustes', icon: <Settings size={16} />, locked: false },
  ];

  const SidebarContent = () => (
    <>
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="logo" style={{ fontSize: '1.1rem' }}>
          <Image src="/images/lotengo-logo.png" alt="LoTengo" width={26} height={26} />
          LoTengo
        </Link>
      </div>

      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: 'var(--primary)' }}
          >
            {profile.username?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              @{profile.username}
            </p>
            <span className="badge text-xs mt-0.5 inline-flex" style={statusStyle}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => navigate(item.key, item.locked)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{
              cursor: item.locked ? 'not-allowed' : 'pointer',
              opacity: item.locked ? 0.4 : 1,
              background: activePanel === item.key && !item.locked ? 'var(--primary-light)' : 'transparent',
              color: activePanel === item.key && !item.locked ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activePanel === item.key ? 600 : 400,
            }}
          >
            {item.icon}
            <span className="flex-1 text-left">{item.label}</span>
            {item.locked && <Lock size={12} style={{ color: 'var(--text-muted)' }} />}
          </button>
        ))}
      </nav>

      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--error)';
            (e.currentTarget as HTMLElement).style.background = '#fef2f2';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>

      {/* Sidebar escritorio */}
      <aside
        className="hidden md:flex flex-col w-56 fixed top-0 left-0 h-full z-40"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar móvil overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar móvil drawer */}
      <aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col w-64 md:hidden transition-transform duration-300"
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link href="/" className="logo" style={{ fontSize: '1.1rem' }}>
            <Image src="/images/logo.png" alt="LoTengo" width={26} height={26} />
            LoTengo
          </Link>
          <button onClick={() => setSidebarOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              {profile.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                @{profile.username}
              </p>
              <span className="badge text-xs mt-0.5 inline-flex" style={statusStyle}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => navigate(item.key, item.locked)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                cursor: item.locked ? 'not-allowed' : 'pointer',
                opacity: item.locked ? 0.4 : 1,
                background: activePanel === item.key && !item.locked ? 'var(--primary-light)' : 'transparent',
                color: activePanel === item.key && !item.locked ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: activePanel === item.key ? 600 : 400,
              }}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.locked && <Lock size={12} style={{ color: 'var(--text-muted)' }} />}
            </button>
          ))}
        </nav>

        <div className="px-3 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm"
            style={{ color: 'var(--error)' }}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 md:ml-56 min-w-0">

        {/* Topbar móvil */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg"
            style={{ background: 'var(--surface-2)', color: 'var(--text-primary)' }}
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="logo" style={{ fontSize: '1rem' }}>
            <Image src="/images/logo.png" alt="LoTengo" width={22} height={22} />
            LoTengo
          </Link>
          <div className="w-9" />
        </div>

        <div className="p-4 md:p-8">

          {/* ── Panel: Mi perfil ── */}
          {activePanel === 'perfil' && (
            <div className="max-w-2xl mx-auto">
              <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                Mi perfil
              </h1>

              <div className="card mb-5">
                <h2 className="text-sm font-semibold mb-4 pb-3" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  Información de cuenta
                </h2>
                {[
                  { label: 'Usuario', value: `@${profile.username}` },
                  { label: 'Nombre', value: profile.full_name },
                  { label: 'Correo', value: email },
                  { label: 'Teléfono', value: profile.phone || '—' },
                  { label: 'Miembro desde', value: new Date(profile.created_at).toLocaleDateString('es-CU') },
                  { label: 'Suscripción', value: statusLabel, highlight: true },
                  { label: 'Inicio', value: profile.subscription_start ? new Date(profile.subscription_start).toLocaleDateString('es-CU') : '—' },
                  { label: 'Vence', value: subEnd ? subEnd.toLocaleDateString('es-CU') : '—', expired: isExpired },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2.5 text-sm" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{
                      color: row.highlight
                        ? isExpired ? 'var(--error)' : isActive ? 'var(--success)' : 'var(--text-muted)'
                        : row.expired ? 'var(--error)' : 'var(--text-primary)',
                      fontWeight: 500,
                    }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Provincias */}
              <div className="card mb-5">
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin size={14} /> Provincias donde vendes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.seller_provinces?.map(sp => (
                    <span key={sp.province_id} className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-muted)' }}>
                      {sp.provinces?.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tiendas del vendedor */}
              {stores.length > 0 && (
                <div className="card mb-5">
                  <h2 className="text-sm font-semibold mb-4 pb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <Building2 size={14} /> Mis tiendas
                  </h2>
                  <div className="space-y-3">
                    {stores.map(store => (
                      <div key={store.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        {store.image_url ? (
                          <img src={store.image_url} alt={store.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--primary-light)' }}>
                            <Store size={20} style={{ color: 'var(--primary)' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{store.name}</p>
                          {store.categories && (
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {store.categories.icon} {store.categories.name}
                            </p>
                          )}
                        </div>

                        {/* Dentro de la tarjeta del store en el listado */}
                        {store.rating_count > 0 && (
                          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#f59e0b' }}>
                            {'★'.repeat(Math.round(store.rating_avg))}
                            <span style={{ color: 'var(--text-muted)' }}>
                              ({store.rating_avg} · {store.rating_count} valoraciones)
                            </span>
                          </p>
                        )}

                        {store.is_verified && (
                          <span
                            className="badge text-xs mt-1 inline-flex items-center gap-1"
                            style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                          >
                            ✓ Verificado
                          </span>
                        )}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => { handleEditStore(store); setActivePanel('tienda'); }}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteStore(store.id)}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: 'var(--error)', background: '#fef2f2' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aviso pendiente */}
              {isPending && (
                <div className="flex items-start gap-3 p-4 rounded-xl mb-5 text-sm" style={{ background: '#fefce8', border: '1px solid #fef08a', color: '#854d0e' }}>
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5">Solicitud enviada</p>
                    <p>Un administrador revisará tu solicitud pronto.</p>
                  </div>
                </div>
              )}

              {/* Vencida */}
              {isExpired && (
                <div className="flex items-start gap-3 p-4 rounded-xl mb-5 text-sm" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--error)' }}>
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-0.5">Suscripción vencida</p>
                    <p>Venció el {subEnd?.toLocaleDateString('es-CU')}. Renueva tu plan.</p>
                  </div>
                </div>
              )}

              {/* Planes */}
              {(!isActive || isExpired) && !isPending && (
                <>
                  <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Planes de suscripción</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {PLANS.map(plan => (
                      <div
                        key={plan.months}
                        className="card card-hover cursor-pointer relative"
                        style={{ border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                        onClick={() => setModalPlan(plan)}
                      >
                        {plan.popular && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'var(--primary)', color: '#fff' }}>
                            Más popular
                          </span>
                        )}
                        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{plan.label}</p>
                        <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{plan.price.toLocaleString()}</p>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>CUP</p>
                        {plan.saving && <p className="text-xs mb-3" style={{ color: 'var(--success)' }}>Ahorro {plan.saving} CUP</p>}
                        <button className="btn-primary w-full justify-center">Adquirir</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Panel: Crear Tienda ── */}
          {activePanel === 'tienda' && (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {editingStoreId ? 'Editar tienda' : 'Crear tienda'}
                </h1>
                {!showStoreForm && (
                  <button
                    onClick={() => { setStoreForm(emptyStoreForm); setEditingStoreId(null); setShowStoreForm(true); }}
                    className="btn-primary"
                  >
                    <Plus size={15} /> Nueva tienda
                  </button>
                )}
              </div>

              {/* Formulario */}
              {showStoreForm && (
                <div className="card mb-6">
                  <h2 className="text-sm font-semibold mb-5 pb-3" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                    {editingStoreId ? 'Editar información' : 'Información del negocio'}
                  </h2>

                  {storeError && (
                    <div className="text-sm px-4 py-3 rounded-lg mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--error)' }}>
                      {storeError}
                    </div>
                  )}

                  <form onSubmit={handleStoreSubmit} className="space-y-6">

                    {/* Imagen */}
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Imagen del negocio
                      </label>
                      <div className="flex items-center gap-4">
                        {storeForm.image_url ? (
                          <img src={storeForm.image_url} alt="preview" className="w-20 h-20 rounded-xl object-cover" style={{ border: '1px solid var(--border)' }} />
                        ) : (
                          <div className="w-20 h-20 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)', border: '2px dashed var(--border)' }}>
                            <Upload size={20} style={{ color: 'var(--text-muted)' }} />
                          </div>
                        )}
                        <label className="btn-secondary cursor-pointer">
                          {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                        </label>
                      </div>
                    </div>

                    {/* Nombre */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Nombre del negocio *
                      </label>
                      <input
                        type="text"
                        value={storeForm.name}
                        onChange={e => setStoreForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="Ej: Tienda de Ropa Juan"
                        className="input"
                      />
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Descripción del negocio
                      </label>
                      <textarea
                        value={storeForm.description}
                        onChange={e => setStoreForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe tu negocio, productos o servicios..."
                        rows={3}
                        className="input"
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    {/* Categoría */}
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Categoría
                      </label>
                      <select
                        value={storeForm.category_id}
                        onChange={e => setStoreForm(prev => ({ ...prev, category_id: e.target.value }))}
                        className="input"
                      >
                        <option value="">Seleccionar categoría</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Métodos de pago */}
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Métodos de pago aceptados
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PAYMENT_METHODS.map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => togglePayment(method)}
                            className="text-xs px-3 py-1.5 rounded-full transition-all font-medium"
                            style={{
                              border: storeForm.payment_methods.includes(method) ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                              background: storeForm.payment_methods.includes(method) ? 'var(--accent-light)' : 'var(--surface)',
                              color: storeForm.payment_methods.includes(method) ? 'var(--accent)' : 'var(--text-secondary)',
                            }}
                          >
                            {storeForm.payment_methods.includes(method) && '✓ '}{method}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Moneda */}
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Moneda aceptada
                      </label>
                      <div className="flex gap-2">
                        {CURRENCIES.map(cur => (
                          <button
                            key={cur}
                            type="button"
                            onClick={() => setStoreForm(prev => ({
                              ...prev,
                              currency: prev.currency.includes(cur)
                                ? prev.currency.filter(c => c !== cur)
                                : [...prev.currency, cur],
                            }))}
                            className="text-xs px-4 py-1.5 rounded-full transition-all font-semibold"
                            style={{
                              border: storeForm.currency.includes(cur) ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                              background: storeForm.currency.includes(cur) ? 'var(--primary-light)' : 'var(--surface)',
                              color: storeForm.currency.includes(cur) ? 'var(--primary)' : 'var(--text-secondary)',
                            }}
                          >
                            {storeForm.currency.includes(cur) && '✓ '}{cur}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Domicilio */}
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Servicio a domicilio</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>¿Realizas entregas a domicilio?</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStoreForm(prev => ({ ...prev, delivery: !prev.delivery }))}
                        className="relative w-11 h-6 rounded-full transition-all"
                        style={{ background: storeForm.delivery ? 'var(--accent)' : 'var(--border)' }}
                      >
                        <span
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                          style={{ transform: storeForm.delivery ? 'translateX(20px)' : 'translateX(0)' }}
                        />
                      </button>
                    </div>

                    {/* Teléfonos */}
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Teléfonos de contacto
                      </label>
                      <div className="space-y-2">
                        {storeForm.phones.map((phone, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="tel"
                              value={phone}
                              onChange={e => {
                                const updated = [...storeForm.phones];
                                updated[idx] = e.target.value;
                                setStoreForm(prev => ({ ...prev, phones: updated }));
                              }}
                              placeholder="+53 5 000 0000"
                              className="input flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => setStoreForm(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== idx) }))}
                              className="px-3 rounded-lg transition-all"
                              style={{ background: '#fef2f2', color: 'var(--error)' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setStoreForm(prev => ({ ...prev, phones: [...prev.phones, ''] }))}
                          className="btn-secondary text-xs"
                        >
                          <Plus size={13} /> Agregar teléfono
                        </button>
                      </div>
                    </div>

                    {/* Dirección y URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                          Dirección
                        </label>
                        <input
                          type="text"
                          value={storeForm.address}
                          onChange={e => setStoreForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Calle, municipio, provincia"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                          Sitio web
                        </label>
                        <input
                          type="url"
                          value={storeForm.website_url}
                          onChange={e => setStoreForm(prev => ({ ...prev, website_url: e.target.value }))}
                          placeholder="https://..."
                          className="input"
                        />
                      </div>
                    </div>


                    {/* Horario por día */}
                    <div>
                      <label className="block text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                        Días y horario de atención
                      </label>
                      <div className="space-y-2">
                        {DAYS.map(day => {
                          const dayData = storeForm.schedule[day] || { open: false, from: '09:00 AM', to: '05:00 PM' };
                          return (
                            <div
                              key={day}
                              className="rounded-xl p-3 transition-all"
                              style={{
                                border: `1px solid ${dayData.open ? 'var(--accent)' : 'var(--border)'}`,
                                background: dayData.open ? 'var(--accent-light)' : 'var(--surface-2)',
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {/* Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => setStoreForm(prev => ({
                                      ...prev,
                                      schedule: {
                                        ...prev.schedule,
                                        [day]: { ...dayData, open: !dayData.open },
                                      },
                                    }))}
                                    className="relative w-9 h-5 rounded-full transition-all shrink-0"
                                    style={{ background: dayData.open ? 'var(--accent)' : 'var(--border)' }}
                                  >
                                    <span
                                      className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform"
                                      style={{ transform: dayData.open ? 'translateX(16px)' : 'translateX(0)' }}
                                    />
                                  </button>
                                  <span
                                    className="text-sm font-medium w-24"
                                    style={{ color: dayData.open ? 'var(--accent)' : 'var(--text-muted)' }}
                                  >
                                    {day}
                                  </span>
                                </div>
                                {!dayData.open && (
                                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Cerrado</span>
                                )}
                              </div>

                              {dayData.open && (
                                <div className="flex items-center gap-2 mt-1">
                                  <select
                                    value={dayData.from}
                                    onChange={e => setStoreForm(prev => ({
                                      ...prev,
                                      schedule: {
                                        ...prev.schedule,
                                        [day]: { ...dayData, from: e.target.value },
                                      },
                                    }))}
                                    className="input text-xs py-1.5"
                                    style={{ flex: 1 }}
                                  >
                                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>a</span>
                                  <select
                                    value={dayData.to}
                                    onChange={e => setStoreForm(prev => ({
                                      ...prev,
                                      schedule: {
                                        ...prev.schedule,
                                        [day]: { ...dayData, to: e.target.value },
                                      },
                                    }))}
                                    className="input text-xs py-1.5"
                                    style={{ flex: 1 }}
                                  >
                                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Redes sociales */}
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Redes sociales
                      </label>
                      <div className="space-y-3">
                        {[
                          { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/tunegocio', color: '#1877F2' },
                          { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/tunegocio', color: '#E1306C' },
                          { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/tunegocio', color: '#000000' },
                        ].map(social => (
                          <div key={social.key} className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                              style={{ background: social.color }}
                            >
                              {social.label[0]}
                            </div>
                            <input
                              type="url"
                              value={storeForm[social.key as keyof StoreForm] as string}
                              onChange={e => setStoreForm(prev => ({ ...prev, [social.key]: e.target.value }))}
                              placeholder={social.placeholder}
                              className="input flex-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>



                    {/* Botones */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setShowStoreForm(false); setEditingStoreId(null); setStoreForm(emptyStoreForm); }}
                        className="btn-secondary flex-1 justify-center"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={storeLoading || uploadingImage}
                        className="btn-primary flex-1 justify-center"
                        style={{ opacity: storeLoading ? 0.6 : 1 }}
                      >
                        {storeLoading ? 'Guardando...' : editingStoreId ? 'Actualizar' : 'Crear tienda'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lista de tiendas */}
              {stores.length > 0 ? (
                <div className="space-y-3">
                  {stores.map(store => (
                    <div key={store.id} className="card flex items-center gap-4">
                      {store.image_url ? (
                        <img src={store.image_url} alt={store.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary-light)' }}>
                          <Store size={24} style={{ color: 'var(--primary)' }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{store.name}</p>
                        {store.categories && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {store.categories.icon} {store.categories.name}
                          </p>
                        )}
                        {store.address && (
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                            <MapPin size={11} /> {store.address}
                          </p>
                        )}

                        {store.payment_methods?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {store.payment_methods.map(m => (
                              <span key={m} className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid var(--accent-light)', fontSize: '10px' }}>
                                {m}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Dentro de la tarjeta del store en el listado */}
                        {store.rating_count > 0 && (
                          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#f59e0b' }}>
                            {'★'.repeat(Math.round(store.rating_avg))}
                            <span style={{ color: 'var(--text-muted)' }}>
                              ({store.rating_avg} · {store.rating_count} valoraciones)
                            </span>
                          </p>
                        )}

                        {store.is_verified && (
                          <span
                            className="badge text-xs mt-1 inline-flex items-center gap-1"
                            style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
                          >
                            ✓ Verificado
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleEditStore(store)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          onClick={() => handleDeleteStore(store.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: '#fef2f2', color: 'var(--error)' }}
                        >
                          <Trash2 size={12} /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !showStoreForm ? (
                <div className="text-center py-16 card">
                  <Store size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No tienes tiendas creadas</p>
                  <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Crea tu primera tienda para mostrarla a los compradores</p>
                  <button
                    onClick={() => { setStoreForm(emptyStoreForm); setEditingStoreId(null); setShowStoreForm(true); }}
                    className="btn-primary"
                  >
                    <Plus size={15} /> Crear tienda
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* ── Panel: Bloqueado ── */}
          {(activePanel === 'metricas' || activePanel === 'notificaciones') && (
            <div className="max-w-sm mx-auto mt-24 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--primary-light)' }}>
                <Lock size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Sección bloqueada</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Disponible con suscripción activa.</p>
              <button onClick={() => setActivePanel('perfil')} className="btn-primary">
                Ver planes <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* ── Panel: Ajustes ── */}
          {activePanel === 'ajustes' && (
            <div className="max-w-xl mx-auto">
              <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Ajustes</h1>

              <div className="card mb-5">
                <h2 className="text-sm font-semibold mb-4 pb-3" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  Datos personales
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nombre completo</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Teléfono</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="input" />
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={handleSaveSettings} disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.6 : 1 }}>
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    {saveMsg && (
                      <span className="flex items-center gap-1.5 text-sm" style={{ color: saveMsg.includes('Error') ? 'var(--error)' : 'var(--success)' }}>
                        <CheckCircle size={14} /> {saveMsg}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-sm font-semibold mb-3 pb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <MapPin size={14} /> Provincias donde vendes
                </h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.seller_provinces?.map(sp => (
                    <span key={sp.province_id} className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-muted)' }}>
                      {sp.provinces?.name}
                    </span>
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>Para modificar las provincias contacta al administrador.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal WhatsApp */}
      {modalPlan && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-sm" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={18} style={{ color: 'var(--accent)' }} />
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Confirmar suscripción</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Se enviará este mensaje al administrador:</p>
            <div className="rounded-xl p-4 text-xs leading-relaxed mb-5 whitespace-pre-line font-mono" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {buildWhatsAppMessage(modalPlan)}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalPlan(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button
                onClick={handleSendWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all"
                style={{ background: '#16a34a', color: '#fff' }}
              >
                Enviar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}