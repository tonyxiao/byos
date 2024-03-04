import {eventsMap} from '@supaglue/events'
import {EventSchemas, Inngest} from 'inngest'

export const inngest = new Inngest({
  id: 'build-your-own-supaglue',
  schemas: new EventSchemas().fromZod(eventsMap),
})
