import {db as _db, dbUpsert, eq, schema, sql} from '@supaglue/db'
import type {PathsWithMethod, ResponseFrom} from '@supaglue/vdk'
import {
  BadRequestError,
  NotAuthenticatedError,
  NotFoundError,
} from '@supaglue/vdk'
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

/** Support a single connector config aka nango provider per provider name for now */
export function toNangoProviderConfigKey(provider: string) {
  return `ccfg_${provider}`
}

export function fromNangoProviderConfigKey(provider: string) {
  return provider.replace(/^ccfg_/, '')
}

export function toNangoConnectionId(customerId: string) {
  return `cus_${customerId}`
}

export function fromNangoConnectionId(connectionId: string) {
  return connectionId.replace(/^cus_/, '')
}

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
    customer_id: fromNangoConnectionId(c.connection_id),
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

export async function getConnection(
  nango: NangoSDK,
  {customer_id, provider_name}: {customer_id: string; provider_name: string},
) {
  return nango
    .GET('/connection/{connectionId}', {
      params: {
        path: {connectionId: toNangoConnectionId(customer_id)},
        query: {provider_config_key: toNangoProviderConfigKey(provider_name)},
      },
    })
    .then((r) => r.data as NangoConnection)
}

/** Leverage nango for authentication so we don't need a separate one */
async function authenticateOrFail(nango: NangoSDK) {
  // There is no way to get the current org Id from the official Nango API to be able to
  // tie customers to. So we settle for not getting 403
  const res = await nango.GET('/environment-variables')
  if (res.response.status !== 200) {
    throw new NotAuthenticatedError('Invalid Nango secret key')
  }
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
    function getHeaderOrFail(name: string) {
      const value = ctx.headers.get(name)
      if (!value) {
        throw new BadRequestError(`${name} header is required`)
      }
      return value
    }
    function getCustomerIdAndProviderNameFromHeaders() {
      return {
        customer_id: getHeaderOrFail('x-customer-id'),
        provider_name: getHeaderOrFail('x-provider-name'),
      }
    }
    return {nango, db: _db, getCustomerIdAndProviderNameFromHeaders}
  },
  // TODO: consider separating nango provider from postgres provider... And then have user compose together a nangoPostgres provider
  listCustomers: async ({instance}) => {
    await authenticateOrFail(instance.nango)
    return instance.db.query.customer
      .findMany()
      .then((rows) => rows.map((r) => ({...r, customer_id: r.id})))
  },

  getCustomer: async ({instance, input}) => {
    await authenticateOrFail(instance.nango)
    return getCustomerOrFail(instance.db, input.id)
  },

  upsertCustomer: async ({instance, input}) => {
    await authenticateOrFail(instance.nango)
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
        params: {query: {connectionId: toNangoConnectionId(input.customer_id)}},
      })
      .then((r) => r.data.configs.map(fromNangoConnection)),

  getConnection: async ({instance, input}) =>
    getConnection(instance.nango, input).then(fromNangoConnection),

  deleteConnection: async ({instance, input}) => {
    await instance.nango.DELETE('/connection/{connectionId}', {
      params: {
        path: {connectionId: toNangoConnectionId(input.customer_id)},
        query: {
          provider_config_key: toNangoProviderConfigKey(input.provider_name),
        },
      },
    })
  },

  // MARK: -

  listSyncConfigs: () =>
    // instance.nango
    //   .GET('/environment-variables')
    //   .then(
    //     (res) =>
    //       JSON.parse(
    //         res.data.find((v) => v.name === 'sync-configs')?.value || '[]',
    //       ) as commonModels.SyncConfig[],
    //   ),
    // hard-coding for now, as nango does not have a way to store this and putting it inside env var
    // feels more hacky than helpful for the time being...
    ['hubspot', 'salesforce', 'pipedrive', 'ms_dynamics_365_sales'].map(
      (provider_name): commonModels.SyncConfig => ({
        provider_name,
        common_objects: [
          'account',
          'contact',
          'opportunity',
          'lead',
          'user',
        ].map((object) => ({object})),
      }),
    ),
  getConnectionSyncConfig: async ({instance}) =>
    getConnection(
      instance.nango,
      instance.getCustomerIdAndProviderNameFromHeaders(),
    ).then((conn) => conn.metadata as commonModels.ConnectionSyncConfig),

  upsertConnectionSyncConfig: async ({instance, input}) => {
    const {customer_id, provider_name} =
      instance.getCustomerIdAndProviderNameFromHeaders()
    await instance.nango.POST('/connection/{connectionId}/metadata', {
      params: {
        path: {connectionId: toNangoConnectionId(customer_id)},
        header: {
          'Provider-Config-Key': toNangoProviderConfigKey(provider_name),
        },
      },
      body: input as Record<string, never>,
    })
    return input
  },

  // Maybe having a way to specify required methods could be nice for providers
} satisfies MgmtProvider<{
  nango: NangoSDK
  db: typeof _db
  // Would be great to separate the __init__ from rest of the methods
  // so we don't have to repeat ourselves like this and can use result of __init__ in other methods
  // via typescript inference
  getCustomerIdAndProviderNameFromHeaders: () => {
    customer_id: string
    provider_name: string
  }
}>
