# AI Shopping Assistant

An intelligent shopping assistant built with Mastra.ai that helps customers find products and get store information.

## Features

- 🔍 Smart product search
- 💬 Natural language interaction using GPT-4
- ℹ️ Store information assistance (hours, return policy)

## Tech Stack

- Mastra.ai (@mastra/core, @mastra/client-js)
- TypeScript
- Zod for schema validation

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
Create a `.env.development` file with:
```
OPENAI_API_KEY=your_api_key_here
```

3. Run development server:
```bash
pnpm dev
```

## Project Structure

- `src/mastra/agents/index.ts`: Main agent implementation
- `src/mastra/data/products.ts`: Product catalog and data structures

## Tools

The assistant implements two main tools:
1. `searchProducts`: Search through product catalog
2. `getStoreInfo`: Provides store hours and return policy information

## License

MIT