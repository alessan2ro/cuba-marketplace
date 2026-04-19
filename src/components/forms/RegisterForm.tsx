'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Mail, Lock, User, Phone, ShoppingBag, Store, Check } from 'lucide-react';

const PROVINCES = [
  'Pinar del Río', 'Artemisa', 'La Habana', 'Mayabeque', 'Matanzas',
  'Cienfuegos', 'Villa Clara', 'Sancti Spíritus', 'Ciego de Ávila',
  'Camagüey', 'Las Tunas', 'Holguín', 'Granma', 'Santiago de Cuba', 'Guantánamo'
];

export default function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    full_name: '',
    phone: '',
    role: 'buyer' as 'buyer' | 'seller',
    selectedProvinces: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleProvince = (province: string) => {
    setForm(prev => ({
      ...prev,
      selectedProvinces: prev.selectedProvinces.includes(province)
        ? prev.selectedProvinces.filter(p => p !== province)
        : [...prev.selectedProvinces, province],
    }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.role === 'seller' && form.selectedProvinces.length === 0) {
      setError('Selecciona al menos una provincia');
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError || !data.user) {
      setError(signUpError?.message || 'Error al registrarse');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: form.username,
      full_name: form.full_name,
      phone: form.phone,
      role: form.role,
    });

    if (profileError) {
      setError('El nombre de usuario ya existe');
      setLoading(false);
      return;
    }

    if (form.role === 'seller' && form.selectedProvinces.length > 0) {
      const { data: provincesData } = await supabase
        .from('provinces')
        .select('id, name')
        .in('name', form.selectedProvinces);

      if (provincesData) {
        await supabase.from('seller_provinces').insert(
          provincesData.map(p => ({
            seller_id: data.user!.id,
            province_id: p.id,
          }))
        );
      }
    }

    router.push('/');
    router.refresh();
  };

  const inputWithIcon = (
    icon: React.ReactNode,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    rightElement?: React.ReactNode
  ) => (
    <div className="relative">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: 'var(--text-muted)' }}
      >
        {icon}
      </span>
      <input
        {...props}
        className="input"
        style={{ paddingLeft: '2.25rem', paddingRight: rightElement ? '2.5rem' : undefined }}
      />
      {rightElement && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {rightElement}
        </span>
      )}
    </div>
  );

  return (
    <>
      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: step > s ? 'var(--accent)' : step === s ? 'var(--primary)' : 'var(--surface-2)',
                color: step >= s ? '#fff' : 'var(--text-muted)',
                border: step < s ? '1px solid var(--border)' : 'none',
              }}
            >
              {step > s ? <Check size={12} /> : s}
            </div>
            <span
              className="text-xs font-medium hidden sm:block"
              style={{ color: step === s ? 'var(--text-primary)' : 'var(--text-muted)' }}
            >
              {s === 1 ? 'Cuenta' : 'Perfil'}
            </span>
            {s < 2 && (
              <div
                className="flex-1 h-px"
                style={{ background: step > s ? 'var(--accent)' : 'var(--border)' }}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div
          className="text-sm px-4 py-3 rounded-lg mb-4"
          style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--error)' }}
        >
          {error}
        </div>
      )}

      {/* Paso 1 */}
      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Correo electrónico
            </label>
            {inputWithIcon(
              <Mail size={15} />,
              { type: 'email', name: 'email', value: form.email, onChange: handleChange, required: true, placeholder: 'tu@correo.com' }
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Contraseña
            </label>
            {inputWithIcon(
              <Lock size={15} />,
              {
                type: showPassword ? 'text' : 'password',
                name: 'password',
                value: form.password,
                onChange: handleChange,
                required: true,
                placeholder: 'Mínimo 6 caracteres',
              },
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: 'var(--text-muted)' }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Confirmar contraseña
            </label>
            {inputWithIcon(
              <Lock size={15} />,
              {
                type: 'password',
                name: 'confirmPassword',
                value: form.confirmPassword,
                onChange: handleChange,
                required: true,
                placeholder: 'Repite tu contraseña',
              }
            )}
          </div>

          <button type="submit" className="btn-primary w-full justify-center py-3">
            Siguiente →
          </button>
        </form>
      )}

      {/* Paso 2 */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nombre de usuario
            </label>
            {inputWithIcon(
              <User size={15} />,
              { type: 'text', name: 'username', value: form.username, onChange: handleChange, required: true, placeholder: 'ej: juan123' }
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nombre completo
            </label>
            {inputWithIcon(
              <User size={15} />,
              { type: 'text', name: 'full_name', value: form.full_name, onChange: handleChange, required: true, placeholder: 'Tu nombre completo' }
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Teléfono (opcional)
            </label>
            {inputWithIcon(
              <Phone size={15} />,
              { type: 'tel', name: 'phone', value: form.phone, onChange: handleChange, placeholder: '+53 5 000 0000' }
            )}
          </div>

          {/* Rol */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              ¿Cómo usarás LoTengo?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'buyer', label: 'Comprador', icon: <ShoppingBag size={18} /> },
                { value: 'seller', label: 'Vendedor', icon: <Store size={18} /> },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: opt.value as 'buyer' | 'seller' })}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                  style={{
                    border: form.role === opt.value ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    background: form.role === opt.value ? 'var(--primary-light)' : 'var(--surface)',
                    color: form.role === opt.value ? 'var(--primary)' : 'var(--text-secondary)',
                  }}
                >
                  {opt.icon}
                  <span className="text-sm font-semibold">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Provincias */}
          {form.role === 'seller' && (
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                ¿En qué provincias vendes?
              </label>
              <div
                className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1"
                style={{ scrollbarWidth: 'thin' }}
              >
                {PROVINCES.map(province => {
                  const selected = form.selectedProvinces.includes(province);
                  return (
                    <button
                      key={province}
                      type="button"
                      onClick={() => toggleProvince(province)}
                      className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all text-left"
                      style={{
                        border: selected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                        background: selected ? 'var(--accent-light)' : 'var(--surface)',
                        color: selected ? 'var(--accent)' : 'var(--text-secondary)',
                        fontWeight: selected ? 600 : 400,
                      }}
                    >
                      {selected && <Check size={11} />}
                      {province}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary flex-1 justify-center py-3"
            >
              ← Atrás
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center py-3"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </div>
        </form>
      )}
    </>
  );
}