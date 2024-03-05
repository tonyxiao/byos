import {createWorkerHandler} from '@supaglue/worker'

// https://vercel.com/docs/functions/configuring-functions/duration
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 300 // Pro lan maximum, todo: make me configurable via env var

export const {GET, POST, PUT} = createWorkerHandler()
