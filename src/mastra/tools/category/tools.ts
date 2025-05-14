import {
  readCategoryPrompt,
  createCategoryPrompt,
  updateCategoryPrompt,
} from './prompts';

import {
  readCategoryParameters,
  createCategoryParameters,
  updateCategoryParameters,
} from './parameters';

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { logError, logInfo } from '../../utils/logging';
import { configureServices } from '../../config/dependencies';

export const readCategoryTool = createTool({
  id: 'read-category',
  description: 'Get available product categories',
  inputSchema: readCategoryParameters,
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