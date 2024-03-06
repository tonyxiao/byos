import {getServerUrl} from '@supaglue/api'
import {nangoAuthCreateInitHandler} from '@supaglue/mgmt'

export const GET = nangoAuthCreateInitHandler({
  getServerUrl: (req) => getServerUrl({req}),
})
