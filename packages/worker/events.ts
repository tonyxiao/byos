import type {EventsFromOpts} from 'inngest'
import type {
  Combine,
  EventSchemas,
  ZodToStandardSchema,
} from 'inngest/components/EventSchemas'
import {z} from 'zod'
import {zErrorType} from '../vdk/errors'

const syncRequestedData = z.object({
  customer_id: z.string(),
  provider_name: z.string(),
  vertical: z.enum(['crm', 'engagement']),
  common_objects: z.array(z.string()).optional(),
  /** Not implemented yet */
  standard_objects: z.array(z.string()).optional(),
  /** Not implemented yet */
  custom_objects: z.array(z.string()).optional(),
  /** How data will be replicated from source to destination. */
  sync_mode: z
    .enum(['full', 'incremental'])
    .optional()
    .describe('Incremental by default'),
  /** e.g. postgres schema, created on demand */
  destination_schema: z.string().optional(),
  /** Override the default page sizing, will be provider default otherwise... */
  page_size: z.number().optional(),
})

export const eventsMap = {
  'sync.requested': {data: syncRequestedData},
  'sync.completed': {
    // We merge syncRequestData top level as things like sync_mode etc. can be modified during
    // the sync and it is therefore not accurate to call it request_data anymore.
    data: syncRequestedData.extend({
      request_event_id: z.string().optional(),
      run_id: z.string(),
      metrics: z.record(z.unknown()),
      result: z.enum(['SUCCESS', ...zErrorType.options]),
      error_detail: z.string().optional(),
    }),
  },
  'connection.created': {
    data: z.object({
      customer_id: z.string(),
      provider_name: z.string(),
      connection_id: z.string(),
      result: z.enum(['SUCCESS', ...zErrorType.options]),
    }),
  },
}

type BuiltInEvents = EventsFromOpts<{schemas: EventSchemas; id: never}>

export type Events = Combine<
  BuiltInEvents,
  ZodToStandardSchema<typeof eventsMap>
>
