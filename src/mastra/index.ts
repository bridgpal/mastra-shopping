import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';

import { shoppingAgent } from './agents';

export const mastra = new Mastra({
  agents: { shoppingAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
