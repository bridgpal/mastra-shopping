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
  name: { [lang: string]: string }; // e.g., { en: "Hats" }
  slug?: { [lang: string]: string }; // e.g., { en: "hats" }
  parent?: { id: string };
  orderHint?: string;
}

export interface IProductRepository {
  searchProducts(query: string, options?: SearchOptions): Promise<IProduct[]>;
  getProductById(id: string): Promise<IProduct>;
  getProductsByCategory(category: string): Promise<IProduct[]>;
  getStoreInfo(): Promise<StoreInfo>;
  getCategories(): Promise<Category[]>;
  createCategory(category: Category): Promise<Category>;
} 