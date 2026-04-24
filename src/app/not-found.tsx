import Link from 'next/link'


export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--background)',
            padding: '2rem 1rem',
            textAlign: 'center',
        }}>

            {/* Codigo de error */}
            <p style={{
                fontSize: '5rem',
                fontWeight: 800,
                color: 'var(--primary)',
                lineHeight: 1,
                margin: '0 0 0.5rem',
                letterSpacing: '-0.05em',
            }}> 404 </p>

            {/*Titulo*/}
            <h1 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 0.75rem',
            }}> ¡Ups! Esto no existe </h1>


            {/*Descripcion */}
            <p style={{
                fontSize: '0.95rem',
                color: 'var(--text-muted)',
                minWidth: '22rem',
                lineHeight: '1.6',
                margin: '0 0 2rem',
            }}>La página que buscas no existe o fue eliminada. Puede que hayas escrito mal la dirección.</p>

        </div>
    );
}