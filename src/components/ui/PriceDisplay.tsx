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
    const altFontSize = size === 'lg' ? '0.9rem' : '0.68rem';

    const fmt = (value: number, currency: 'CUP' | 'USD') => {
        const rounded = currency === 'CUP'
            ? Math.round(value)
            : Math.round(value * 100) / 100;
        return currency === 'CUP'
            ? `${rounded.toLocaleString('es-CU')} CUP`
            : `${rounded.toFixed(2)} USD`;
    };

    const mainLabel = fmt(price, currencyType);
    const altCurrency: 'CUP' | 'USD' = currencyType === 'USD' ? 'CUP' : 'USD';
    const altValue = currencyType === 'USD' ? price * usdToCup : price / usdToCup;
    const altLabel = `≈ ${fmt(altValue, altCurrency)}`;

    const mainOriginal = originalPrice ? fmt(originalPrice, currencyType) : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{
                    fontSize,
                    fontWeight: 700,
                    color: hasDiscount ? 'var(--error)' : 'var(--primary)',
                    lineHeight: 1,
                }}>
                    {mainLabel}
                </span>
                {hasDiscount && mainOriginal && (
                    <span style={{
                        fontSize: altFontSize,
                        color: 'var(--text-muted)',
                        textDecoration: 'line-through',
                    }}>
                        {mainOriginal}
                    </span>
                )}
            </div>
            <span style={{ fontSize: altFontSize, color: 'var(--text-muted)' }}>
                {altLabel}
            </span>
        </div>
    );
}