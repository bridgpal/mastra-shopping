import { createTool } from '@mastra/core/tools';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { products } from '../data/products';
import Fuse from 'fuse.js';

// Search Products Tool
export const searchProductsTool = createTool({
  id: 'search-products',
  description: 'Search through the product catalog based on query',
  inputSchema: z.object({
    query: z.string().describe('Search query for products')
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
    console.log("INPUT DATA", context);
    const mappedProducts = products[0].allContentstackproducts.nodes.map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      image: p.product_image?.url,
      description: ''
    }));

    const fuse = new Fuse(mappedProducts, {
      keys: ['title'],
      threshold: 0.5,        // Lower threshold = stricter matching
      minMatchCharLength: 2, // Require at least 2 characters to match
    });

    const searchResults = context.query.trim() 
      ? fuse.search(context.query).map(result => result.item)
      : mappedProducts;

    return {
      products: searchResults,
      totalResults: searchResults.length
    };
  }
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
    const storeInfo = {
      hours: 'Our store is open Monday-Friday 9am-8pm, Saturday 10am-6pm, and Sunday 11am-5pm EST.',
      returns: 'We offer a 30-day return policy on all unused items in original packaging. Return shipping is free.',
      shipping: 'Free standard shipping on orders over $50. Express shipping available for additional cost.'
    };

    return {
      info: storeInfo[context.infoType]
    };
  },
});
