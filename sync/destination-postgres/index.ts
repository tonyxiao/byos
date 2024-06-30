import type {DestinationConnector, Link} from '@openint/sync'
import type {AirbyteRecordMessage} from '@openint/sync/protocol.schema'
import {
  dbUpsert,
  drizzle,
  getCommonObjectTable,
  postgres,
  sql,
  stripNullByte,
} from '@supaglue/db'
import {concatMap, endWith, from, ignoreElements, NEVER, of} from 'rxjs'
import {z} from '@opensdks/util-zod'

const zConfig = z.object({
  database_url: z.string(),
  customer_id: z.string(),
  provider_name: z.string(),
  supaglue_application_id: z.string(),
})

type Config = z.infer<typeof zConfig>

const sqlNow = sql`now()`

export const destinationPostgres = {
  write(config, _catalog, source) {
    const pgClient = postgres(config.database_url)
    const db = drizzle(pgClient, {logger: true})

    return source.pipe(
      cachingLink(async (cache) => {
        for (const [streamName, records] of Object.entries(cache)) {
          const table = getCommonObjectTable(streamName)
          await dbUpsert(
            db,
            table,
            records.map((r) => {
              const {raw_data, ...item} = r.data
              const id = r.data['id'] as string
              return {
                // Primary keys
                _supaglue_application_id: config.supaglue_application_id,
                _supaglue_customer_id: config.customer_id, //  '$YOUR_CUSTOMER_ID',
                _supaglue_provider_name: config.provider_name,
                id,
                // Other columns
                created_at: sqlNow,
                updated_at: sqlNow,
                _supaglue_emitted_at: sqlNow,
                last_modified_at: sqlNow, // TODO: Fix me...
                is_deleted: false,
                // Workaround jsonb support issue... https://github.com/drizzle-team/drizzle-orm/issues/724
                raw_data: sql`${stripNullByte(raw_data) ?? null}::jsonb`,
                _supaglue_unified_data: sql`${stripNullByte(item)}::jsonb`,
              }
            }),
          )
        }
      }),
    )
  },
} satisfies DestinationConnector<Config>

export default destinationPostgres

type Cache = Record<string, AirbyteRecordMessage[]>

function cachingLink(onCommit: (cache: Cache) => Promise<void>): Link {
  let cache: Cache = {}
  return concatMap((msg) => {
    if (msg.type === 'RECORD') {
      cache[msg.record.stream] = cache[msg.record.stream] ?? []
      cache[msg.record.stream]?.push(msg.record)
      return NEVER
    }
    if (msg.type === 'STATE' && msg.state.type === 'COMMIT') {
      return from(onCommit(cache).then(() => (cache = {})))
        .pipe(ignoreElements())
        .pipe(endWith(msg))
    }
    return of(msg)
  })
}
