import {createEnv} from '@t3-oss/env-core'
import {z} from 'zod'

// Dedupe this with main/env.ts
export const env = createEnv({
  server: {
    NANGO_SECRET_KEY: z.string().optional(),
    SUPAGLUE_API_KEY: z.string().optional(),
    SUPAGLUE_APPLICATION_ID: z.string().default('byos'),
    DESTINATION_SCHEMA: z.string().optional(),
    MGMT_PROVIDER_NAME: z
      .enum(['supaglue', 'nango'])
      .optional()
      .describe('Default mgmt provider '),
    // Required on production, but optional on dev
    INNGEST_SIGNING_KEY: z.string().optional(),
    INNGEST_EVENT_KEY: z.string().optional(),
    // webhook related
    WEBHOOK_URL: z.string().optional(),
    WEBHOOK_SECRET: z.string().optional(),
  },
  runtimeEnv: process.env,
})
