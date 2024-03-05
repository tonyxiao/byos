import {type Events} from '@supaglue/events'
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
  inngest.createFunction(
    {id: 'send-webhook'},
    // Inngest supports it but it is not supported in the sdk
    // @see https://discord.com/channels/842170679536517141/1214066130860118087/1214283616327180318
    {event: '*' as keyof Events},
    routines.sendWebhook,
  ),
]
