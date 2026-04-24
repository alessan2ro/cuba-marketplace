'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SearchBar from './SearchBar';
import {
  Plus, User, Package, Heart,
  LogOut, Menu, X, Store, ShoppingBag,
  ChevronDown
} from 'lucide-react';

const supabase = createClient();

interface UserProfile {
  username: string;
  role: 'buyer' | 'seller';
}

export default function Navbar() {
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
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0.75rem 1rem' }}>

        {/* Fila principal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

          {/* Logo */}
          <Link href="/" className="logo" style={{ fontSize: '1.25rem' }}>
            <Image src="/images/logo.png" alt="Mercacentro" width={30} height={30} priority />
            Mercacentro
          </Link>

          {/* SearchBar escritorio */}
          <div style={{ flex: 1, maxWidth: '36rem', display: 'none' }} className="desktop-search">
            <style>{`.desktop-search { display: none; } @media(min-width: 768px){ .desktop-search { display: block !important; } }`}</style>
            <SearchBar />
          </div>

          {/* Acciones escritorio */}
          <div className="desktop-nav" style={{ display: 'none', alignItems: 'center', gap: '0.75rem' }}>
            <style>{`.desktop-nav { display: none; } @media(min-width: 768px){ .desktop-nav { display: flex !important; } }`}</style>

            {user ? (
              <>
                {user.role === 'seller' && (
                  <Link href="/seller/store" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    <Plus size={15} /> Publicar
                  </Link>
                )}

                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)',
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      cursor: 'pointer', color: 'var(--text-primary)',
                    }}
                  >
                    <div style={{
                      width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                      background: 'var(--primary)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.username}</span>
                    <ChevronDown size={14} style={{
                      color: 'var(--text-muted)',
                      transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                    }} />
                  </button>

                  {dropdownOpen && (
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 0.5rem)',
                      width: '13rem', background: 'var(--surface)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)', zIndex: 50, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Conectado como</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0.1rem 0 0' }}>
                          {user.username}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                          {user.role === 'seller'
                            ? <Store size={11} style={{ color: 'var(--accent)' }} />
                            : <ShoppingBag size={11} style={{ color: 'var(--accent)' }} />
                          }
                          <p style={{ fontSize: '0.7rem', color: 'var(--accent)', margin: 0, fontWeight: 500 }}>
                            {user.role === 'seller' ? 'Vendedor' : 'Comprador'}
                          </p>
                        </div>
                      </div>

                      {[
                        { href: user.role === 'seller' ? '/dashboard' : '/profile', icon: <User size={14} />, label: 'Mi perfil' },
                        { href: '/favorites', icon: <Heart size={14} />, label: 'Favoritos' },
                        ...(user.role === 'seller' ? [{ href: '/dashboard', icon: <Package size={14} />, label: 'Mis anuncios' }] : []),
                      ].map(item => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setDropdownOpen(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.625rem',
                            padding: '0.625rem 1rem', fontSize: '0.85rem',
                            color: 'var(--text-secondary)', textDecoration: 'none',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'var(--primary-light)';
                            (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                          }}
                        >
                          {item.icon} {item.label}
                        </Link>
                      ))}

                      <div style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                          onClick={handleLogout}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.625rem',
                            width: '100%', padding: '0.625rem 1rem',
                            fontSize: '0.85rem', color: 'var(--error)',
                            background: 'none', border: 'none', cursor: 'pointer',
                            textAlign: 'left',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <LogOut size={14} /> Cerrar sesión
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
                  style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Iniciar sesión
                </Link>
                <Link href="/register" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Botón menú móvil */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <style>{`.mobile-menu-btn { display: flex; } @media(min-width: 768px){ .mobile-menu-btn { display: none !important; } }`}</style>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* SearchBar móvil */}
        <div className="mobile-search" style={{ marginTop: '0.75rem' }}>
          <style>{`.mobile-search { display: block; } @media(min-width: 768px){ .mobile-search { display: none !important; } }`}</style>
          <SearchBar />
        </div>

        {/* Menú móvil */}
        {menuOpen && (
          <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--surface-2)', marginBottom: '0.5rem' }}>
                  <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{user.username}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--accent)', margin: 0 }}>
                      {user.role === 'seller' ? 'Vendedor' : 'Comprador'}
                    </p>
                  </div>
                </div>

                {user.role === 'seller' && (
                  <Link href="/seller/store" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    <Plus size={15} /> Publicar
                  </Link>
                )}

                {[
                  { href: user.role === 'seller' ? '/dashboard' : '/profile', icon: <User size={15} />, label: 'Mi perfil' },
                  { href: '/favorites', icon: <Heart size={15} />, label: 'Favoritos' },
                ].map(item => (
                  <Link key={item.label} href={item.href} className="nav-link" onClick={() => setMenuOpen(false)}>
                    {item.icon} {item.label}
                  </Link>
                ))}

                <button onClick={handleLogout} className="nav-link" style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', marginTop: '0.25rem' }}>
                  <LogOut size={15} /> Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                  <User size={15} /> Iniciar sesión
                </Link>
                <Link href="/register" className="btn-primary" style={{ justifyContent: 'center', marginTop: '0.25rem' }} onClick={() => setMenuOpen(false)}>
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