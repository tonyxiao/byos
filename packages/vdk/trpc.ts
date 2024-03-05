import type {OpenApiMeta} from '@lilyrose2798/trpc-openapi'
import {initTRPC} from '@trpc/server'
import {z} from '@opensdks/util-zod'
import {BadRequestError} from './errors'
import type {Provider} from './provider'

export type RouterContext = {
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

export const zByosHeaders = z.object({
  'x-customer-id': z.string().nullish(),
  'x-provider-name': z.string().nullish(),
  'x-nango-secret-key': z.string().nullish(),
  /** Supaglue API key */
  'x-api-key': z.string().nullish(),
  /** Will use nangoPostgres instead of supaglue */
  'x-use-new-backend': z.enum(['true', 'false']).nullish(),
})
export type ByosHeaders = z.infer<typeof zByosHeaders>

// All the headers we accept here...
export const publicProcedure = trpc.procedure.use(async ({next, ctx, path}) => {
  const optional = zByosHeaders.parse(Object.fromEntries(ctx.headers.entries()))
  const required = new Proxy(optional, {
    get(target, p) {
      const value = target[p as keyof typeof target]
      if (value == null) {
        throw new BadRequestError(`${p as string} header is required`)
      }
      return value
    },
  }) as {[k in keyof typeof optional]-?: NonNullable<(typeof optional)[k]>}

  const useNewBackend = optional['x-use-new-backend'] === 'true'

  return next({ctx: {...ctx, path, optional, required, useNewBackend}})
})

export const remoteProcedure = publicProcedure.use(async ({next, ctx}) => {
  const {'x-customer-id': customerId, 'x-provider-name': providerName} =
    ctx.required
  const provider = ctx.providerByName[ctx.required['x-provider-name']]
  if (!provider) {
    throw new BadRequestError(`Provider ${providerName} not found`)
  }
  return next({ctx: {...ctx, customerId, providerName, provider}})
})

export type RemoteProcedureContext = ReturnType<
  (typeof remoteProcedure)['query']
>['_def']['_ctx_out']
