'use client';

interface Props {
    price: number;
    currencyType?: 'CUP' | 'USD';
    usdToCup: number;
    size?: 'sm' | 'md' | 'lg';
    hasDiscount?: boolean;
    originalPrice?: number | null;
}

export default function PriceDisplay({
    price,
    currencyType = 'CUP',
    usdToCup,
    size = 'md',
    hasDiscount = false,
    originalPrice,
}: Props) {
    const fontSize = size === 'lg' ? '2rem' : size === 'md' ? '1rem' : '0.875rem';
    const altFontSize = size === 'lg' ? '1rem' : '0.72rem';

    const formatCUP = (v: number) =>
        new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP', minimumFractionDigits: 0 }).format(v);

    const formatUSD = (v: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

    // Precio principal (el que puso el vendedor)
    const mainLabel = currencyType === 'USD' ? formatUSD(price) : formatCUP(price);

    // Precio alternativo (conversión)
    const altPrice = currencyType === 'USD'
        ? formatCUP(price * usdToCup)
        : formatUSD(price / usdToCup);
    const altLabel = currencyType === 'USD'
        ? `≈ ${formatCUP(price * usdToCup)}`
        : `≈ ${formatUSD(price / usdToCup)}`;

    // Original con descuento
    const mainOriginal = originalPrice
        ? currencyType === 'USD' ? formatUSD(originalPrice) : formatCUP(originalPrice)
        : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            {/* Precio principal */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                    fontSize,
                    fontWeight: 700,
                    color: hasDiscount ? 'var(--error)' : 'var(--primary)',
                    lineHeight: 1,
                }}>
                    {mainLabel}
                </span>
                {hasDiscount && mainOriginal && (
                    <span style={{ fontSize: altFontSize, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {mainOriginal}
                    </span>
                )}
                {/* Badge moneda */}
                <span style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    background: currencyType === 'USD' ? '#eff6ff' : 'var(--primary-light)',
                    color: currencyType === 'USD' ? '#1d4ed8' : 'var(--primary)',
                    border: `1px solid ${currencyType === 'USD' ? '#bfdbfe' : 'var(--primary-muted)'}`,
                    alignSelf: 'center',
                }}>
                    {currencyType}
                </span>
            </div>

            {/* Precio alternativo */}
            <span style={{
                fontSize: altFontSize,
                color: 'var(--text-muted)',
                fontWeight: 400,
            }}>
                {altLabel}
            </span>
        </div>
    );
}