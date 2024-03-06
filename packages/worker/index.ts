// Inngest related exports
import type {Events} from '@supaglue/events'
import {eventsMap, inngest} from '@supaglue/events'
import type {ServeHandlerOptions} from 'inngest'
import {serve} from 'inngest/next'
import * as functions from './functions'

// TODO: add metadata to functions or otherwise generate inngestFunctions from functions
// to reduce boilerplate and make it so that we don't have to manually add new functions to inngestFunctions
// and have the potential to miss new functions. May also need eslint barrel for codegen support as well.
export const inngestFunctions = [
  inngest.createFunction(
    {id: 'schedule-syncs'},
    {cron: '0 * * * *'}, // Once an hour on the hour by default
    functions.scheduleSyncs,
  ),
  inngest.createFunction(
    {id: 'sync-connection'},
    {event: 'sync.requested'},
    functions.syncConnection,
  ),
  inngest.createFunction(
    {id: 'trigger-immediate-sync'},
    {event: 'connection.created'},
    functions.triggerImmediateSync,
  ),
  // MARK: - Workaround for Inngest not having support for
  // multiple event triggers in a single function
  // @see https://discord.com/channels/842170679536517141/1214066130860118087/1214283616327180318
  ...Object.keys(eventsMap).map((name) =>
    inngest.createFunction(
      {id: `send-webhook/${name}`},
      {event: name as keyof Events},
      functions.sendWebhook,
    ),
  ),
]

export function createWorkerHandler(
  opts?: Omit<ServeHandlerOptions, 'client' | 'functions'>,
) {
  return serve({...opts, client: inngest, functions: inngestFunctions})
}

// Non-Inngest exports
export {functions as routines}
