'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/');
    }
  }, [query, router]);

  return (
    <form onSubmit={handleSearch} className="flex w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="¿Qué estás buscando?"
        className="input"
        style={{ borderRadius: 'var(--radius) 0 0 var(--radius)', borderRight: 'none' }}
      />
      <button
        type="submit"
        style={{
          background: 'var(--primary)',
          color: '#fff',
          padding: '0 1.25rem',
          borderRadius: '0 var(--radius) var(--radius) 0',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
      </button>
    </form>
  );
}