/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {parseArgs} from 'node:util'
import {and, db, desc, eq, pgClient, schema} from '@supaglue/db'
import type {Events} from './events'
import * as routines from './routines'

/** Mimic subset of Inngest StepTools UI */
const step: routines.RoutineInput<never>['step'] = {
  run: (_, fn) => fn(),
  // eslint-disable-next-line @typescript-eslint/require-await
  sendEvent: async (stepId, events) => {
    console.log('NOOP: [sendEvent]', stepId, JSON.stringify(events, null, 2))
  },
}

const {
  positionals: [cmd],
} = parseArgs({
  // options: {output: {type: 'string', short: 'o'}},
  allowPositionals: true,
})

switch (cmd) {
  case 'scheduleSyncs':
    void routines
      .scheduleSyncs({event: {data: {} as never}, step})
      .finally(() => pgClient.end())
    break
  case 'syncConnection':
    void routines
      .syncConnection({
        event: {
          data: {
            // customer_id: 'outreach1', provider_name: 'outreach'
            customer_id: process.env['CUSTOMER_ID']!,
            provider_name: process.env['PROVIDER_NAME']!,
            vertical: process.env['VERTICAL']! as 'crm',
            common_objects: process.env['COMMON_OBJECT']
              ? [process.env['COMMON_OBJECT']]
              : ['account', 'contact', 'opportunity', 'lead', 'user'],
            sync_mode: process.env['SYNC_MODE']! as 'incremental',
            destination_schema: process.env['DESTINATION_SCHEMA'],
          },
        },
        step,
      })
      .finally(() => pgClient.end())
    break
  case 'backfill':
    void runBackfill().finally(() => pgClient.end())
    break
  default:
    console.error('Unknown command', cmd)
    process.exit(1)
}

async function runBackfill() {
  const syncEvents: Array<Events['connection/sync']> = []
  await routines.scheduleSyncs({
    event: {data: {} as never},
    step: {
      ...step,
      sendEvent(_stepId, events) {
        syncEvents.push(...(Array.isArray(events) ? events : [events]))
        return Promise.resolve()
      },
    },
  })
  let i = 0
  for (const event of syncEvents) {
    i++
    const lastRun = await db.query.sync_run.findFirst({
      where: and(
        eq(schema.sync_run.customer_id, event.data.customer_id),
        eq(schema.sync_run.provider_name, event.data.provider_name),
      ),
      orderBy: desc(schema.sync_run.started_at),
    })
    // Should we handle timeout and other things?
    console.log('Backfill', i, 'of', syncEvents.length, event.data)
    if (lastRun?.status === 'SUCCESS' || lastRun?.status === 'USER_ERROR') {
      console.log(
        'Skipping backfill',
        i,
        'last run status',
        lastRun.status,
        event.data,
      )
      continue
    }
    await routines.syncConnection({
      event: {
        ...event,
        data: {
          ...event.data,
          ...(process.env['SYNC_MODE'] && {
            sync_mode: process.env['SYNC_MODE']! as 'incremental',
          }),
          ...(process.env['DESTINATION_SCHEMA'] && {
            destination_schema: process.env[
              'DESTINATION_SCHEMA'
            ]! as 'incremental',
          }),
        },
      },
      step,
    })
  }
}
