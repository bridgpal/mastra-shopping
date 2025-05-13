import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { configureServices } from '../config/dependencies';
import { logError, logInfo } from '../utils/logging';

// Search Products Tool
export const searchProductsTool = createTool({
  id: 'search-products',
  description: 'Search through the product catalog based on query',
  inputSchema: z.object({
    query: z.string().describe('Search query for products'),
    category: z.string().optional().describe('Product category'),
    priceRange: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }).optional()
  }),
  outputSchema: z.object({
    products: z.array(z.object({
      id: z.string(),
      title: z.string(),
      price: z.number(),
      image: z.string().optional(),
      description: z.string().optional()
    })),
    totalResults: z.number()
  }),
  execute: async ({ context }) => {
    try {
      logInfo('Searching products', { query: context.query, category: context.category, priceRange: context.priceRange });

      const { productRepository } = configureServices();
      const products = await productRepository.searchProducts(context.query, {
        category: context.category,
        priceRange: context.priceRange,
        limit: 6
      });
      
      logInfo('Products found', { count: products });

      return {
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price.amount,
          image: p.image,
          description: p.description
        })),
        totalResults: products.length
      };

    } catch (error) {
      logError(error as Error, { context });
      throw error;
    }
  },
});

// Store Information Tool
export const getStoreInfoTool = createTool({
  id: 'get-store-info',
  description: 'Get information about store hours and policies',
  inputSchema: z.object({
    infoType: z.enum(['hours', 'returns', 'shipping']).describe('Type of information requested')
  }),
  outputSchema: z.object({
    info: z.string()
  }),
  execute: async ({ context }) => {
    try {
      logInfo('Fetching store information', { infoType: context.infoType });

      const { productRepository } = configureServices();
      const storeInfo = await productRepository.getStoreInfo();
      
      logInfo('Store information retrieved', { infoType: context.infoType });

      return {
        info: storeInfo[context.infoType]
      };
    } catch (error) {
      logError(error as Error, { context });
      throw error;
    }
  },
});

export const getProductsByCategoryTool = createTool({
  id: 'get-products-by-category',
  description: 'Get products by category id',
  inputSchema: z.object({
    categoryId: z.string().describe('ID of the category')
  }),
  outputSchema: z.object({
    products: z.array(z.object({
      id: z.string(),
      title: z.string(),
      price: z.number(),
      image: z.string(),
      description: z.string().optional()
    })),
    totalResults: z.number(),
    categoryIdUsed: z.string()
  }),
  execute: async ({ context }) => {
    try {
      logInfo('Fetching products by category', { categoryId: context.categoryId });

      const { productRepository } = configureServices();
      const products = await productRepository.getProductsByCategory(context.categoryId);
      
      logInfo('Products by category retrieved', { count: products.length });

      return {
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price.amount,
          image: p.image,
          description: p.description
        })),
        totalResults: products.length,
        categoryIdUsed: context.categoryId,
      };

    } catch (error) {
      logError(error as Error, { context });
      throw error;
    }
  },
});


// Categories Tool
export const getCategoriesTool = createTool({
  id: 'get-categories',
  description: 'Get available product categories',
  inputSchema: z.object({}),
  outputSchema: z.object({
    categories: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      parent: z.string().optional()
    }))
  }),
  execute: async () => {
    try {
      logInfo('Fetching categories');

      const { productRepository } = configureServices();
      const categories = await productRepository.getCategories();
      
      logInfo('Categories retrieved', { count: categories.length });

      return {
        categories: categories.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          parent: c.parent
        }))
      };
    } catch (error) {
      logError(error as Error);
      throw error;
    }
  },
});

export const createCategoryTool = createTool({
  id: 'create-category',
  description: 'Create a new product category',
  inputSchema: z.object({
    name: z.string(), // { en: 'Hats' }
    slug: z.string(), // { en: 'hats' }
    // parent: z.object({ id: z.string().optional() }).optional(),
    // orderHint: z.string().optional(),
  }),
  outputSchema: z.object({
    category: z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      parent: z.object({ id: z.string().optional() }).optional(),
      orderHint: z.string().optional(),
    })
  }),
  execute: async ({context}) => {
    try {
      logInfo('Creating category', { context });
      const { productRepository } = configureServices();
      const category = await productRepository.createCategory(context);
      logInfo('Category created', { id: category.id });
      return {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          parent: category.parent,
          orderHint: category.orderHint,
        }
      };
    } catch (error) {
      logError(error as Error);
      throw error;
    }
  },
});

export const addProductToCategoryTool = createTool({
  id: 'add-product-to-category',
  description: 'Add a product to a category',
  inputSchema: z.object({
    categoryId: z.string().describe('ID of the category'),
    productId: z.string().describe('ID of the product')
  }),
  outputSchema: z.object({
    categoryId: z.string(),
    productId: z.string()
  }),
  execute: async ({context}) => {
    try {
      logInfo('Adding product to category', { context });
      const { productRepository } = configureServices();
      await productRepository.addProductToCategory(context.categoryId, context.productId);
      logInfo('Product added to category', { categoryId: context.categoryId, productId: context.productId });
      return {
        categoryId: context.categoryId,
        productId: context.productId
      };
    } catch (error) {
      logError(error as Error);
      throw error;
    }
  },
});

export const getRecentlyOutOfStockProductsTool = createTool({
  id: 'get-recently-out-of-stock-products',
  description: 'Get products that have been out of stock recently',
  outputSchema: z.object({
    products: z.array(z.string())
  }),
  execute: async () => {
    try {
      logInfo('Fetching recently out of stock products');
      const { productRepository } = configureServices();
      const products = await productRepository.getRecentlyOutOfStockProducts();
      logInfo('Products retrieved', { count: products.length });
      return { products };
    } catch (error) {
      logError(error as Error);
      throw error;
    }
  },
});