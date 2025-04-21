import { createTool } from '@mastra/core/tools';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { products } from '../data/products';

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
    try {
      console.log('Searching with query:', context.query);
      console.log('Products data:', products[0].allContentstackproducts.nodes.length, 'items');

      // Use OpenAI to search and transform products
      const { object } = await generateObject({
        model: openai('gpt-4'),
        schema: z.object({
          products: z.array(z.object({
            id: z.string(),
            title: z.string(),
            price: z.number(),
            image: z.string().optional(),
            description: z.string().optional()
          })),
          totalResults: z.number()
        }),
        prompt: `Search Query: "${context.query}"\n\nAvailable Products:\n${JSON.stringify(products[0].allContentstackproducts.nodes, null, 2)}

Instructions:
1. Filter products based on the search query, considering titles, descriptions, and attributes
2. Transform matching products to have these exact fields:
   - id: string (use the original id)
   - title: string (use the original title)
   - price: number (use the original price)
   - image: string (use product_image.url if available)
   - description: string (use the original description)
3. Return only relevant matches, limited to 5 most relevant items
4. Include the total count of matches`
      });

      console.log('OpenAI response:', object);

      return object;

    } catch (error) {
      console.error('Error in searchProductsTool:', error);
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
