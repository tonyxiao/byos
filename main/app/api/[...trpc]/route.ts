import {
  appRouter,
  createContext,
  createOpenApiFetchHandler,
} from '@supaglue/api'
import {env} from '@/env'

const handler = (req: Request) =>
  createOpenApiFetchHandler({
    endpoint: '/api',
    req,
    router: appRouter,
    createContext: () =>
      createContext({
        headers: req.headers,
        nangoSecretKey: env.NANGO_SECRET_KEY,
        supaglueApiKey: env.SUPAGLUE_API_KEY,
      }),
    // onError, // from trpc, cannot modify
    // responseMeta // From trpc-openapi, might not work for plain trpc
  })

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
}
