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
