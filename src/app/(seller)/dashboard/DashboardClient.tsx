'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

import {
  User, Bell, Settings, Store,
  BarChart2, LogOut, Lock, ChevronRight,
  MapPin, MessageCircle, Phone, AlertCircle, CheckCircle
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
}

const PLANS = [
  { months: 1, label: '1 mes', price: 200, saving: null, popular: false },
  { months: 3, label: '3 meses', price: 500, saving: 100, popular: true },
  { months: 6, label: '6 meses', price: 900, saving: 300, popular: false },
  { months: 12, label: '1 año', price: 1600, saving: 800, popular: false },
];

const WA_NUMBER = '5354123456';

type PanelType = 'perfil' | 'tienda' | 'metricas' | 'notificaciones' | 'ajustes';

export default function DashboardClient({ profile, email, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [activePanel, setActivePanel] = useState<PanelType>('perfil');
  const [modalPlan, setModalPlan] = useState<typeof PLANS[0] | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(profile.subscription_status);

  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const now = new Date();
  const subEnd = profile.subscription_end ? new Date(profile.subscription_end) : null;
  const isPending = subscriptionStatus === 'pending';
  const isExpired = subscriptionStatus === 'active' && subEnd ? subEnd < now : false;
  const isActive = subscriptionStatus === 'active' && !isExpired;

  const statusLabel = isExpired ? 'Vencida' : {
    inactive: 'Inactiva',
    pending: 'Pendiente',
    active: 'Activa',
    suspended: 'Suspendida',
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

  const buildWhatsAppMessage = (plan: typeof PLANS[0]) => {
    const date = new Date().toLocaleDateString('es-CU');
    return (
      `*Solicitud de suscripción LoTengo*\n\n` +
      `ID de usuario: ${userId}\n` +
      `Usuario: @${profile.username}\n` +
      `Plan: ${plan.label}\n` +
      `Precio: ${plan.price} CUP\n` +
      `Fecha: ${date}`
    );
  };

  const handleSendWhatsApp = async () => {
    if (!modalPlan) return;
    const msg = buildWhatsAppMessage(modalPlan);
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    await supabase.from('profiles').update({ subscription_status: 'pending' }).eq('id', userId);
    setSubscriptionStatus('pending');
    setModalPlan(null);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveMsg('');
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', userId);
    setSaving(false);
    setSaveMsg(error ? 'Error al guardar' : '¡Guardado!');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const navItems = [
    { key: 'perfil' as PanelType, label: 'Mi perfil', icon: <User size={16} />, locked: false },
    { key: 'tienda' as PanelType, label: 'Crear tienda', icon: <Store size={16} />, locked: !isActive },
    { key: 'metricas' as PanelType, label: 'Métricas', icon: <BarChart2 size={16} />, locked: !isActive },
    { key: 'notificaciones' as PanelType, label: 'Notificaciones', icon: <Bell size={16} />, locked: !isActive },
    { key: 'ajustes' as PanelType, label: 'Ajustes', icon: <Settings size={16} />, locked: false },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>

      {/* Sidebar */}
      <aside
        className="w-56 flex flex-col fixed top-0 left-0 h-full z-40"
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <Link href="/" className="logo" style={{ fontSize: '1.1rem' }}>
            <Image src="/images/logo.png" alt="LoTengo" width={26} height={26} />
            LoTengo
          </Link>
        </div>

        {/* Avatar */}
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
              <span
                className="badge text-xs mt-0.5 inline-flex"
                style={statusStyle}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => !item.locked && setActivePanel(item.key)}
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

        {/* Logout */}
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
      </aside>

      {/* Contenido */}
      <main className="flex-1 ml-56 p-8">

        {/* Panel: Mi perfil */}
        {activePanel === 'perfil' && (
          <div className="max-w-2xl">
            <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Mi perfil
            </h1>

            {/* Info card */}
            <div className="card mb-5">
              <h2 className="text-sm font-semibold mb-4 pb-3" style={{
                color: 'var(--text-secondary)',
                borderBottom: '1px solid var(--border)',
              }}>
                Información de cuenta
              </h2>
              {[
                { label: 'Usuario', value: `@${profile.username}` },
                { label: 'Nombre', value: profile.full_name },
                { label: 'Correo', value: email },
                { label: 'Teléfono', value: profile.phone || '—' },
                { label: 'Miembro desde', value: new Date(profile.created_at).toLocaleDateString('es-CU') },
                { label: 'Suscripción', value: statusLabel, highlight: true },
                {
                  label: 'Inicio',
                  value: profile.subscription_start
                    ? new Date(profile.subscription_start).toLocaleDateString('es-CU')
                    : '—',
                },
                {
                  label: 'Vence',
                  value: subEnd ? subEnd.toLocaleDateString('es-CU') : '—',
                  expired: isExpired,
                },
              ].map(row => (
                <div
                  key={row.label}
                  className="flex justify-between items-center py-2.5 text-sm"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  <span
                    style={{
                      color: row.highlight
                        ? isExpired ? 'var(--error)' : isActive ? 'var(--success)' : 'var(--text-muted)'
                        : row.expired ? 'var(--error)' : 'var(--text-primary)',
                      fontWeight: 500,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Provincias */}
            <div className="card mb-5">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <MapPin size={14} />
                Provincias donde vendes
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.seller_provinces?.map(sp => (
                  <span
                    key={sp.province_id}
                    className="badge"
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary-muted)',
                    }}
                  >
                    {sp.provinces?.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Aviso pendiente */}
            {isPending && (
              <div
                className="flex items-start gap-3 p-4 rounded-xl mb-5 text-sm"
                style={{ background: '#fefce8', border: '1px solid #fef08a', color: '#854d0e' }}
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Solicitud enviada</p>
                  <p>Un administrador revisará tu solicitud y activará tu cuenta pronto.</p>
                </div>
              </div>
            )}

            {/* Vencida */}
            {isExpired && (
              <div
                className="flex items-start gap-3 p-4 rounded-xl mb-5 text-sm"
                style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--error)' }}
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Suscripción vencida</p>
                  <p>Tu suscripción venció el {subEnd?.toLocaleDateString('es-CU')}. Renueva tu plan.</p>
                </div>
              </div>
            )}

            {/* Planes */}
            {(!isActive || isExpired) && !isPending && (
              <>
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Planes de suscripción
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {PLANS.map(plan => (
                    <div
                      key={plan.months}
                      className="card card-hover cursor-pointer relative"
                      style={{
                        border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
                      }}
                      onClick={() => setModalPlan(plan)}
                    >
                      {plan.popular && (
                        <span
                          className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: 'var(--primary)', color: '#fff' }}
                        >
                          Más popular
                        </span>
                      )}
                      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                        {plan.label}
                      </p>
                      <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {plan.price.toLocaleString()}
                      </p>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>CUP</p>
                      {plan.saving && (
                        <p className="text-xs mb-3" style={{ color: 'var(--success)' }}>
                          Ahorro {plan.saving} CUP
                        </p>
                      )}
                      <button className="btn-primary w-full justify-center">
                        Adquirir
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Panel: Bloqueado */}
        {(activePanel === 'tienda' || activePanel === 'metricas' || activePanel === 'notificaciones') && (
          <div className="max-w-sm mx-auto mt-24 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--primary-light)' }}
            >
              <Lock size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Sección bloqueada
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Disponible con suscripción activa. Adquiere un plan desde tu perfil.
            </p>
            <button
              onClick={() => setActivePanel('perfil')}
              className="btn-primary"
            >
              Ver planes
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Panel: Ajustes */}
        {activePanel === 'ajustes' && (
          <div className="max-w-xl">
            <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Ajustes
            </h1>

            <div className="card mb-5">
              <h2
                className="text-sm font-semibold mb-4 pb-3"
                style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
              >
                Datos personales
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="input"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="btn-primary"
                    style={{ opacity: saving ? 0.6 : 1 }}
                  >
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  {saveMsg && (
                    <span
                      className="flex items-center gap-1.5 text-sm"
                      style={{ color: saveMsg.includes('Error') ? 'var(--error)' : 'var(--success)' }}
                    >
                      <CheckCircle size={14} />
                      {saveMsg}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <h2
                className="text-sm font-semibold mb-3"
                style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}
              >
                <span className="flex items-center gap-2">
                  <MapPin size={14} />
                  Provincias donde vendes
                </span>
              </h2>
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.seller_provinces?.map(sp => (
                  <span
                    key={sp.province_id}
                    className="badge"
                    style={{
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      border: '1px solid var(--primary-muted)',
                    }}
                  >
                    {sp.provinces?.name}
                  </span>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                Para modificar las provincias contacta al administrador.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Modal WhatsApp */}
      {modalPlan && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="card w-full max-w-sm" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={18} style={{ color: 'var(--accent)' }} />
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                Confirmar suscripción
              </h3>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Se enviará este mensaje al administrador:
            </p>
            <div
              className="rounded-xl p-4 text-xs leading-relaxed mb-5 whitespace-pre-line font-mono"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              {buildWhatsAppMessage(modalPlan)}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModalPlan(null)} className="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all"
                style={{ background: '#16a34a', color: '#fff' }}
              >
                <Phone size={14} />
                Enviar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}