import cookie from 'cookie'
import {z} from 'zod'

const zCookie = z.object({
  return_url: z.string().optional(),
  state: z.string().optional(),
})

function fromNangoProviderConfigKey(provider: string) {
  return provider.replace(/^ccfg_/, '')
}

function fromNangoConnectionId(connectionId: string) {
  return connectionId.replace(/^cus_/, '')
}

export async function GET(req: Request) {
  const reqUrl = new URL(req.url)

  const cookies = cookie.parse(req.headers.get('cookie') ?? '')
  const cookieKey = reqUrl.searchParams.get('state') // nango state uuid
  const cookieValue = cookies[`state-${cookieKey}`]
  const initParams = zCookie.parse(JSON.parse(cookieValue))

  const nangoCallbackUrl = new URL('https://api.nango.dev/oauth/callback')
  reqUrl.searchParams.forEach((value, key) => {
    nangoCallbackUrl.searchParams.append(key, value)
  })

  const event = await fetch(nangoCallbackUrl, {redirect: 'manual'})
    .then((res) => res.text())
    .then(parseNangoOauthCallbackPage)

  const returnUrl = initParams.return_url
    ? new URL(initParams.return_url)
    : null

  const returnParams = {
    result:
      event?.eventType === 'AUTHORIZATION_SUCEEDED'
        ? ('SUCCESS' as const)
        : ('ERROR' as const),
    ...(event?.eventType === 'AUTHORIZATION_SUCEEDED' && {
      customer_id: fromNangoConnectionId(event.data.connectionId),
      provider_name: fromNangoProviderConfigKey(event.data.providerConfigKey),
    }),
    ...(event?.eventType === 'AUTHORIZATION_FAILED' && {
      error_type: event.data.authErrorType,
      error_detail: event.data.authErrorDesc,
    }),
    state: initParams.state,
  }

  Object.entries(returnParams).forEach(([key, value]) => {
    if (value) {
      returnUrl?.searchParams.append(key, value)
    }
  })

  // For debugging
  return new Response(JSON.stringify({initParams, returnParams}), {
    status: returnUrl ? 307 : 200,
    headers: {
      'content-type': 'application/json',
      ...(returnUrl && {location: returnUrl.toString()}),
    },
  })
}

const zNangoOauthCallbackMessage = z.discriminatedUnion('eventType', [
  z.object({
    eventType: z.literal('AUTHORIZATION_SUCEEDED'),
    data: z.object({providerConfigKey: z.string(), connectionId: z.string()}),
  }),
  z.object({
    eventType: z.literal('AUTHORIZATION_FAILED'),
    data: z.object({authErrorDesc: z.string(), authErrorType: z.string()}),
  }),
])

function parseNangoOauthCallbackPage(html: string) {
  const parseStrVar = (name: string) =>
    html
      .match(new RegExp(`${name.replace('.', '.')} = (?:'|\`|")(.*)`))?.[1]
      ?.replace(/('|`|");?$/, '')

  const eventType = parseStrVar('message.eventType')

  const authErrorType = parseStrVar('window.authErrorType')
  const authErrorDesc = parseStrVar('window.authErrorDesc')

  const providerConfigKey = parseStrVar('window.providerConfigKey')
  const connectionId = parseStrVar('window.connectionId')

  const res = zNangoOauthCallbackMessage.safeParse({
    eventType,
    data: {providerConfigKey, connectionId, authErrorDesc, authErrorType},
  })
  return res.success ? res.data : undefined
}
