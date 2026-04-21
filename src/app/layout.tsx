import type { Metadata } from 'next';
// @ts-ignore: side-effect CSS import type declarations
import './globals.css';

export const metadata: Metadata = {
  title: 'LoTengo - Compra y Vende en Cuba',
  description: 'El marketplace de compra y venta dentro de Cuba.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}