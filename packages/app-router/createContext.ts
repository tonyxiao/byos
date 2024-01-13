import type {RouterContext} from '@supaglue/vdk'
import {
  apolloProvider,
  outreachProvider,
  salesloftProvider,
} from '@supaglue/vertical-sales-engagement'

const providerByName = {
  apollo: apolloProvider,
  salesloft: salesloftProvider,
  outreach: outreachProvider,
}

export function createContext(opts: {headers: Headers}): RouterContext {
  return {
    headers: opts.headers,
    providerByName,
    nangoSecretKey: process.env['NANGO_SECRET_KEY']!,
  }
}