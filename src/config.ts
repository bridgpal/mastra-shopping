import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
const result = dotenv.config();

// Define the environment variables schema
const envSchema = z.object({
  CT_PROJECT_KEY: z.string(),
  CT_CLIENT_ID: z.string(),
  CT_CLIENT_SECRET: z.string(),
  CT_API_URL: z.string().default('https://api.europe-west1.gcp.commercetools.com'),
  CT_AUTH_URL: z.string().default('https://auth.europe-west1.gcp.commercetools.com'),
  CT_SCOPE: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Export the validated environment variables
export const config = {
  commercetools: {
    projectKey: env.CT_PROJECT_KEY,
    clientId: env.CT_CLIENT_ID,
    clientSecret: env.CT_CLIENT_SECRET,
    apiUrl: env.CT_API_URL,
    authUrl: env.CT_AUTH_URL,
    scope: env.CT_SCOPE || `manage_project:${env.CT_PROJECT_KEY}`,
  },
  nodeEnv: env.NODE_ENV,
} as const; 