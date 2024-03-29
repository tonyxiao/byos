import {createOpenApiFetchHandler} from '@lilyrose2798/trpc-openapi'
import {env} from '@supaglue/env'
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
          req.headers.get('x-api-key') === env['SUPAGLUE_API_KEY'] &&
          !req.headers.get('x-nango-secret-key') &&
          env['NANGO_SECRET_KEY']
        ) {
          // console.log('Will set x-nango-secret-key header')
          req.headers.set('x-nango-secret-key', env['NANGO_SECRET_KEY'])
        } else {
          // console.log('Not setting x-nango-secret-key header', {
          //   SUPAGLUE_API_KEY: env['SUPAGLUE_API_KEY'],
          //   NANGO_SECRET_KEY: env['NANGO_SECRET_KEY'],
          //   'x-api-key': req.headers.get('x-api-key'),
          //   'x-nango-secret-key': req.headers.get('x-nango-secret-key'),
          // })
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
