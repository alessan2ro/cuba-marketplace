'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Store, StoreProduct } from '@/types';
const supabase = createClient();
import SearchBar from './SearchBar';

import {
  Plus, User, Package, Heart,
  LogOut, Menu, X, ShoppingBag,
  ChevronDown, LogIn
} from 'lucide-react';

interface UserProfile {
  username: string;
  role: 'buyer' | 'seller';
}

interface Props {
  store: Store;
  initialProducts: StoreProduct[];
  userId: string;
}

export default function Navbar({ store}: Props) {
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();


  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, role')
          .eq('id', data.user.id)
          .single();
        setUser(profile ?? null);
      } else {
        setUser(null);
      }
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDropdownOpen(false);
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
    }} className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">

        {/* Fila principal */}
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="logo">
            <Image
              src="/images/logo.png"
              alt="Mercacentro"
              width={32}
              height={32}
              priority
            />
            Mercacentro
          </Link>

          {/* SearchBar escritorio */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchBar />
          </div>

          {/* Acciones escritorio */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {user.role === 'seller' && (
                  <Link
                    href={`/seller/store/${store.id}/products/new`}
                    className="btn-primary"
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    <Plus size={15} />
                    Publicar
                  </Link>
                )}

                {/* Dropdown usuario */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: 'var(--primary)' }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{user.username}</span>
                    <ChevronDown
                      size={14}
                      style={{
                        color: 'var(--text-muted)',
                        transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 rounded-xl py-1 z-50"
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      {/* Header dropdown */}
                      <div
                        className="px-4 py-3"
                        style={{ borderBottom: '1px solid var(--border)' }}
                      >
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Conectado como
                        </p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {user.username}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {user.role === 'seller'
                            ? <Plus size={11} style={{ color: 'var(--accent)' }} />
                            : <LogIn size={11} style={{ color: 'var(--accent)' }} />
                          }
                          <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                            {user.role === 'seller' ? 'Vendedor' : 'Comprador'}
                          </p>
                        </div>
                      </div>

                      {/* Links */}
                      {[
                        {
                          href: user.role === 'seller' ? '/dashboard' : '/profile',
                          icon: <User size={14} />,
                          label: 'Mi perfil',
                        },
                        ...(user.role === 'seller' ? [{
                          href: '/dashboard',
                          icon: <Package size={14} />,
                          label: 'Mis anuncios',
                        }] : []),
                        {
                          href: '/favorites',
                          icon: <Heart size={14} />,
                          label: 'Favoritos',
                        },
                      ].map(item => (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'var(--primary-light)';
                            (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                          }}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ))}

                      {/* Logout */}
                      <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.25rem' }}>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors"
                          style={{ color: 'var(--error)' }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = '#fef2f2';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }}
                        >
                          <LogOut size={14} />
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  Iniciar sesión
                </Link>
                <Link href="/register" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Botón menú móvil */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)', background: 'var(--surface-2)' }}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* SearchBar móvil */}
        <div className="mt-3 md:hidden">
          <SearchBar />
        </div>

        {/* Menú móvil */}
        {menuOpen && (
          <div
            className="md:hidden mt-3 pt-3 flex flex-col gap-1"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            {user ? (
              <>
                <div
                  className="flex items-center gap-3 px-2 py-3 rounded-lg mb-1"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: 'var(--primary)' }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {user.username}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--accent)' }}>
                      {user.role === 'seller' ? 'Vendedor' : 'Comprador'}
                    </p>
                  </div>
                </div>

                {user.role === 'seller' && (
                  <Link
                    href={`/seller/store/${store.id}/products/new`}
                    className="btn-primary justify-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Plus size={15} />
                    Publicar anuncio
                  </Link>
                )}

                {[
                  { href: user.role === 'seller' ? '/dashboard' : '/profile', icon: <User size={15} />, label: 'Mi perfil' },
                  { href: '/favorites', icon: <Heart size={15} />, label: 'Favoritos' },
                ].map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="nav-link"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}

                <button
                  onClick={handleLogout}
                  className="nav-link w-full text-left mt-1"
                  style={{ color: 'var(--error)' }}
                >
                  <LogOut size={15} />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                  <User size={15} />
                  Iniciar sesión
                </Link>
                <Link href="/register" className="btn-primary justify-center mt-1" onClick={() => setMenuOpen(false)}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}