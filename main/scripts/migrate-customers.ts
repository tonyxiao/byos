// import {createClient, fetchLink} from '@opensdks/runtime'
import {toNangoProvider} from '@supaglue/api/mgmt/providers/nango-postgres-provider'
import {db, dbUpsert, pgClient, schema, sql} from '@supaglue/db'
import {
  isHttpError,
  OperationRequestBodyContent,
  PathsWithMethod,
} from '@supaglue/vdk'
import {initNangoSDK, NangoSDKTypes} from '@opensdks/sdk-nango'
import {initSupaglueSDK, Oas_mgmt} from '@opensdks/sdk-supaglue'
import {env} from '../env'

type SupaglueCustomer = Oas_mgmt['components']['schemas']['customer']
type SupaglueProvider = Oas_mgmt['components']['schemas']['provider']
type SupaglueConnection = Oas_mgmt['components']['schemas']['connection']

function toNangoProviderConfigKey(
  provider: Pick<SupaglueProvider, 'id' | 'name'>,
) {
  return `ccfg_${provider.name}_${provider.id}`
}

/** Nango connection is actually a non unique field believe it or not. */
function toNangoConnectionId(conn: Pick<SupaglueConnection, 'customer_id'>) {
  return `cus_${conn.customer_id}`
}

type NangoPaths = NangoSDKTypes['oas']['paths']
type NangoPUTBody<P extends PathsWithMethod<NangoPaths, 'put'>> =
  OperationRequestBodyContent<NangoPaths[P]['put']>

const supaglue = initSupaglueSDK({
  headers: {'x-api-key': env.SUPAGLUE_API_KEY!},
})
const nango = initNangoSDK({
  headers: {authorization: `Bearer ${env.NANGO_SECRET_KEY}`},
})

async function main() {
  const customers = await supaglue.mgmt.GET('/customers').then((r) => r.data)

  await dbUpsert(
    db,
    schema.customer,
    customers.map((c) => ({
      created_at: sql`now()`,
      updated_at: sql`now()`,
      id: c.customer_id,
      email: c.email,
      name: c.name,
    })),
    {insertOnlyColumns: ['created_at'], noDiffColumns: ['updated_at']},
  )
  console.log(`Migrated ${customers.length} customers`)
  await pgClient.end()
  return
  const syncConfigs = await supaglue.mgmt
    .GET('/sync_configs')
    .then((r) => r.data)
  const connections = await Promise.all(
    customers.map((c) =>
      supaglue.mgmt
        .GET('/customers/{customer_id}/connections', {
          params: {path: {customer_id: c.customer_id}},
        })
        .then((r) => r.data),
    ),
  ).then((nestedArr) =>
    nestedArr
      .flatMap((arr) => arr)
      .map((conn) => ({
        ...conn,
        // Not taking into account connection sync config here
        sync_config: syncConfigs.find(
          (c) => c.provider_name === conn.provider_name,
        ),
      })),
  )
  console.log('connections', connections)
}

// Connection configs
async function migrateConfigs() {
  const providers = await supaglue.mgmt.GET('/providers').then((r) => r.data)
  // await nango.GET('/config')
  for (const provider of providers) {
    const nangoProviderName = toNangoProvider(provider.name)
    const body: NangoPUTBody<'/config'> = {
      provider_config_key: toNangoProviderConfigKey(provider),
      provider: nangoProviderName,
      oauth_client_id: provider.config?.oauth.credentials.oauth_client_id ?? '',
      oauth_client_secret:
        provider.config?.oauth.credentials.oauth_client_secret ?? '',
      oauth_scopes: provider.config?.oauth.oauth_scopes.join(',') ?? '',
    }
    await nango
      .POST('/config', {body})
      .catch((err) => {
        if (isHttpError(err, 409)) {
          return nango.PUT('/config', {body})
        }
        throw err
      })
      .catch((err) => {
        if (
          isHttpError<{type: string}>(err, 400) &&
          // Provider configuration cannot be edited for API key based authentication
          (err.error as any).type === 'provider_config_edit_not_allowed'
        ) {
          return
        }
        throw err
      })
  }
}

async function migrateCustomer(opts: {customerId: string}) {
  const connections = await supaglue.mgmt
    .GET('/customers/{customer_id}/connections', {
      params: {path: {customer_id: opts.customerId}},
    })
    .then((r) => r.data)

  await Promise.all(
    connections.map(async (conn) => {
      nango.POST('/connection', {
        body: {
          connection_id: toNangoConnectionId(conn),
          provider_config_key: toNangoProviderConfigKey({
            id: conn.provider_id,
            name: conn.provider_name,
          }),
          refresh_token: '123',
          access_token: '223',
          expires_at: '2025-01-01T00:00:00Z',
        },
      })
    }),
  )
  // const conn = r.data.find(
  //   (c) => c.provider_name === process.env['PROVIDER_NAME']!,
  // )
  // if (!conn) {
  //   throw new Error('Connection not found')
  // }
  // return supaglue.private.exportConnection({
  //   customerId: conn.customer_id,
  //   connectionId: conn.id,
  // })
}

main()
// migrateConfigs()
// migrateCustomer({customerId: '64a350c383ea68001832fd8a'})

// nango.GET('/connection', {
//   params: {query: {connectionId: '64a350c383ea68001832fd8a'}},
// })
