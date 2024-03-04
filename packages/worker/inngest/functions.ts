import type {Events} from '../events'
import * as routines from '../routines'
import {inngest} from './client'

export const scheduleSyncs = inngest.createFunction(
  {id: 'schedule-syncs'},
  {cron: '0 * * * *'}, // Once an hour on the hour by default
  routines.scheduleSyncs,
)

export const syncConnection = inngest.createFunction(
  {id: 'sync-connection'},
  {event: 'sync.requested'},
  routines.syncConnection,
)

// MARK: - Workaround for not having support for
function webhookFunctionForEvent<T extends keyof Events>(name: T) {
  return inngest.createFunction(
    {id: `send-webhook/${event}`},
    {event: name},
    routines.sendWebhook,
  )
}

export const sendWebhookSyncRequested =
  webhookFunctionForEvent('sync.requested')

export const sendWebhookSyncCompleted =
  webhookFunctionForEvent('sync.completed')

export const sendWebhookConnectionCreated =
  webhookFunctionForEvent('connection.created')
