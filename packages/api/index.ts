import {createOpenApiFetchHandler} from '@lilyrose2798/trpc-openapi'
import {isHttpError} from '@supaglue/vdk'
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
      // onError, // can only have side effect and not modify response error status code unfortunately...
      responseMeta: ({errors, ctx}) => {
        // Pass the status along
        for (const err of errors) {
          console.warn(
            '[TRPCError]',
            {
              customerId: ctx?.headers.get('x-customer-id'),
              providerName: ctx?.headers.get('x-provider-name'),
            },
            err,
          )
          if (isHttpError(err.cause)) {
            // Maybe rename this to status within the error object?
            return {status: err.cause.code}
          }
        }
        return {}
      },
    })
}

export {zByosHeaders, type ByosHeaders} from '@supaglue/vdk'
