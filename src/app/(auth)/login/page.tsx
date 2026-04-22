import Link from 'next/link';
import LoginForm from '@/components/forms/LoginForm';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>

      {/* Panel izquierdo - decorativo */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: 'var(--primary)' }}
      >
        <Link href="/" className="logo" style={{ color: '#fff' }}>
          <Image src="/images/logo.png" alt="LoTengo" width={32} height={32} priority />
          Mercacentro
        </Link>

        <div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Compra y vende<br />en toda Cuba
          </h2>
          <p style={{ color: 'var(--primary-muted)' }} className="text-base leading-relaxed">
            Miles de productos disponibles en las 16 provincias del país. Encuentra lo que necesitas o publica lo que tienes.
          </p>
        </div>

        <p className="text-sm" style={{ color: 'var(--primary-muted)' }}>
          © {new Date().getFullYear()} Mercacentro
        </p>
      </div>

      {/* Panel derecho - formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Logo móvil */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="logo">
              <Image src="/images/logo.png" alt="Mercacentro" width={28} height={28} />
              Mercacentro
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Bienvenido de vuelta
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Inicia sesión para continuar
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <Link
              href="/register"
              className="font-semibold transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              Regístrate gratis
            </Link>
          </p>

          <p className="text-center mt-3">
            <Link
              href="/"
              className="text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              ← Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}