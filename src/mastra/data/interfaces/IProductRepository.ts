export interface IProduct {
  id: string;
  title: string;
  description: string;
  price: {
    amount: number;
    currencyCode: string;
  };
  image: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: {
    amount: number;
    currencyCode: string;
  };
  attributes?: Record<string, any>;
}

export interface SearchOptions {
  category?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  limit?: number;
  offset?: number;
}

export interface StoreInfo {
  hours: string;
  returns: string;
  shipping: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent?: string;
}

export interface IProductRepository {
  searchProducts(query: string, options?: SearchOptions): Promise<IProduct[]>;
  getProductById(id: string): Promise<IProduct>;
  getProductsByCategory(category: string): Promise<IProduct[]>;
  getStoreInfo(): Promise<StoreInfo>;
  getCategories(): Promise<Category[]>;
} 