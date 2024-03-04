import {db as _db, dbUpsert, eq, schema, sql} from '@supaglue/db'
import type {PathsWithMethod, ResponseFrom} from '@supaglue/vdk'
import {BadRequestError, NotFoundError} from '@supaglue/vdk'
import type {NangoSDK, NangoSDKTypes} from '@opensdks/sdk-nango'
import {initNangoSDK} from '@opensdks/sdk-nango'
import type {commonModels} from '../router'
import {type MgmtProvider} from '../router'

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

export function fromNangoConnection(
  c: NangoConnection,
): commonModels.Connection {
  return {
    id: `${c.id}`,
    customer_id: `${c.connection_id}`,
    provider_name: fromNangoProvider(c.provider),
  }
}

export async function getCustomerOrFail(db: typeof _db, id: string) {
  const cus = await db.query.customer.findFirst({
    where: eq(schema.customer.id, id),
  })
  if (!cus) {
    throw new NotFoundError(`Customer not found even after upsert. id: ${id}`)
  }
  return {...cus, customer_id: cus.id}
}

export const nangoPostgresProvider = {
  __init__: ({ctx}) => {
    const nangoSecretKey = ctx.headers.get('x-nango-secret-key')
    if (!nangoSecretKey) {
      throw new BadRequestError('x-nango-secret-key header is required')
    }
    const nango = initNangoSDK({
      headers: {authorization: `Bearer ${nangoSecretKey}`},
    })
    return {nango, db: _db}
  },
  listCustomers: async ({instance}) =>
    instance.db.query.customer
      .findMany()
      .then((rows) => rows.map((r) => ({...r, customer_id: r.id}))),
  getCustomer: async ({instance, input}) =>
    getCustomerOrFail(instance.db, input.id),
  upsertCustomer: async ({instance, input}) => {
    await dbUpsert(
      instance.db,
      schema.customer,
      [{...input, id: input.customer_id, updated_at: sql.raw('now()')}],
      {noDiffColumns: ['updated_at']},
    )
    return getCustomerOrFail(instance.db, input.customer_id)
  },
  listConnections: async ({instance, input}) =>
    instance.nango
      .GET('/connection', {
        params: {query: {connectionId: input.customer_id}},
      })
      .then((r) => r.data.configs.map(fromNangoConnection)),

  deleteConnection: async ({instance, input}) => {
    await instance.nango.DELETE('/connection/{connectionId}', {
      params: {path: {connectionId: ''}, query: {provider_config_key: ''}},
    })
  },
  // Maybe having a way to specify required methods could be nice for providers
} satisfies MgmtProvider<{nango: NangoSDK; db: typeof _db}>
