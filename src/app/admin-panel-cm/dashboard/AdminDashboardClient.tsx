'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Seller {
    id: string;
    username: string;
    full_name: string;
    email: string;
    phone: string;
    subscription_status: 'inactive' | 'pending' | 'active' | 'suspended';
    subscription_start: string | null;
    subscription_end: string | null;
    seller_account: boolean;
}

interface Ad {
    id: number;
    image_url: string;
    description: string;
    target_url: string;
    is_active: boolean;
    order_index: number;
}

interface StoreAdmin {
    id: string;
    name: string;
    is_verified: boolean;
    seller_id: string;
    created_at: string;
    profiles: { username: string } | null;
}

type TabType = 'pending' | 'active' | 'sellers' | 'stores' | 'ads';

export default function AdminDashboardClient({ adminName }: { adminName: string }) {
    const router = useRouter();
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [stores, setStores] = useState<StoreAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [activateModal, setActivateModal] = useState<Seller | null>(null);
    const [deleteModal, setDeleteModal] = useState<Seller | null>(null);
    const [months, setMonths] = useState(1);
    const [ads, setAds] = useState<Ad[]>([]);
    const [adForm, setAdForm] = useState({ image_url: '', description: '', target_url: '', order_index: 0 });
    const [adLoading, setAdLoading] = useState(false);

    const loadAds = async () => {
        const res = await fetch('/api/admin/ads');
        const { data } = await res.json();
        setAds(data || []);
    };

    const loadStores = async () => {
        const res = await fetch('/api/admin/stores');
        const { data } = await res.json();
        setStores(data || []);
    };

    useEffect(() => {
        let cancelled = false;
        const loadAll = async () => {
            const res = await fetch('/api/admin/subscriptions');
            if (cancelled) return;
            if (res.status === 401) { router.push('/admin-panel-cm/login'); return; }
            const { data } = await res.json();
            if (!cancelled) {
                setSellers(data || []);
                await loadAds();
                await loadStores();
                setLoading(false);
            }
        };
        loadAll();
        return () => { cancelled = true; };
    }, [router]);

    const reloadSellers = async () => {
        const res = await fetch('/api/admin/subscriptions');
        const { data } = await res.json();
        setSellers(data || []);
    };

    const handleAction = async (userId: string, action: 'activate' | 'deny' | 'deactivate', m?: number) => {
        setActionLoading(userId + action);
        await fetch('/api/admin/subscriptions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, action, months: m }),
        });
        await reloadSellers();
        setActionLoading(null);
        setActivateModal(null);
    };

    const handleDelete = async (userId: string) => {
        setActionLoading(userId + 'delete');
        await fetch('/api/admin/subscriptions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });
        await reloadSellers();
        setActionLoading(null);
        setDeleteModal(null);
    };

    const handleToggleVerified = async (storeId: string, current: boolean) => {
        setActionLoading(storeId + 'verify');
        await fetch('/api/admin/stores', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId, is_verified: !current }),
        });
        await loadStores();
        setActionLoading(null);
    };

    const handleCreateAd = async () => {
        setAdLoading(true);
        await fetch('/api/admin/ads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adForm),
        });
        setAdForm({ image_url: '', description: '', target_url: '', order_index: 0 });
        await loadAds();
        setAdLoading(false);
    };

    const handleToggleAd = async (id: number, is_active: boolean) => {
        await fetch('/api/admin/ads', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: !is_active }),
        });
        await loadAds();
    };

    const handleDeleteAd = async (id: number) => {
        await fetch('/api/admin/ads', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        await loadAds();
    };

    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/admin-panel-cm/login');
    };

    const pending = sellers.filter(s => s.subscription_status === 'pending');
    const active = sellers.filter(s => s.subscription_status === 'active');
    const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-CU') : '—';
    const copyToClipboard = (text: string) => navigator.clipboard.writeText(text).catch(console.error);

    const tabs: { key: TabType; label: string; count?: number }[] = [
        { key: 'pending', label: 'Pendientes', count: pending.length },
        { key: 'active', label: 'Activas', count: active.length },
        { key: 'sellers', label: 'Vendedores', count: sellers.length },
        { key: 'stores', label: 'Tiendas', count: stores.length },
        { key: 'ads', label: 'Publicidad' },
    ];

    // Estilos reutilizables
    const card = { background: '#111827', border: '1px solid #1f2937', borderRadius: '0.75rem', overflow: 'hidden' as const };
    const th = { padding: '0.75rem 1rem', fontSize: '0.7rem', color: '#6b7280', fontWeight: 500, textAlign: 'left' as const, borderBottom: '1px solid #1f2937', whiteSpace: 'nowrap' as const };
    const td = { padding: '0.875rem 1rem', fontSize: '0.8rem', verticalAlign: 'middle' as const };
    const row = { borderBottom: '1px solid rgba(31,41,55,0.5)' };

    return (
        <div style={{ minHeight: '100vh', background: '#030712', color: '#f9fafb' }}>

            {/* Topbar */}
            <header style={{ background: '#111827', borderBottom: '1px solid #1f2937', padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '2rem', height: '2rem', background: '#dc2626', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, color: '#fff' }}>Admin</p>
                        <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>{adminName}</p>
                    </div>
                </div>
                <button onClick={handleLogout} style={{ fontSize: '0.75rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10 8H2M6 5l-3 3 3 3M10 3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3" />
                    </svg>
                    Salir
                </button>
            </header>

            <main style={{ maxWidth: '64rem', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {[
                        { label: 'Pendientes', value: pending.length, color: '#facc15' },
                        { label: 'Activas', value: active.length, color: '#4ade80' },
                        { label: 'Vendedores', value: sellers.length, color: '#60a5fa' },
                    ].map(stat => (
                        <div key={stat.label} style={{ ...card, padding: '1rem' }}>
                            <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '0 0 0.25rem' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs - scroll horizontal en móvil */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                flexShrink: 0,
                                padding: '0.5rem 0.875rem',
                                borderRadius: '0.5rem',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                border: activeTab === tab.key ? 'none' : '1px solid #1f2937',
                                background: activeTab === tab.key ? '#dc2626' : '#111827',
                                color: activeTab === tab.key ? '#fff' : '#9ca3af',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563' }}>Cargando...</div>
                ) : (
                    <>
                        {/* ── Pendientes ── */}
                        {activeTab === 'pending' && (
                            <div style={card}>
                                {pending.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#4b5563' }}>No hay solicitudes pendientes</div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                            <thead>
                                                <tr>
                                                    <th style={th}>Usuario</th>
                                                    <th style={{ ...th, display: 'none' }} className="hide-mobile">Correo</th>
                                                    <th style={th}>ID</th>
                                                    <th style={{ ...th, textAlign: 'right' }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pending.map(seller => (
                                                    <tr key={seller.id} style={row}>
                                                        <td style={td}>
                                                            <p style={{ fontWeight: 600, color: '#fff', margin: '0 0 0.1rem' }}>@{seller.username}</p>
                                                            <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: 0 }}>{seller.full_name}</p>
                                                            <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '0.1rem 0 0' }}>{seller.email}</p>
                                                        </td>
                                                        <td style={td}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                                <span style={{ fontSize: '0.7rem', color: '#6b7280', fontFamily: 'monospace' }}>
                                                                    {seller.id.split('-')[0]}...
                                                                </span>
                                                                <button onClick={() => copyToClipboard(seller.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: 0 }} title="Copiar ID">
                                                                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                        <rect x="5" y="5" width="9" height="9" rx="1" />
                                                                        <path d="M3 11H2a1 1 0 01-1-1V2a1 1 0 011-1h8a1 1 0 011 1v1" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td style={{ ...td, textAlign: 'right' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem', flexWrap: 'wrap' }}>
                                                                <button
                                                                    onClick={() => handleAction(seller.id, 'deny')}
                                                                    disabled={actionLoading === seller.id + 'deny'}
                                                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.5rem', border: '1px solid #7f1d1d', color: '#f87171', background: 'none', cursor: 'pointer' }}
                                                                >
                                                                    Denegar
                                                                </button>
                                                                <button
                                                                    onClick={() => setActivateModal(seller)}
                                                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.5rem', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer' }}
                                                                >
                                                                    Activar
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Activas ── */}
                        {activeTab === 'active' && (
                            <div style={card}>
                                {active.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#4b5563' }}>No hay suscripciones activas</div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                            <thead>
                                                <tr>
                                                    <th style={th}>Usuario</th>
                                                    <th style={th}>Inicio</th>
                                                    <th style={th}>Vence</th>
                                                    <th style={{ ...th, textAlign: 'right' }}>Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {active.map(seller => {
                                                    const expired = seller.subscription_end ? new Date(seller.subscription_end) < new Date() : false;
                                                    return (
                                                        <tr key={seller.id} style={row}>
                                                            <td style={td}>
                                                                <p style={{ fontWeight: 600, color: '#fff', margin: '0 0 0.1rem' }}>@{seller.username}</p>
                                                                <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: 0 }}>{seller.email}</p>
                                                            </td>
                                                            <td style={{ ...td, color: '#9ca3af', fontSize: '0.75rem' }}>{formatDate(seller.subscription_start)}</td>
                                                            <td style={td}>
                                                                <span style={{ fontSize: '0.75rem', color: expired ? '#f87171' : '#4ade80' }}>
                                                                    {formatDate(seller.subscription_end)}{expired && ' ⚠'}
                                                                </span>
                                                            </td>
                                                            <td style={{ ...td, textAlign: 'right' }}>
                                                                <button
                                                                    onClick={() => handleAction(seller.id, 'deactivate')}
                                                                    disabled={actionLoading === seller.id + 'deactivate'}
                                                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.5rem', border: '1px solid #374151', color: '#9ca3af', background: 'none', cursor: 'pointer' }}
                                                                >
                                                                    Desactivar
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Vendedores ── */}
                        {activeTab === 'sellers' && (
                            <div style={card}>
                                {sellers.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#4b5563' }}>No hay vendedores</div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                            <thead>
                                                <tr>
                                                    <th style={th}>Usuario</th>
                                                    <th style={th}>Estado</th>
                                                    <th style={{ ...th, textAlign: 'right' }}>Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sellers.map(seller => (
                                                    <tr key={seller.id} style={row}>
                                                        <td style={td}>
                                                            <p style={{ fontWeight: 600, color: '#fff', margin: '0 0 0.1rem' }}>@{seller.username}</p>
                                                            <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: 0 }}>{seller.email}</p>
                                                        </td>
                                                        <td style={td}>
                                                            <span style={{
                                                                fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px',
                                                                border: '1px solid',
                                                                background: seller.subscription_status === 'active' ? 'rgba(21,128,61,0.2)' : seller.subscription_status === 'pending' ? 'rgba(161,98,7,0.2)' : 'rgba(55,65,81,0.5)',
                                                                color: seller.subscription_status === 'active' ? '#4ade80' : seller.subscription_status === 'pending' ? '#fbbf24' : '#6b7280',
                                                                borderColor: seller.subscription_status === 'active' ? '#166534' : seller.subscription_status === 'pending' ? '#92400e' : '#374151',
                                                            }}>
                                                                {seller.subscription_status === 'active' ? 'Activo' : seller.subscription_status === 'pending' ? 'Pendiente' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                        <td style={{ ...td, textAlign: 'right' }}>
                                                            <button
                                                                onClick={() => setDeleteModal(seller)}
                                                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.5rem', border: '1px solid #7f1d1d', color: '#f87171', background: 'none', cursor: 'pointer' }}
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Tiendas ── */}
                        {activeTab === 'stores' && (
                            <div style={card}>
                                {stores.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#4b5563' }}>No hay tiendas registradas</div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                            <thead>
                                                <tr>
                                                    <th style={th}>Tienda</th>
                                                    <th style={th}>Vendedor</th>
                                                    <th style={th}>Verificada</th>
                                                    <th style={{ ...th, textAlign: 'right' }}>Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stores.map(store => (
                                                    <tr key={store.id} style={row}>
                                                        <td style={td}>
                                                            <p style={{ fontWeight: 600, color: '#fff', margin: 0 }}>{store.name}</p>
                                                            <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0.1rem 0 0', fontFamily: 'monospace' }}>
                                                                {store.id.split('-')[0]}...
                                                            </p>
                                                        </td>
                                                        <td style={{ ...td, color: '#9ca3af' }}>
                                                            @{store.profiles?.username || '—'}
                                                        </td>
                                                        <td style={td}>
                                                            <span style={{
                                                                fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px',
                                                                border: '1px solid',
                                                                background: store.is_verified ? 'rgba(29,78,216,0.2)' : 'rgba(55,65,81,0.5)',
                                                                color: store.is_verified ? '#60a5fa' : '#6b7280',
                                                                borderColor: store.is_verified ? '#1e40af' : '#374151',
                                                            }}>
                                                                {store.is_verified ? '✓ Verificada' : 'Sin verificar'}
                                                            </span>
                                                        </td>
                                                        <td style={{ ...td, textAlign: 'right' }}>
                                                            <button
                                                                onClick={() => handleToggleVerified(store.id, store.is_verified)}
                                                                disabled={actionLoading === store.id + 'verify'}
                                                                style={{
                                                                    padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.5rem',
                                                                    border: `1px solid ${store.is_verified ? '#374151' : '#1e40af'}`,
                                                                    color: store.is_verified ? '#9ca3af' : '#60a5fa',
                                                                    background: 'none', cursor: 'pointer',
                                                                }}
                                                            >
                                                                {actionLoading === store.id + 'verify' ? '...' : store.is_verified ? 'Quitar verificación' : 'Verificar'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Publicidad ── */}
                        {activeTab === 'ads' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ ...card, padding: '1.25rem' }}>
                                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
                                        Nueva publicidad
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {[
                                            { label: 'URL de imagen', key: 'image_url', placeholder: 'https://...' },
                                            { label: 'Descripción', key: 'description', placeholder: 'Descripción breve' },
                                            { label: 'URL destino', key: 'target_url', placeholder: 'https://...' },
                                        ].map(field => (
                                            <div key={field.key}>
                                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.375rem' }}>
                                                    {field.label}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={adForm[field.key as keyof typeof adForm] as string}
                                                    onChange={e => setAdForm({ ...adForm, [field.key]: e.target.value })}
                                                    placeholder={field.placeholder}
                                                    style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                        ))}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.375rem' }}>Orden</label>
                                            <input
                                                type="number"
                                                value={adForm.order_index}
                                                onChange={e => setAdForm({ ...adForm, order_index: Number(e.target.value) })}
                                                style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleCreateAd}
                                            disabled={adLoading || !adForm.image_url || !adForm.description || !adForm.target_url}
                                            style={{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', opacity: adLoading ? 0.6 : 1 }}
                                        >
                                            {adLoading ? 'Guardando...' : 'Crear anuncio'}
                                        </button>
                                    </div>
                                </div>

                                <div style={card}>
                                    {ads.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: '#4b5563' }}>No hay publicidades</div>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                                <thead>
                                                    <tr>
                                                        <th style={th}>Imagen</th>
                                                        <th style={th}>Descripción</th>
                                                        <th style={th}>Estado</th>
                                                        <th style={{ ...th, textAlign: 'right' }}>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {ads.map(ad => (
                                                        <tr key={ad.id} style={row}>
                                                            <td style={td}>
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img src={ad.image_url} alt="" style={{ width: '3.5rem', height: '2.5rem', objectFit: 'cover', borderRadius: '0.375rem' }} />
                                                            </td>
                                                            <td style={{ ...td, color: '#d1d5db', maxWidth: '12rem' }}>
                                                                <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {ad.description}
                                                                </span>
                                                            </td>
                                                            <td style={td}>
                                                                <span style={{
                                                                    fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px',
                                                                    border: '1px solid',
                                                                    background: ad.is_active ? 'rgba(21,128,61,0.2)' : 'rgba(55,65,81,0.5)',
                                                                    color: ad.is_active ? '#4ade80' : '#6b7280',
                                                                    borderColor: ad.is_active ? '#166534' : '#374151',
                                                                }}>
                                                                    {ad.is_active ? 'Activo' : 'Inactivo'}
                                                                </span>
                                                            </td>
                                                            <td style={{ ...td, textAlign: 'right' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem', flexWrap: 'wrap' }}>
                                                                    <button
                                                                        onClick={() => handleToggleAd(ad.id, ad.is_active)}
                                                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', borderRadius: '0.375rem', border: '1px solid #374151', color: '#9ca3af', background: 'none', cursor: 'pointer' }}
                                                                    >
                                                                        {ad.is_active ? 'Pausar' : 'Activar'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteAd(ad.id)}
                                                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', borderRadius: '0.375rem', border: '1px solid #7f1d1d', color: '#f87171', background: 'none', cursor: 'pointer' }}
                                                                    >
                                                                        Eliminar
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modal activar */}
            {activateModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '20rem' }}>
                        <h3 style={{ fontWeight: 700, color: '#fff', margin: '0 0 0.25rem' }}>Activar suscripción</h3>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0 0 1.25rem' }}>@{activateModal.username} — {activateModal.email}</p>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.375rem' }}>Duración</label>
                        <select
                            value={months}
                            onChange={e => setMonths(Number(e.target.value))}
                            style={{ width: '100%', background: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', padding: '0.625rem 0.75rem', fontSize: '0.8rem', color: '#fff', marginBottom: '1.25rem', outline: 'none' }}
                        >
                            <option value={1}>1 mes</option>
                            <option value={3}>3 meses</option>
                            <option value={6}>6 meses</option>
                            <option value={12}>1 año</option>
                        </select>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setActivateModal(null)} style={{ flex: 1, border: '1px solid #374151', color: '#9ca3af', background: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleAction(activateModal.id, 'activate', months)}
                                disabled={!!actionLoading}
                                style={{ flex: 1, background: '#16a34a', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}
                            >
                                {actionLoading ? 'Activando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal eliminar */}
            {deleteModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '20rem' }}>
                        <h3 style={{ fontWeight: 700, color: '#fff', margin: '0 0 0.25rem' }}>Eliminar vendedor</h3>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0 0 0.75rem' }}>Esta acción es irreversible:</p>
                        <div style={{ background: '#1f2937', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1.25rem' }}>
                            <p style={{ color: '#fff', fontWeight: 600, margin: '0 0 0.1rem', fontSize: '0.85rem' }}>@{deleteModal.username}</p>
                            <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.75rem' }}>{deleteModal.email}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setDeleteModal(null)} style={{ flex: 1, border: '1px solid #374151', color: '#9ca3af', background: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteModal.id)}
                                disabled={!!actionLoading}
                                style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.625rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}
                            >
                                {actionLoading ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}