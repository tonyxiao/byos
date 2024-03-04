import {createOpenApiFetchHandler} from '@lilyrose2798/trpc-openapi'
import {appRouter} from './appRouter'
import {createContext} from './createContext'

export * from './appRouter'
export * from './createContext'
export {toNangoProvider as supaglueProviderToNangoProvider} from './models'

export function createAppHandler({
  endpoint = '/api',
  env,
}: {
  endpoint?: `/${string}`
  env: {NANGO_SECRET_KEY?: string; SUPAGLUE_API_KEY?: string}
}) {
  return (req: Request) =>
    createOpenApiFetchHandler({
      endpoint,
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
}
