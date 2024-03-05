import {getServerUrl} from '@supaglue/api'
import cookie from 'cookie'
import {redirect} from 'next/navigation'
import {z} from 'zod'
import {env} from '@/env'

const zParams = z.object({
  customer_id: z.string(),
  provider_name: z.string(),
  scope: z.string().optional(),
  return_url: z.string().optional(),
  state: z.string().optional(),
  // we don't need application_id here for now
})

const zCookie = zParams.pick({state: true, return_url: true})

// TODO: Dedupe me
function toNangoProviderConfigKey(provider: string) {
  return `ccfg_${provider}`
}

function toNangoConnectionId(customerId: string) {
  return `cus_${customerId}`
}

export async function GET(req: Request) {
  const reqUrl = new URL(req.url)
  const params = zParams.parse(
    Object.fromEntries(reqUrl.searchParams.entries()),
  )

  // TODO: put this into sdk-nango
  const nangoConnectUrl = new URL(
    `https://api.nango.dev/oauth/connect/${toNangoProviderConfigKey(
      params.provider_name,
    )}`,
  )
  nangoConnectUrl.searchParams.set(
    'connection_id',
    toNangoConnectionId(params.customer_id),
  )
  nangoConnectUrl.searchParams.set(
    'public_key',
    env.NEXT_PUBLIC_NANGO_PUBLIC_KEY!,
  )

  const res = await fetch(nangoConnectUrl, {redirect: 'manual'})
  const location = res.headers.get('location')
  if (res.status !== 302 || !location) {
    throw new Error('Missing redirect from nango /oauth/connect response')
  }

  const oauthUrl = new URL(location)
  const redirectUri = new URL(
    '/connect/callback',
    getServerUrl({req, env}),
  ).toString()

  if (oauthUrl.searchParams.get('redirect_uri') !== redirectUri) {
    // redirect_uri is needed when exchanging code later. Nango needs to know the right value otherwise code exchange will fail during callback
    throw new Error(
      `Please set your callback url to ${redirectUri} in your nango project settings`,
    )
  }
  // Override default scope set by Nango
  if (params.scope) {
    oauthUrl.searchParams.set('scope', params.scope)
  }
  // Persist state for later retrieval
  const cookieKey = oauthUrl.searchParams.get('state') // nango state uuid
  const cookieValue = JSON.stringify({
    return_url: params.return_url,
    state: params.state,
  } as z.infer<typeof zCookie>)

  return new Response(null, {
    status: 307, // temp redirect
    headers: {
      location: oauthUrl.toString(),
      // For whatever reason cookie is visible on /connect/* but not on / root page
      'set-cookie': cookie.serialize(`state-${cookieKey}`, cookieValue),
    },
  })
}
