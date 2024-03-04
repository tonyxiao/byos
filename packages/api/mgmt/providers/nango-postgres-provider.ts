import {db as _db, dbUpsert, eq, schema, sql} from '@supaglue/db'
import {BadRequestError} from '@supaglue/vdk'
import {TRPCError} from '@trpc/server'
import type {NangoSDK} from '@opensdks/sdk-nango'
import {initNangoSDK} from '@opensdks/sdk-nango'
import {models, type MgmtProvider} from '../mgmtRouter'

export async function getCustomerOrFail(db: typeof _db, id: string) {
  const cus = await db.query.customer.findFirst({
    where: eq(schema.customer.id, id),
  })
  if (!cus) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Customer not found even after upsert. id: ${id}`,
    })
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
      .then((r) => r.data.configs.map(models.fromNangoConnection)),
  // Maybe having a way to specify required methods could be nice for providers
} satisfies MgmtProvider<{nango: NangoSDK; db: typeof _db}>
