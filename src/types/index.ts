export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: 'buyer' | 'seller';
  seller_account: boolean;
  subscription_status: 'inactive' | 'pending' | 'active' | 'suspended';
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Province {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
}

export interface ProductImage {
  id: number;
  product_id: string;
  image_url: string;
  imagekit_file_id: string;
  is_main: boolean;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category_id: number;
  province_id: number;
  condition: 'nuevo' | 'usado';
  status: 'active' | 'sold' | 'paused';
  views: number;
  created_at: string;
  updated_at: string;
  profiles?: User;
  categories?: Category;
  provinces?: Province;
  product_images?: ProductImage[];
}

export interface SellerProvince {
  id: number;
  seller_id: string;
  province_id: number;
  provinces?: Province;
}