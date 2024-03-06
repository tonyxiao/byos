import {createEnv} from '@t3-oss/env-core'
import {z} from 'zod'

// Dedupe this with main/env.ts
export const env = createEnv({
  // TODO: Add a way to make POSTGRES_URL optional. also should not be initialized top level like this...
  server: {
    POSTGRES_URL: z.string().default('postgres://localhost:5432/postgres'),
  },
  runtimeEnv: process.env,
})
