import {getServerUrl} from '@supaglue/api'
import {nangoAuthCreateInitHandler} from '@supaglue/mgmt'
import {env} from '@/env'

export const GET = nangoAuthCreateInitHandler({
  env: {NEXT_PUBLIC_NANGO_PUBLIC_KEY: env.NEXT_PUBLIC_NANGO_PUBLIC_KEY!},
  getServerUrl: (req) => getServerUrl({req, env}),
})
