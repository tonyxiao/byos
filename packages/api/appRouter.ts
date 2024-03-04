import {generateOpenApiDocument} from '@lilyrose2798/trpc-openapi'
import {
  ZodOpenApiComponentsObject,
  ZodOpenApiPathsObject,
} from '@lilyrose2798/trpc-openapi/dist/generator'
import {mapKeys, mapValues, publicProcedure, trpc, z} from '@supaglue/vdk'
import {crmRouter} from '@supaglue/vertical-crm'
import {salesEngagementRouter} from '@supaglue/vertical-sales-engagement'
import {eventsMap} from '../worker/events'
import {mgmtRouter} from './mgmtRouter'

const publicRouter = trpc.router({
  health: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/health',
        summary: 'Health check',
      },
    })
    .input(z.void())
    .output(z.string())
    .query(() => 'Ok as of ' + new Date().toISOString()),
  getOpenAPISpec: publicProcedure
    .meta({openapi: {method: 'GET', path: '/openapi.json'}})
    .input(z.void())
    .output(z.unknown())
    .query((): unknown => getOpenAPISpec()),
})

export const appRouter = trpc.router({
  public: publicRouter,
  mgmt: mgmtRouter,
  salesEngagement: salesEngagementRouter,
  crm: crmRouter,
})

export function oasWebhooksEventsMap(
  eMap: Record<string, {data: z.AnyZodObject}>,
) {
  const webhooks = mapValues(
    eMap,
    (_, name): ZodOpenApiPathsObject[string] => ({
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: {$ref: `#/components/schemas/webhooks.${name}`},
            },
          },
        },
        responses: {},
      },
    }),
  )
  type Schemas = NonNullable<ZodOpenApiComponentsObject['schemas']>
  const components = {
    schemas: mapKeys(
      mapValues(eMap, (shape, name): Schemas[string] =>
        z.object({...shape, name: z.literal(name), id: z.string().optional()}),
      ),
      (name) => `webhooks.${name}`,
    ),
  }
  return {webhooks, components}
}

export function getOpenAPISpec() {
  const {webhooks, components} = oasWebhooksEventsMap(eventsMap)
  const oas = generateOpenApiDocument(appRouter, {
    openApiVersion: '3.1.0', // Want jsonschema
    title: 'Bulid your own Supaglue',
    version: '0.0.0',
    // Can we get env passed in instead of directly using it?
    baseUrl: new URL('/api', getServerUrl({env: process.env})).toString(),
    // TODO: add the security field to specify what methods are required.
    securitySchemes: {
      apiKey: {name: 'x-api-key', type: 'apiKey', in: 'header'},
      customerId: {name: 'x-customer-id', type: 'apiKey', in: 'header'},
      providerName: {name: 'x-provider-name', type: 'apiKey', in: 'header'},
    },
    webhooks,
    components,
  })
  return oas
}

export function getServerUrl(opts: {
  req?: Request
  env?: Record<string, string | undefined>
}) {
  return (
    (typeof window !== 'undefined' &&
      `${window.location.protocol}//${window.location.host}`) ||
    (opts.req &&
      `${
        opts.req.headers.get('x-forwarded-proto') || 'http'
      }://${opts.req.headers.get('host')}`) ||
    (opts.env?.['NEXT_PUBLIC_SERVER_URL']
      ? opts.env['NEXT_PUBLIC_SERVER_URL']
      : null) ||
    (opts.env?.['VERCEL_URL'] ? 'https://' + opts.env['VERCEL_URL'] : null) ||
    `http://localhost:${
      opts.env?.['PORT'] || opts.env?.['NEXT_PUBLIC_PORT'] || 3000
    }`
  )
}

if (require.main === module) {
  console.log(JSON.stringify(getOpenAPISpec(), null, 2))
}
