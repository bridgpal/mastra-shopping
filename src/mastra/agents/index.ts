import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { searchProductsTool, getStoreInfoTool, getCategoriesTool, getProductsByCategoryTool } from '../tools';
import { MCPClient } from '@mastra/mcp';

// CommerceTools MCP configuration

const API_URL = process.env.CT_API_URL
const CLIENT_ID = process.env.CT_CLIENT_ID
const CLIENT_SECRET = process.env.CT_CLIENT_SECRET 
const PROJECT_KEY = process.env.CT_PROJECT_KEY 
const AUTH_URL = process.env.CT_AUTH_URL 
const SCOPE = process.env.CT_SCOPE 



export const mcp = new MCPClient({
  servers: {
    commercetools: {
      command: "npx",
      args: [
        "-y",
        "@commercetools-demo/mcp",
        `--clientId=${CLIENT_ID}`,
        `--clientSecret=${CLIENT_SECRET}`,
        `--projectKey=${PROJECT_KEY}`,
        `--authUrl=${AUTH_URL}`,
        `--apiUrl=${API_URL}`,
        `--tools=products.read,products.update,product-search.read,category.read,category.create,category.update`,
      ],
    },
  },  
});

export const shoppingAgent = new Agent({
  name: 'Shopping Assistant',
  instructions: 
  `You are a helpful shopping assistant that can access Commercetools data. 
  Your primary goal is to help the user shop for products.

  When listing products:
  - Use 'commercetools_list_products' with this exact structure:
    {
      "limit": 20,
      "offset": 0,
      "sort": ["createdAt desc"],
      "where": [],
      "expand": []
    }
  - All fields are required:
    - limit: Number of results (number)
    - offset: Pagination offset (number)
    - sort: Array of sort expressions (e.g., ["createdAt desc"])
    - where: Array of filter predicates (can be empty)
    - expand: Array of expansion paths (can be empty)
  - For category filtering use:
    {
      "limit": 20,
      "offset": 0,
      "sort": ["createdAt desc"],
      "where": ["masterData.current.categories.id=\"123\""],
      "expand": []
    }

  When searching products:
  - Use 'commercetools_search_products' with this exact structure:
    {
      "query": "text.en-US=\"search term\"",
      "sort": [
        {
          "field": "score",
          "order": "desc"
        }
      ],
      "limit": 20,
      "offset": 0,
      "markMatchingVariants": true,
      "productProjectionParameters": {},
      "facets": []
    }
  - All fields are required:
    - query: The search text in predicate format
    - sort: Array with at least one sort criteria
    - limit: Number of results (default: 20)
    - offset: Pagination offset (default: 0)
    - markMatchingVariants: Set to true
    - productProjectionParameters: Empty object
    - facets: Empty array

  When you use tools to retrieve information (like product listings), summarize the key information from the tool results in your response. 

  If a tool call results in an error: Inform the user that the action failed, state the reason if known, and ask if they want to try something else or provide more details (e.g., 'I couldn't find a cart with that ID. Would you like to try a different ID or create a new cart?'). 

  After receiving successful tool results, ALWAYS generate a final text message for the user based on those results.`,
  model: openai('gpt-4o-mini'),
  tools: await mcp.getTools(),
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


          ## Categories
          - [List of Available Categories]

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
