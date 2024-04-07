import {
  STATE_COMMIT,
  type SourceConnector,
  type SyncMessage,
} from '@openint/sync'
import {createAppHandler} from '@supaglue/api'
import {initByosSDK} from '@supaglue/sdk'
import {from, mergeMap} from 'rxjs'
import {z} from '@opensdks/util-zod'

const zConfig = z.object({
  // resource_id: z.string(),
  customer_id: z.string(),
  provider_name: z.string(),
  vertical: z.enum(['crm', 'engagement']),

  // api-key or nango secret key right now, but can also be bearer token.
  access_token: z.string(),
  /** Override the default page sizing, will be provider default otherwise... */
  page_size: z.number().optional(),
})

type Config = z.infer<typeof zConfig>

export const sourceUnifiedApi = {
  read(config, catalog, state) {
    const byos = initByosSDK({
      headers: {
        'x-api-key': config.access_token,
        'x-nango-secret-key': config.access_token,
        'x-customer-id': config.customer_id,
        'x-provider-name': config.provider_name,
      },
      // Bypass the normal fetch link http round-tripping back to our server and handle the BYOS request directly!
      // Though we are losing the ability to debug using Proxyman and others... So maybe make this configurable in
      // development
      links: [createAppHandler()],
    })

    async function* iterateRecords() {
      for (const stream of catalog.streams) {
        const sState = state[stream.stream.name] ?? {}
        yield* iterateRecordsInStream(stream.stream.name, sState)
      }
    }

    async function* iterateRecordsInStream(
      stream: string,
      /** stream state */
      sState: {cursor?: string | null},
    ) {
      const res = await byos.GET(
        `/${config.vertical}/v2/${stream}` as '/crm/v2/contact',
        {params: {query: {cursor: sState.cursor, page_size: config.page_size}}},
      )
      const emitted_at = Date.now() / 1000
      yield res.data.items.map(
        (data): SyncMessage => ({
          type: 'RECORD',
          record: {data, emitted_at, stream},
        }),
      )
    }

    return from(iterateRecords()).pipe(
      mergeMap((msgs) => from([...msgs, STATE_COMMIT])),
    )
  },
} satisfies SourceConnector<Config, Record<string, unknown>>

export default sourceUnifiedApi
