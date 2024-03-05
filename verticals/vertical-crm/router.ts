import type {ProviderFromRouter, RouterMeta} from '@supaglue/vdk'
import {
  proxyCallProvider,
  remoteProcedure,
  trpc,
  withWarnings,
  z,
  zPaginatedResult,
  zPaginationParams,
} from '@supaglue/vdk'
import * as unified from './unifiedModels'

export {unified}

function oapi(meta: NonNullable<RouterMeta['openapi']>): RouterMeta {
  return {openapi: {...meta, path: `/verticals/crm${meta.path}`}}
}

export const crmRouter = trpc.router({
  countEntity: remoteProcedure
    .meta(oapi({method: 'GET', path: '/{entity}/_count'}))
    .input(z.object({entity: z.string()}))
    .output(z.object({count: z.number()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  // MARK: - Account
  listAccounts: remoteProcedure
    .meta(oapi({method: 'GET', path: '/account'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.account)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  getAccount: remoteProcedure
    .meta(oapi({method: 'GET', path: '/account/{id}'}))
    .input(z.object({id: z.string()}))
    .output(z.object({record: unified.account, raw: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  // MARK: - Contact
  listContacts: remoteProcedure
    .meta(oapi({method: 'GET', path: '/contact'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.contact)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  getContact: remoteProcedure
    .meta(oapi({method: 'GET', path: '/contact/{id}'}))
    .input(z.object({id: z.string()}))
    .output(z.object({record: unified.contact, raw: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  // MARK: - Lead
  listLeads: remoteProcedure
    .meta(oapi({method: 'GET', path: '/lead'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.lead)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  getLead: remoteProcedure
    .meta(oapi({method: 'GET', path: '/lead/{id}'}))
    .input(z.object({id: z.string()}))
    .output(z.object({record: unified.lead, raw: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  // MARK: - Opportunity
  listOpportunities: remoteProcedure
    .meta(oapi({method: 'GET', path: '/opportunity'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.opportunity)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  getOpportunity: remoteProcedure
    .meta(oapi({method: 'GET', path: '/opportunity/{id}'}))
    .input(z.object({id: z.string()}))
    .output(z.object({record: unified.opportunity, raw: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  // MARK: - User
  listUsers: remoteProcedure
    .meta(oapi({method: 'GET', path: '/user'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.user)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  getUser: remoteProcedure
    .meta(oapi({method: 'GET', path: '/user/{id}'}))
    .input(z.object({id: z.string()}))
    .output(z.object({record: unified.user, raw: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  // MARK: - Custom objects
  listCustomObjectRecords: remoteProcedure
    .meta(oapi({method: 'GET', path: '/custom_objects/{object_name}'}))
    .input(
      z.object({
        object_name: z.string(),
        ...zPaginationParams.shape,
      }),
    )
    .output(zPaginatedResult.extend({items: z.array(z.unknown())}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  createCustomObjectRecord: remoteProcedure
    .meta(oapi({method: 'POST', path: '/custom_objects/{object_name}'}))
    .input(
      z.object({
        object_name: z.string(),
        record: z.record(z.unknown()),
      }),
    )
    .output(withWarnings({record: z.unknown()}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  // MARK: - Metadata
  metadataListObjects: remoteProcedure
    .meta(oapi({method: 'GET', path: '/metadata/objects'}))
    .input(z.object({type: z.enum(['standard', 'custom']).optional()}))
    .output(z.array(unified.meta_object))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  metadataCreateObject: remoteProcedure
    .meta(
      oapi({
        method: 'POST',
        path: '/metadata/objects',
        // There is no need to add `custom` to path here.
        // Whenever we are creating a new object, it is always custom.
        // Otherwise we'd have to say create_custom_assocations also
        description: 'Create custom object schema',
      }),
    )
    .input(
      z.object({
        name: z.string(),
        description: z.string().nullable(),
        labels: z.object({
          singular: z.string(),
          plural: z.string(),
        }),
        primary_field_id: z.string(),
        fields: z.array(unified.meta_custom_object_field).min(1),
      }),
    )
    // Maybe this should output meta_object_schema instead?
    .output(unified.meta_object)
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  metadataListObjectProperties: remoteProcedure
    .meta(
      oapi({method: 'GET', path: '/metadata/objects/{object_name}/properties'}),
    )
    // type: z.enum(['standard', 'custom']), // Does not seem to be needed
    .input(z.object({object_name: z.string()}))
    .output(z.array(unified.meta_property))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),

  metadataCreateAssociation: remoteProcedure
    .meta(oapi({method: 'POST', path: '/metadata/associations'}))
    .input(
      z.object({
        source_object: z.string(),
        target_object: z.string(),
        suggested_key_name: z
          .string()
          .describe(
            'The underlying provider may change this (e.g. adding `__c` for Salesforce).',
          ),
        display_name: z.string(),
      }),
    )
    .output(withWarnings({association_schema: unified.meta_association_schema}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  // Update custom object schema didn't work within Supaglue anyways...
})

export type CRMProvider<TInstance> = ProviderFromRouter<
  typeof crmRouter,
  TInstance
>
