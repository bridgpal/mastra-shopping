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
        limit: 20
      });
      
      logInfo('Products found', { count: products.length });

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
