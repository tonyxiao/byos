// import {createClient, fetchLink} from '@opensdks/runtime'
import {parseArgs} from 'node:util'
import {db, dbUpsert, pgClient, schema, sql} from '@supaglue/db'
import {
  toNangoConnectionId,
  toNangoProvider,
  toNangoProviderConfigKey,
} from '@supaglue/mgmt/providers/nango-postgres-provider'
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

type NangoPaths = NangoSDKTypes['oas']['paths']
type NangoPUTBody<P extends PathsWithMethod<NangoPaths, 'put'>> =
  OperationRequestBodyContent<NangoPaths[P]['put']>

const supaglue = initSupaglueSDK({
  headers: {'x-api-key': process.env['SUPAGLUE_API_KEY']!},
})
const nango = initNangoSDK({
  headers: {authorization: `Bearer ${process.env['NANGO_SECRET_KEY']}`},
})

async function migrateCustomers() {
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
}

// Connector configs
async function migrateConnectorConfigs() {
  const providers = await supaglue.mgmt.GET('/providers').then((r) => r.data)
  // await nango.GET('/config')
  for (const provider of providers) {
    const body: NangoPUTBody<'/config'> = {
      provider_config_key: toNangoProviderConfigKey(provider.name),
      provider: toNangoProvider(provider.name),
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

async function migrateCustomerConnections(opts: {customerId: string}) {
  const connections = await supaglue.mgmt
    .GET('/customers/{customer_id}/connections', {
      params: {path: {customer_id: opts.customerId}},
    })
    .then((r) => r.data)

  await Promise.all(
    connections.map(async (conn) => {
      const creds = await supaglue.private
        .exportConnection({connectionId: conn.id, customerId: conn.customer_id})
        .then((r) => r.data)

      await nango.POST('/connection', {
        body: {
          connection_id: toNangoConnectionId(conn.customer_id),
          provider_config_key: toNangoProviderConfigKey(conn.provider_name),
          refresh_token: creds.credentials.refresh_token,
          access_token: creds.credentials.access_token,
          expires_at: creds.credentials.expires_at,
          connection_config: {instance_url: creds.instance_url} as any,
          // TODO: migrate connection sync configs into metadata
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

async function deleteAllDataInNango() {
  const configs = await nango.GET('/config').then((r) => r.data.configs)
  await Promise.all(
    configs.map((c) =>
      nango.DELETE('/config/{providerConfigKey}', {
        params: {path: {providerConfigKey: c.unique_key}},
      }),
    ),
  )
}

const functions = {
  deleteAllDataInNango,
  migrateConnectorConfigs,
  migrateCustomerConnections,
  migrateCustomers,
}

const {
  positionals: [cmd],
  values: options,
} = parseArgs({
  // options: {output: {type: 'string', short: 'o'}},
  // It's annoying that parseArgs defaults to boolean rather than string... So we have to explicitly define our options here...
  options: {customerId: {type: 'string'}},
  allowPositionals: true,
  strict: false,
})

if (!functions[cmd as keyof typeof functions]) {
  console.log(`Unknown command: ${cmd}`)
  process.exit(1)
}
console.log(cmd, {...options})
void functions[cmd as keyof typeof functions](options as never)
