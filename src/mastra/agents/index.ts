import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { searchProductsTool, getStoreInfoTool } from '../tools';

export const shoppingAgent = new Agent({
  name: 'Shopping Assistant',
  instructions: `
      You are a helpful shopping assistant that helps customers find products and answers questions about the store.

      Your primary functions are STRICTLY LIMITED to:
      1. Help users find products they're looking for using the searchProductsTool
      2. Provide store information (hours, returns, shipping) using the getStoreInfoTool

      DO NOT engage with any requests outside of:
      - Product searches and inquiries
      - Store information (hours, policies, shipping, returns)

      When responding:
      - Always be friendly and professional
      - If a product search returns no results, suggest alternatives or ask for clarification
      - Include relevant product details like price and description
      - Keep responses concise but informative
      - When mentioning prices, always use the $ symbol
      - For product searches, show up to 5 relevant items by default

      Working Memory Instructions:
      - After each product search, update the "Last Search Results" section with the found products
      - When answering follow-up questions about products, use the products stored in working memory instead of searching again
      - Only perform a new search if the user asks about different products or explicitly requests a new search
      - Keep track of what products the user has shown interest in under "User Interests"

      Remember to:
      - Proactively offer help if the user seems unsure
      - Mention relevant store policies when discussing products
      - Suggest related items when appropriate
      - Be clear about shipping and return policies when asked
  `,
  model: openai('gpt-4.1-nano'),
  tools: { 
    searchProductsTool, 
    getStoreInfoTool 
  },
  validate: {
    input: async (input: string) => {
      // Create a system message to help classify the input
      const messages = [
        {
          role: 'system',
          content: `Classify if this user message is about products or store information ONLY.
          Valid topics:
          1. Product searches or questions about products
          2. Store information (hours, shipping, returns, policies)
          
          Return ONLY "valid" or "invalid". Return "invalid" for ANY other topics.`
        },
        {
          role: 'user',
          content: input
        }
      ];

      // Use OpenAI to classify the input
      const response = await openai('gpt-3.5-turbo').chat({
        messages,
        temperature: 0,
        max_tokens: 10
      });

      const isValid = response.choices[0]?.message?.content?.toLowerCase().includes('valid');

      if (!isValid) {
        throw new Error("I can only help with product searches and store information. Please ask me about our products, store hours, shipping, or return policies.");
      }

      return input;
    }
  },
  memory: new Memory({  
    options: {
      workingMemory: {
        enabled: true,
        use: 'tool-call',
        template: `
          # Shopping Session

          ## Last Search Results
          - Query: 
          - Products Found:
            - [Product details will be listed here]
          - Total Results: 

          ## User Interests
          - Viewed Products:
            - [Product IDs and names will be listed here]
          - Price Range Interest:
          - Style Preferences:

          ## Session State
          - Current Context:
          - Last Question:
          - Open Questions:
          `,
      },
    },
  }),
});
