import { Mastra } from '@mastra/core';
import { shoppingAgent } from './mastra/agents';

// Create and configure Mastra instance
const mastra = new Mastra({
  agents: {
    shoppingAgent
  }
});

export default mastra;
