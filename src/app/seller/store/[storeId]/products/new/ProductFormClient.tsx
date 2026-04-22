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
    specifications: Spec[];
    images: { url: string; fileId: string; isMain: boolean }[];
  };
}

const MAX_MB = 1;
const MAX_BYTES = MAX_MB * 1024 * 1024;

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
  const [specs, setSpecs] = useState<Spec[]>(initialData?.specifications || []);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState('');

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP', minimumFractionDigits: 0 }).format(p);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImgError('');

    const oversized = files.filter(f => f.size > MAX_BYTES);
    if (oversized.length > 0) {
      setImgError(`Las siguientes imágenes superan 1 MB: ${oversized.map(f => f.name).join(', ')}`);
      return;
    }

    const newPreviews: ImagePreview[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }));

    setImages(prev => [...prev, ...newPreviews]);
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

  const updateSpec = (idx: number, field: 'tag' | 'value', val: string) => {
    setSpecs(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  };

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

    // Subir imágenes
    const uploadedImages: { url: string; fileId: string; isMain: boolean }[] = [];
    for (let i = 0; i < images.length; i++) {
      if (images[i].url) {
        uploadedImages.push({ url: images[i].url!, fileId: images[i].fileId!, isMain: i === 0 });
      } else {
        const result = await uploadImage(images[i], i);
        if (result) uploadedImages.push({ url: result.url, fileId: result.fileId, isMain: i === 0 });
      }
    }

    // Insertar producto
    const { data: product, error: productError } = await supabase
      .from('store_products')
      .insert({
        store_id: storeId,
        seller_id: userId,
        name,
        description: description || null,
        category: category || null,
        quantity,
        price,
        has_discount: hasDiscount,
        original_price: hasDiscount ? originalPrice : null,
        specifications: specs.filter(s => s.tag.trim() && s.value.trim()),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (productError || !product) {
      setError(productError?.message || 'Error al crear el producto');
      setLoading(false);
      return;
    }

    // Insertar imágenes
    if (uploadedImages.length > 0) {
      await supabase.from('store_product_images').insert(
        uploadedImages.map(img => ({
          product_id: product.id,
          image_url: img.url,
          imagekit_file_id: img.fileId,
          is_main: img.isMain,
        }))
      );
    }

    router.push(`/store/${storeId}`);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 md:px-8 py-4 flex items-center gap-3"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg"
          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
            {initialData ? 'Editar producto' : 'Nuevo producto'}
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{storeName}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {error && (
            <div className="text-sm px-4 py-3 rounded-lg" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--error)' }}>
              {error}
            </div>
          )}

          {/* Imágenes */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              Imágenes del producto
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Máximo 1 MB por imagen. La primera imagen será la principal.
            </p>

            {imgError && (
              <div className="text-xs px-3 py-2 rounded-lg mb-3" style={{ background: '#fef2f2', color: 'var(--error)', border: '1px solid #fecaca' }}>
                {imgError}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden" style={{ border: `2px solid ${idx === 0 ? 'var(--accent)' : 'var(--border)'}` }}>
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-0 left-0 right-0 text-center text-white text-xs py-0.5" style={{ background: 'var(--accent)' }}>
                      Principal
                    </span>
                  )}
                  {img.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <span className="text-white text-xs">...</span>
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.7)' }}>
                      <span className="text-white text-xs text-center px-1">Error</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                  >
                    <X size={10} color="white" />
                  </button>
                </div>
              ))}

              {/* Botón agregar */}
              <label
                className="w-24 h-24 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all"
                style={{ border: '2px dashed var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)' }}
              >
                <Upload size={20} />
                <span className="text-xs mt-1">Agregar</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImagesChange}
                />
              </label>
            </div>
          </div>

          {/* Info básica */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold pb-3" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
              Información del producto
            </h2>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Ej: iPhone 13 Pro Max"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Descripción
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe el producto..."
                rows={3}
                className="input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Categoría
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="Ej: Accesorios, Dispositivos..."
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Package size={12} className="inline mr-1" />
                  Cantidad disponible
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Precio */}
          <div className="card space-y-4">
            <h2 className="text-sm font-semibold pb-3" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
              Precio
            </h2>

            {/* Toggle descuento */}
            <div
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <Percent size={15} style={{ color: 'var(--accent)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Producto en descuento
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Muestra precio anterior tachado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHasDiscount(!hasDiscount)}
                className="relative w-11 h-6 rounded-full transition-all"
                style={{ background: hasDiscount ? 'var(--accent)' : 'var(--border)' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                  style={{ transform: hasDiscount ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>

            {hasDiscount && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Precio original (antes del descuento)
                </label>
                <input
                  type="number"
                  value={originalPrice || ''}
                  onChange={e => setOriginalPrice(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  className="input"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {hasDiscount ? 'Precio con descuento' : 'Precio'}
              </label>
              <input
                type="number"
                value={price || ''}
                onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                min={0}
                step={0.01}
                placeholder="0.00"
                className="input"
                required
              />
            </div>

            {/* Preview precio */}
            {price > 0 && (
              <div
                className="p-3 rounded-xl flex items-center gap-3"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
              >
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Vista previa:</span>
                {hasDiscount && originalPrice > 0 && (
                  <span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>
                    {formatPrice(originalPrice)}
                  </span>
                )}
                <span className="text-lg font-bold" style={{ color: hasDiscount ? 'var(--error)' : 'var(--primary)' }}>
                  {formatPrice(price)}
                </span>
                {hasDiscount && originalPrice > 0 && (
                  <span
                    className="badge text-xs"
                    style={{ background: '#fef2f2', color: 'var(--error)', border: '1px solid #fecaca' }}
                  >
                    -{Math.round((1 - price / originalPrice) * 100)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Especificaciones */}
          <div className="card">
            <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Especificaciones
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Agrega detalles como Marca, Modelo, Material, etc.
                </p>
              </div>
              <button type="button" onClick={addSpec} className="btn-secondary text-xs" style={{ padding: '0.35rem 0.75rem' }}>
                <Plus size={13} /> Agregar
              </button>
            </div>

            {specs.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <Tag size={28} className="mx-auto mb-2" />
                <p className="text-xs">No hay especificaciones. Agrega la primera.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {specs.map((spec, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={spec.tag}
                      onChange={e => updateSpec(idx, 'tag', e.target.value)}
                      placeholder="Ej: Marca"
                      className="input"
                      style={{ flex: '0 0 35%' }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>:</span>
                    <input
                      type="text"
                      value={spec.value}
                      onChange={e => updateSpec(idx, 'value', e.target.value)}
                      placeholder="Ej: Samsung"
                      className="input flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(idx)}
                      className="p-2 rounded-lg shrink-0"
                      style={{ background: '#fef2f2', color: 'var(--error)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary flex-1 justify-center py-3"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 justify-center py-3"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}