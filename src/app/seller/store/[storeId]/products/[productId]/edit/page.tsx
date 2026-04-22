import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import ProductFormClient from '../../new/ProductFormClient';

interface Props {
    params: Promise<{ storeId: string; productId: string }>;
}

export default async function EditProductPage({ params }: Props) {
    const { storeId, productId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: store } = await supabase
        .from('stores')
        .select('id, name')
        .eq('id', storeId)
        .eq('seller_id', user.id)
        .single();

    if (!store) notFound();

    const { data: product } = await supabase
        .from('store_products')
        .select('*, store_product_images(image_url, imagekit_file_id, is_main)')
        .eq('id', productId)
        .eq('seller_id', user.id)
        .single();

    if (!product) notFound();

    return (
        <ProductFormClient
            storeId={storeId}
            storeName={store.name}
            userId={user.id}
            initialData={{
                id: product.id,
                name: product.name,
                description: product.description || '',
                category: product.category || '',
                quantity: product.quantity,
                price: product.price,
                has_discount: product.has_discount,
                original_price: product.original_price,
                specifications: product.specifications || [],
                images: (product.store_product_images || []).map((i: { image_url: string; imagekit_file_id: string; is_main: boolean }) => ({
                    url: i.image_url,
                    fileId: i.imagekit_file_id,
                    isMain: i.is_main,
                })),
            }}
        />
    );
}