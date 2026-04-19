import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <div>
            <h3 className="text-white font-bold text-lg mb-3">LoTengo</h3>
            <p className="text-sm text-gray-400">
              El marketplace de compra y venta dentro de Cuba. Conectamos compradores y vendedores en todo el país.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Navegación</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition">Inicio</Link></li>
              <li><Link href="/search" className="hover:text-white transition">Explorar productos</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Iniciar sesión</Link></li>
              <li><Link href="/register" className="hover:text-white transition">Registrarse</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Provincias</h4>
            <p className="text-sm text-gray-400">
              Disponible en las 15 provincias de Cuba.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} LoTengo. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}