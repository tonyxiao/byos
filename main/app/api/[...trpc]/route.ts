import {createAppHandler} from '@supaglue/api'

const handler = createAppHandler({endpoint: '/api'})

export {
  handler as DELETE,
  handler as GET,
  handler as HEAD,
  handler as OPTIONS,
  handler as PATCH,
  handler as POST,
  handler as PUT,
}
