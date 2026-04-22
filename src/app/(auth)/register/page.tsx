import Link from 'next/link';
import RegisterForm from '@/components/forms/RegisterForm';
import Image from 'next/image';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>

      {/* Panel izquierdo */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: 'var(--primary)' }}
      >
        <Link href="/" className="logo" style={{ color: '#fff' }}>
          <Image src="/images/logo.png" alt="Mercacentro" width={32} height={32} priority />
          Mercacentro
        </Link>

        <div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Empieza a vender<br />hoy mismo
          </h2>
          <p style={{ color: 'var(--primary-muted)' }} className="text-base leading-relaxed">
            Crea tu cuenta gratis, elige tu plan y llega a compradores en toda Cuba.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Publica anuncios con fotos',
              'Vende en múltiples provincias',
              'Contacto directo con compradores',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--accent)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm" style={{ color: 'var(--primary-muted)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm" style={{ color: 'var(--primary-muted)' }}>
          © {new Date().getFullYear()} Mercacentro
        </p>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-sm">

          <div className="lg:hidden mb-8">
            <Link href="/" className="logo">
              <Image src="/images/logo.png" alt="Mercacentro" width={28} height={28} />
              Mercacentro
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Crear cuenta
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Únete gratis a Mercacentro
            </p>
          </div>

          <RegisterForm />

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              Inicia sesión
            </Link>
          </p>

          <p className="text-center mt-3">
            <Link href="/" className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}