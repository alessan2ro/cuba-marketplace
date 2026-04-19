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

type TabType = 'pending' | 'active' | 'sellers' | 'ads';

export default function AdminDashboardClient({ adminName }: { adminName: string }) {
    const router = useRouter();
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('pending');
    const [activateModal, setActivateModal] = useState<Seller | null>(null);
    const [deleteModal, setDeleteModal] = useState<Seller | null>(null);
    const [months, setMonths] = useState(1);
    const [ads, setAds] = useState<Ad[]>([]);
    const [adForm, setAdForm] = useState({
        image_url: '', description: '', target_url: '', order_index: 0
    });
    const [adLoading, setAdLoading] = useState(false);

    const loadAds = async () => {
        const res = await fetch('/api/admin/ads');
        const { data } = await res.json();
        setAds(data || []);
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

    useEffect(() => {
        let cancelled = false;
        const loadSellers = async () => {
            const res = await fetch('/api/admin/subscriptions');
            if (cancelled) return;
            if (res.status === 401) {
                router.push('/admin-panel-cm/login');
                return;
            }
            const { data } = await res.json();
            if (!cancelled) {
                setSellers(data || []);
                await loadAds();
                setLoading(false);
            }
        };
        loadSellers();
        return () => { cancelled = true; };
    }, [router]);

    const reloadSellers = async () => {
        const res = await fetch('/api/admin/subscriptions');
        const { data } = await res.json();
        setSellers(data || []);
    };

    const handleAction = async (
        userId: string,
        action: 'activate' | 'deny' | 'deactivate',
        m?: number
    ) => {
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

    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/admin-panel-cm/login');
    };

    const pending = sellers.filter(s => s.subscription_status === 'pending');
    const active = sellers.filter(s => s.subscription_status === 'active');

    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString('es-CU') : '—';

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).catch(console.error);
    };

    const tabs: { key: TabType; label: string; count?: number }[] = [
        { key: 'pending', label: 'Pendientes', count: pending.length },
        { key: 'active', label: 'Activas', count: active.length },
        { key: 'sellers', label: 'Vendedores', count: sellers.length },
        { key: 'ads', label: 'Publicidad', count: undefined },
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-white">

            {/* Topbar */}
            <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">CubaMarket Admin</p>
                        <p className="text-xs text-gray-500">{adminName}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-xs text-gray-400 hover:text-red-400 transition flex items-center gap-1.5"
                >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M10 8H2M6 5l-3 3 3 3M10 3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3" />
                    </svg>
                    Salir
                </button>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Pendientes', value: pending.length, color: 'text-yellow-400' },
                        { label: 'Activas', value: active.length, color: 'text-green-400' },
                        { label: 'Total vendedores', value: sellers.length, color: 'text-blue-400' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.key
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                                }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-600">Cargando...</div>
                ) : (
                    <>
                        {/* Pendientes */}
                        {activeTab === 'pending' && (
                            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                                {pending.length === 0 ? (
                                    <div className="text-center py-16 text-gray-600">No hay solicitudes pendientes</div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Usuario</th>
                                                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Correo</th>
                                                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">ID</th>
                                                <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pending.map(seller => (
                                                <tr key={seller.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-white">@{seller.username}</p>
                                                        <p className="text-xs text-gray-500">{seller.full_name}</p>
                                                    </td>
                                                    <td className="px-5 py-4 text-gray-300">{seller.email}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500 font-mono">
                                                                {seller.id.split('-')[0]}...
                                                            </span>
                                                            <button
                                                                onClick={() => copyToClipboard(seller.id)}
                                                                className="text-gray-600 hover:text-gray-300 transition"
                                                                title="Copiar ID completo"
                                                            >
                                                                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                    <rect x="5" y="5" width="9" height="9" rx="1" />
                                                                    <path d="M3 11H2a1 1 0 01-1-1V2a1 1 0 011-1h8a1 1 0 011 1v1" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleAction(seller.id, 'deny')}
                                                                disabled={actionLoading === seller.id + 'deny'}
                                                                className="px-3 py-1.5 text-xs rounded-lg border border-red-800 text-red-400 hover:bg-red-950 transition disabled:opacity-50"
                                                            >
                                                                Denegar
                                                            </button>
                                                            <button
                                                                onClick={() => setActivateModal(seller)}
                                                                className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                                                            >
                                                                Activar
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* Activas */}
                        {activeTab === 'active' && (
                            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                                {active.length === 0 ? (
                                    <div className="text-center py-16 text-gray-600">No hay suscripciones activas</div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Usuario</th>
                                                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Correo</th>
                                                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Inicio</th>
                                                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Vence</th>
                                                <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {active.map(seller => {
                                                const isExpired = seller.subscription_end
                                                    ? new Date(seller.subscription_end) < new Date()
                                                    : false;
                                                return (
                                                    <tr key={seller.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                                                        <td className="px-5 py-4">
                                                            <p className="font-medium text-white">@{seller.username}</p>
                                                            <p className="text-xs text-gray-500">{seller.full_name}</p>
                                                        </td>
                                                        <td className="px-5 py-4 text-gray-300">{seller.email}</td>
                                                        <td className="px-5 py-4 text-gray-400 text-xs">{formatDate(seller.subscription_start)}</td>
                                                        <td className="px-5 py-4">
                                                            <span className={`text-xs ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                                                                {formatDate(seller.subscription_end)}
                                                                {isExpired && ' (vencida)'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <button
                                                                onClick={() => handleAction(seller.id, 'deactivate')}
                                                                disabled={actionLoading === seller.id + 'deactivate'}
                                                                className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-400 hover:border-red-700 hover:text-red-400 transition disabled:opacity-50"
                                                            >
                                                                Desactivar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* Todos los vendedores */}
                        {activeTab === 'sellers' && (
                            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                                {sellers.length === 0 ? (
                                    <div className="text-center py-16 text-gray-600">No hay vendedores registrados</div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-800">
                                                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Usuario</th>
                                                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Nombre</th>
                                                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Correo</th>
                                                <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Estado</th>
                                                <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sellers.map(seller => (
                                                <tr key={seller.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                                                    <td className="px-5 py-4 font-medium text-white">@{seller.username}</td>
                                                    <td className="px-5 py-4 text-gray-300">{seller.full_name}</td>
                                                    <td className="px-5 py-4 text-gray-400">{seller.email}</td>
                                                    <td className="px-5 py-4">
                                                        <span className={`text-xs px-2 py-1 rounded-full border ${seller.subscription_status === 'active'
                                                            ? 'bg-green-950 text-green-400 border-green-800'
                                                            : seller.subscription_status === 'pending'
                                                                ? 'bg-yellow-950 text-yellow-400 border-yellow-800'
                                                                : 'bg-gray-800 text-gray-500 border-gray-700'
                                                            }`}>
                                                            {seller.subscription_status === 'active' ? 'Activo'
                                                                : seller.subscription_status === 'pending' ? 'Pendiente'
                                                                    : 'Inactivo'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <button
                                                            onClick={() => setDeleteModal(seller)}
                                                            className="px-3 py-1.5 text-xs rounded-lg border border-red-900 text-red-500 hover:bg-red-950 transition"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </>
                )}



                {/* Publicidad */}
                {activeTab === 'ads' && (
                    <div className="space-y-6">

                        {/* Formulario crear */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                            <h3 className="text-sm font-semibold text-white mb-4">Nueva publicidad</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">URL de imagen</label>
                                    <input
                                        type="text"
                                        value={adForm.image_url}
                                        onChange={e => setAdForm({ ...adForm, image_url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Descripción</label>
                                    <input
                                        type="text"
                                        value={adForm.description}
                                        onChange={e => setAdForm({ ...adForm, description: e.target.value })}
                                        placeholder="Descripción breve del anuncio"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">URL destino</label>
                                    <input
                                        type="text"
                                        value={adForm.target_url}
                                        onChange={e => setAdForm({ ...adForm, target_url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Orden</label>
                                    <input
                                        type="number"
                                        value={adForm.order_index}
                                        onChange={e => setAdForm({ ...adForm, order_index: Number(e.target.value) })}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateAd}
                                    disabled={adLoading || !adForm.image_url || !adForm.description || !adForm.target_url}
                                    className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    {adLoading ? 'Guardando...' : 'Crear anuncio'}
                                </button>
                            </div>
                        </div>

                        {/* Lista de ads */}
                        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                            {ads.length === 0 ? (
                                <div className="text-center py-12 text-gray-600">No hay publicidades creadas</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-800">
                                            <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Imagen</th>
                                            <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Descripción</th>
                                            <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Estado</th>
                                            <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ads.map(ad => (
                                            <tr key={ad.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                                                <td className="px-5 py-3">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={ad.image_url} alt="" className="w-16 h-10 object-cover rounded-lg" />
                                                </td>
                                                <td className="px-5 py-3 text-gray-300 max-w-xs truncate">{ad.description}</td>
                                                <td className="px-5 py-3">
                                                    <span className={`text-xs px-2 py-1 rounded-full border ${ad.is_active
                                                        ? 'bg-green-950 text-green-400 border-green-800'
                                                        : 'bg-gray-800 text-gray-500 border-gray-700'
                                                        }`}>
                                                        {ad.is_active ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleToggleAd(ad.id, ad.is_active)}
                                                            className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-400 hover:text-white transition"
                                                        >
                                                            {ad.is_active ? 'Pausar' : 'Activar'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAd(ad.id)}
                                                            className="px-3 py-1.5 text-xs rounded-lg border border-red-900 text-red-500 hover:bg-red-950 transition"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal activar */}
            {activateModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-white mb-1">Activar suscripción</h3>
                        <p className="text-sm text-gray-400 mb-5">
                            @{activateModal.username} — {activateModal.email}
                        </p>
                        <label className="block text-xs text-gray-400 mb-2">Duración</label>
                        <select
                            value={months}
                            onChange={e => setMonths(Number(e.target.value))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 mb-5"
                        >
                            <option value={1}>1 mes</option>
                            <option value={3}>3 meses</option>
                            <option value={6}>6 meses</option>
                            <option value={12}>1 año</option>
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActivateModal(null)}
                                className="flex-1 border border-gray-700 text-gray-400 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleAction(activateModal.id, 'activate', months)}
                                disabled={!!actionLoading}
                                className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                            >
                                {actionLoading ? 'Activando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal eliminar */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="font-bold text-white mb-1">Eliminar vendedor</h3>
                        <p className="text-sm text-gray-400 mb-2">
                            Esta acción es irreversible. Se eliminarán todos los datos de:
                        </p>
                        <div className="bg-gray-800 rounded-lg p-3 mb-5 text-sm">
                            <p className="text-white font-medium">@{deleteModal.username}</p>
                            <p className="text-gray-400">{deleteModal.email}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="flex-1 border border-gray-700 text-gray-400 py-2.5 rounded-lg text-sm hover:bg-gray-800 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDelete(deleteModal.id)}
                                disabled={!!actionLoading}
                                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {actionLoading ? 'Eliminando...' : 'Eliminar cuenta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}