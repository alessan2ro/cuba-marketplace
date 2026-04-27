'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft, Plus, Trash2, Upload, X,
  Tag, Percent, Package
} from 'lucide-react';

interface Spec {
  tag: string;
  value: string;
}

interface ImagePreview {
  file: File;
  preview: string;
  uploading: boolean;
  url?: string;
  fileId?: string;
  error?: string;
}

interface Props {
  storeId: string;
  storeName: string;
  userId: string;
  initialData?: {
    id: string;
    name: string;
    description: string;
    category: string;
    quantity: number;
    price: number;
    has_discount: boolean;
    original_price: number | null;
    currency_type?: 'CUP' | 'USD';
    specifications: Spec[];
    images: { url: string; fileId: string; isMain: boolean }[];
  };
}

const MAX_BYTES = 1 * 1024 * 1024;

export default function ProductFormClient({ storeId, storeName, userId, initialData }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
  const [price, setPrice] = useState(initialData?.price || 0);
  const [hasDiscount, setHasDiscount] = useState(initialData?.has_discount || false);
  const [originalPrice, setOriginalPrice] = useState(initialData?.original_price || 0);
  const [currencyType, setCurrencyType] = useState<'CUP' | 'USD'>(initialData?.currency_type || 'CUP');
  const [specs, setSpecs] = useState<Spec[]>(initialData?.specifications || []);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState('');

  const formatPrice = (p: number) =>
    currencyType === 'USD'
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(p)
      : new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP', minimumFractionDigits: 0 }).format(p);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImgError('');
    const oversized = files.filter(f => f.size > MAX_BYTES);
    if (oversized.length > 0) {
      setImgError(`Superan 1 MB: ${oversized.map(f => f.name).join(', ')}`);
      return;
    }
    setImages(prev => [...prev, ...files.map(file => ({
      file, preview: URL.createObjectURL(file), uploading: false,
    }))]);
    e.target.value = '';
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const uploadImage = async (img: ImagePreview, idx: number): Promise<{ url: string; fileId: string } | null> => {
    setImages(prev => prev.map((im, i) => i === idx ? { ...im, uploading: true } : im));
    const fd = new FormData();
    fd.append('file', img.file);
    fd.append('folder', 'products');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setImages(prev => prev.map((im, i) => i === idx ? { ...im, uploading: false, error: 'Error al subir' } : im));
      return null;
    }
    setImages(prev => prev.map((im, i) => i === idx ? { ...im, uploading: false, url: data.url, fileId: data.fileId } : im));
    return { url: data.url, fileId: data.fileId };
  };

  const addSpec = () => setSpecs(prev => [...prev, { tag: '', value: '' }]);
  const updateSpec = (idx: number, field: 'tag' | 'value', val: string) =>
    setSpecs(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  const removeSpec = (idx: number) => setSpecs(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!name.trim()) { setError('El nombre es obligatorio'); setLoading(false); return; }
    if (price <= 0) { setError('El precio debe ser mayor a 0'); setLoading(false); return; }
    if (hasDiscount && originalPrice <= price) {
      setError('El precio original debe ser mayor al precio con descuento');
      setLoading(false);
      return;
    }

    const uploadedImages: { url: string; fileId: string; isMain: boolean }[] = [];
    for (let i = 0; i < images.length; i++) {
      if (images[i].url) {
        uploadedImages.push({ url: images[i].url!, fileId: images[i].fileId!, isMain: i === 0 });
      } else {
        const result = await uploadImage(images[i], i);
        if (result) uploadedImages.push({ url: result.url, fileId: result.fileId, isMain: i === 0 });
      }
    }

    const payload = {
      store_id: storeId,
      seller_id: userId,
      name,
      description: description || null,
      category: category || null,
      quantity,
      price,
      currency_type: currencyType,
      has_discount: hasDiscount,
      original_price: hasDiscount ? originalPrice : null,
      specifications: specs.filter(s => s.tag.trim() && s.value.trim()),
      updated_at: new Date().toISOString(),
    };

    let productId: string;

    if (initialData?.id) {
      const { error: updateError } = await supabase
        .from('store_products')
        .update(payload)
        .eq('id', initialData.id);
      if (updateError) { setError(updateError.message); setLoading(false); return; }
      productId = initialData.id;
    } else {
      const { data: product, error: insertError } = await supabase
        .from('store_products')
        .insert(payload)
        .select()
        .single();
      if (insertError || !product) { setError(insertError?.message || 'Error al crear'); setLoading(false); return; }
      productId = product.id;
    }

    if (uploadedImages.length > 0) {
      await supabase.from('store_product_images').insert(
        uploadedImages.map(img => ({
          product_id: productId,
          image_url: img.url,
          imagekit_file_id: img.fileId,
          is_main: img.isMain,
        }))
      );
    }

    router.push(`/seller/store/${storeId}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        padding: '0.875rem 1rem',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <button
          onClick={() => router.back()}
          style={{ padding: '0.5rem', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', display: 'flex' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {initialData ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{storeName}</p>
        </div>
      </div>

      <div style={{ maxWidth: '40rem', margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {error && (
            <div style={{ fontSize: '0.85rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius)', background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          {/* Imágenes */}
          <div className="card">
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
              Imágenes del producto
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Máximo 1 MB por imagen. La primera será la principal.
            </p>

            {imgError && (
              <div style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', background: '#fef2f2', color: 'var(--error)', border: '1px solid #fecaca', marginBottom: '0.75rem' }}>
                {imgError}
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', width: '6rem', height: '6rem', borderRadius: 'var(--radius)', overflow: 'hidden', border: `2px solid ${idx === 0 ? 'var(--accent)' : 'var(--border)'}`, flexShrink: 0 }}>
                  <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {idx === 0 && (
                    <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', fontSize: '0.6rem', color: '#fff', padding: '0.2rem', background: 'var(--accent)' }}>
                      Principal
                    </span>
                  )}
                  {img.uploading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                      <span style={{ color: '#fff', fontSize: '0.7rem' }}>...</span>
                    </div>
                  )}
                  {img.error && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(220,38,38,0.7)' }}>
                      <span style={{ color: '#fff', fontSize: '0.65rem', textAlign: 'center', padding: '0.25rem' }}>Error</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={10} color="white" />
                  </button>
                </div>
              ))}

              <label style={{ width: '6rem', height: '6rem', borderRadius: 'var(--radius)', border: '2px dashed var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, gap: '0.25rem' }}>
                <Upload size={20} />
                <span style={{ fontSize: '0.7rem' }}>Agregar</span>
                <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImagesChange} />
              </label>
            </div>
          </div>

          {/* Info básica */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', margin: 0 }}>
              Información del producto
            </h2>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                Nombre *
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ej: iPhone 13 Pro Max" className="input" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                Descripción
              </label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe el producto..." rows={3} className="input" style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  Categoría
                </label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Ej: Accesorios..." className="input" />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  <Package size={12} /> Cantidad
                </label>
                <input type="number" value={quantity} onChange={e => setQuantity(Math.max(0, parseInt(e.target.value) || 0))} min={0} className="input" />
              </div>
            </div>
          </div>

          {/* Precio */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', margin: 0 }}>
              Precio
            </h2>

            {/* Selector de moneda */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Moneda
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['CUP', 'USD'] as const).map(cur => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => setCurrencyType(cur)}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: 'var(--radius)',
                      fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                      border: `2px solid ${currencyType === cur ? 'var(--primary)' : 'var(--border)'}`,
                      background: currencyType === cur ? 'var(--primary-light)' : 'var(--surface)',
                      color: currencyType === cur ? 'var(--primary)' : 'var(--text-secondary)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle descuento */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Percent size={15} style={{ color: 'var(--accent)' }} />
                <div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>En descuento</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Muestra precio anterior tachado</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHasDiscount(!hasDiscount)}
                style={{ position: 'relative', width: '2.75rem', height: '1.5rem', borderRadius: '999px', background: hasDiscount ? 'var(--accent)' : 'var(--border)', border: 'none', cursor: 'pointer', flexShrink: 0 }}
              >
                <span style={{ position: 'absolute', top: '0.125rem', left: '0.125rem', width: '1.25rem', height: '1.25rem', background: '#fff', borderRadius: '50%', transition: 'transform 0.2s', transform: hasDiscount ? 'translateX(1.25rem)' : 'translateX(0)' }} />
              </button>
            </div>

            {hasDiscount && (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                  Precio original (antes del descuento) en {currencyType}
                </label>
                <input type="number" value={originalPrice || ''} onChange={e => setOriginalPrice(parseFloat(e.target.value) || 0)} min={0} step={0.01} placeholder="0.00" className="input" />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
                {hasDiscount ? 'Precio con descuento' : 'Precio'} en {currencyType}
              </label>
              <input type="number" value={price || ''} onChange={e => setPrice(parseFloat(e.target.value) || 0)} min={0} step={0.01} placeholder="0.00" className="input" required />
            </div>

            {/* Preview */}
            {price > 0 && (
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vista previa:</span>
                {hasDiscount && originalPrice > 0 && (
                  <span style={{ fontSize: '0.875rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                    {formatPrice(originalPrice)}
                  </span>
                )}
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: hasDiscount ? 'var(--error)' : 'var(--primary)' }}>
                  {formatPrice(price)}
                </span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', background: currencyType === 'USD' ? '#eff6ff' : 'var(--primary-light)', color: currencyType === 'USD' ? '#1d4ed8' : 'var(--primary)', border: `1px solid ${currencyType === 'USD' ? '#bfdbfe' : 'var(--primary-muted)'}` }}>
                  {currencyType}
                </span>
                {hasDiscount && originalPrice > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '999px', background: '#fef2f2', color: 'var(--error)', border: '1px solid #fecaca' }}>
                    -{Math.round((1 - price / originalPrice) * 100)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Especificaciones */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>Especificaciones</h2>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>Marca, Modelo, Material, etc.</p>
              </div>
              <button
                type="button"
                onClick={addSpec}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Plus size={13} /> Agregar
              </button>
            </div>

            {specs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Tag size={28} style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontSize: '0.75rem' }}>No hay especificaciones aún.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {specs.map((spec, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input type="text" value={spec.tag} onChange={e => updateSpec(idx, 'tag', e.target.value)} placeholder="Ej: Marca" className="input" style={{ flex: '0 0 35%' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>:</span>
                    <input type="text" value={spec.value} onChange={e => updateSpec(idx, 'value', e.target.value)} placeholder="Ej: Samsung" className="input" style={{ flex: 1 }} />
                    <button type="button" onClick={() => removeSpec(idx)} style={{ padding: '0.5rem', borderRadius: 'var(--radius)', background: '#fef2f2', color: 'var(--error)', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '2rem' }}>
            <button type="button" onClick={() => router.back()} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.75rem', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}