'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error) {
      setError('Correo o contraseña incorrectos');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="text-sm px-4 py-3 rounded-lg"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: 'var(--error)',
          }}
        >
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label
          className="block text-xs font-semibold mb-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          Correo electrónico
        </label>
        <div className="relative">
          <Mail
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="tu@correo.com"
            className="input"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label
          className="block text-xs font-semibold mb-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          Contraseña
        </label>
        <div className="relative">
          <Lock
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className="input"
            style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full justify-center py-3"
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Entrando...' : 'Iniciar sesión'}
      </button>
    </form>
  );
}