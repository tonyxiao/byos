import type {OpenApiMeta} from '@lilyrose2798/trpc-openapi'
import {initTRPC, TRPCError} from '@trpc/server'
import {nangoProxyLink} from './nangoProxyLink'
import type {Provider} from './provider'
import {supaglueProxyLink} from './supaglueProxyLink'

export type RouterContext = {
  nangoSecretKey?: string
  supaglueApiKey?: string
  headers: Headers
  providerByName: Record<string, Provider>
}

export interface RouterMeta extends OpenApiMeta {}

// Technically trpc doesn't quite belong in here... However it adds complexity to do dependency injection
// into each vertical so we are keeping it super simple for now...
export const trpc = initTRPC
  .context<RouterContext>()
  .meta<RouterMeta>()
  .create({
    allowOutsideOfServer: true,
    // We cannot use the errorFormatter to modify here because trpc-openapi does not respect data.httpStatus field
    // so we need to catch it further upstream. But we can add some fields...
    errorFormatter: ({shape, error}) => ({
      class: error.constructor.name,
      ...shape,
    }),
    // if (error instanceof NoLongerAuthenticatedError) {
    //   return {code: ''}
    // }
    // // TODO: We need better logic around this... 500 from BYOS is very different from
    // // 500 from our platform. This is likely not a good heuristic at the moement...
    // if (err instanceof HTTPError && err.code >= 500) {
    //   return 'REMOTE_ERROR'
    // }
    // // Anything else non-null would be considered internal error.
    // if (err != null) {
    //   return 'INTERNAL_ERROR'
    // }
    // console.log('errorFormatter', opts)
    // shape.data.httpStatus = 401

    //   return {
    //     ...shape,
    //     code: -32600,
    //     data: {
    //       ...shape.data,
    //       code: 'BAD_REQUEST',
    //       httpStatus: 409,
    //     },
    //   }
    // },
  })

export const publicProcedure = trpc.procedure

export const remoteProcedure = publicProcedure.use(
  async ({next, ctx, path}) => {
    const customerId = ctx.headers.get('x-customer-id')
    if (!customerId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'x-customer-id header is required',
      })
    }
    const providerName = ctx.headers.get('x-provider-name')
    if (!providerName) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'x-provider-name header is required',
      })
    }

    const provider = ctx.providerByName[providerName]
    if (!provider) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Provider ${providerName} not found`,
      })
    }

    const nangoLink = ctx.nangoSecretKey
      ? nangoProxyLink({
          secretKey: ctx.nangoSecretKey,
          connectionId: ctx.headers.get('x-connection-id') ?? customerId,
          providerConfigKey:
            ctx.headers.get('x-provider-config-key') ?? providerName,
        })
      : undefined

    const supaglueLink = supaglueProxyLink({
      // TODO: Should this be required?
      apiKey: ctx.headers.get('x-api-key') ?? ctx.supaglueApiKey ?? '',
      customerId,
      providerName,
    })

    return next({
      ctx: {
        ...ctx,
        path,
        customerId,
        providerName,
        provider,
        nangoLink,
        supaglueLink,
      },
    })
  },
)

export type RemoteProcedureContext = ReturnType<
  (typeof remoteProcedure)['query']
>['_def']['_ctx_out']
