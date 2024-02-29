import {createEnv} from '@t3-oss/env-core'
import {z} from 'zod'

// Dedupe this with main/env.ts
export const env = createEnv({
  server: {
    NANGO_SECRET_KEY: z.string().optional(),
    SUPAGLUE_API_KEY: z.string().optional(),
  },
  runtimeEnv: process.env,
})
