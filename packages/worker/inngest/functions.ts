import {eventsMap, type Events} from '@supaglue/events'
import * as routines from '../routines'
import {inngest} from './client'

export const functions = [
  inngest.createFunction(
    {id: 'schedule-syncs'},
    {cron: '0 * * * *'}, // Once an hour on the hour by default
    routines.scheduleSyncs,
  ),
  inngest.createFunction(
    {id: 'sync-connection'},
    {event: 'sync.requested'},
    routines.syncConnection,
  ),
  // MARK: - Workaround for Inngest not having support for
  // multiple event triggers in a single function
  ...Object.keys(eventsMap).map((name) =>
    inngest.createFunction(
      {id: `send-webhook/${name}`},
      {event: name as keyof Events},
      routines.sendWebhook,
    ),
  ),
]
