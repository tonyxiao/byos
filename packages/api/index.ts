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
      createContext: () => createContext({headers: req.headers}),
      // onError, // from trpc, cannot modify
      // responseMeta // From trpc-openapi, might not work for plain trpc
    })
}

export {zByosHeaders, type ByosHeaders} from '@supaglue/vdk'
