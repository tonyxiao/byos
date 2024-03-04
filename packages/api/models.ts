import type {PathsWithMethod, ResponseFrom} from '@supaglue/vdk'
import {z} from '@supaglue/vdk'
import type {NangoSDKTypes} from '@opensdks/sdk-nango'

/** workaround the issue that we get back date from db... need to figure out how to just get string */
// const zTimestamp = z
//   .union([z.string(), z.date()])
//   .describe('ISO8601 date string')

// const dbRecord = z.object({
//   // id: z.string(),
//   /** z.string().datetime() does not work for simple things like `2023-07-19T23:46:48.000+0000`  */
//   updated_at: zTimestamp,
//   created_at: zTimestamp,
// })

export const customer = z
  .object({
    customer_id: z.string(),
    name: z.string().nullish(),
    email: z.string().email().nullish(),
  })
  .openapi({ref: 'customer'})

export const connection = z
  .object({
    id: z.string(),
    customer_id: z.string().nullish(),
    provider_name: z.string(),
  })
  .openapi({ref: 'connection'})
export type Connection = z.infer<typeof connection>

/** @deprecated but still needed */
export const connection_sync_config = z
  .object({
    destination_config: z
      .object({type: z.string(), schema: z.string().nullish()})
      .nullish(),

    custom_objects: z.array(z.object({object: z.string()})).nullish(),
  })
  .openapi({ref: 'connection_sync_config'})

// MARK: - Nango stuff
type NangoPaths = NangoSDKTypes['oas']['paths']

type GETResponse<P extends PathsWithMethod<NangoPaths, 'get'>> = ResponseFrom<
  NangoPaths,
  'get',
  P
>
type NangoConnection = GETResponse<'/connection'>['configs'][number]

export function toNangoProvider(provider: string) {
  return provider === 'ms_dynamics_365_sales'
    ? 'microsoft-tenant-specific'
    : provider
}

export function fromNangoProvider(provider: string) {
  return provider === 'microsoft-tenant-specific'
    ? 'ms_dynamics_365_sales'
    : provider
}

export function fromNangoConnection(c: NangoConnection): Connection {
  return {
    id: `${c.id}`,
    customer_id: `${c.connection_id}`,
    provider_name: fromNangoProvider(c.provider),
  }
}
