import {createOpenApiFetchHandler} from '@lilyrose2798/trpc-openapi'
import {appRouter} from './appRouter'
import {createContext} from './createContext'

export * from './appRouter'
export * from './createContext'

export function createAppHandler({
  endpoint = '/api',
}: {
  endpoint?: `/${string}`
} = {}) {
  return (req: Request) =>
    createOpenApiFetchHandler({
      endpoint,
      req,
      router: appRouter,
      createContext: () => {
        // Temporary workaround to automatically set nango secret key based on supaglue API key
        if (
          req.headers.get('x-api-key') === process.env['SUPAGLUE_API_KEY'] &&
          !req.headers.get('x-nango-secret-key') &&
          process.env['NANGO_SECRET_KEY']
        ) {
          req.headers.set('x-nango-secret-key', process.env['NANGO_SECRET_KEY'])
        }
        return createContext({headers: req.headers})
      },
      // onError, // from trpc, cannot modify
      // responseMeta // From trpc-openapi, might not work for plain trpc
    })
}

export {zByosHeaders, type ByosHeaders} from '@supaglue/vdk'
