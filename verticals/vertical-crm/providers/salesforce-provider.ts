import type {BaseRecord} from '@supaglue/vdk'
import {
  LastUpdatedAtId,
  modifyRequest,
  PLACEHOLDER_BASE_URL,
} from '@supaglue/vdk'
import * as jsforce from 'jsforce'
import type {SalesforceSDKTypes} from '@opensdks/sdk-salesforce'
import {
  initSalesforceSDK,
  type SalesforceSDK as _SalesforceSDK,
} from '@opensdks/sdk-salesforce'
import type {CRMProvider} from '../router'
import {
  SALESFORCE_API_VERSION,
  SALESFORCE_STANDARD_OBJECTS,
} from './salesforce/constants'
import {listFields, mappers} from './salesforce/mapper'
import {salesforceProviderJsForce} from './salesforce/salesforce-provider-jsforce'

export type SFDC = SalesforceSDKTypes['oas']['components']['schemas']

type SalesforceSDK = _SalesforceSDK & {
  getJsForce: () => Promise<jsforce.Connection>
}

/**
 * Hard-coded for now, to get list of available versions, visit $instanceUrl/services/data
 * TODO: Consider making this configurable by
 * 1) Exposing ConnectionConfiguration and ConnectionMetadata as part of params to __init__.
 * We don't do that today to reduce 1x roundtrip needed on every request
 * 2) Allow it to be configured on a per request basis via a `x-salesforce-api-version` header.
 * Simpler but we would be forcing the consumer to have to worry about it.
 */

/** SOQL FIELDS function must have a LIMIT of at most 200 */
export const SFDC_SOQL_MAX_LIMIT = 200

function sdkExt(instance: SalesforceSDK) {
  /** NOTE: extract these into a helper functions inside sdk-salesforce */
  const countEntity = async (entity: string) =>
    instance.query(`SELECT COUNT() FROM ${entity}`).then((r) => r.totalSize)

  const listEntity = async <T>({
    cursor,
    includeCustomFields = true,
    ...opts
  }: {
    // to-do: Make entity and fields type safe
    entity: string
    fields: string[]
    /** Default true */
    includeCustomFields?: boolean
    cursor?: {
      last_updated_at: string
      last_id: string
    }
    limit?: number
  }) => {
    const whereStatement = cursor
      ? `WHERE SystemModstamp > ${cursor.last_updated_at} OR (SystemModstamp = ${cursor.last_updated_at} AND Id > '${cursor.last_id}')`
      : ''
    const limitStatement = opts.limit != null ? `LIMIT ${opts.limit}` : ''
    const fields = Array.from(
      new Set([
        'Id',
        'SystemModstamp',
        ...opts.fields,
        ...(includeCustomFields ? ['FIELDS(CUSTOM)'] : []),
      ]),
    )
    return instance.query<T>(`
        SELECT ${fields.join(', ')}
        FROM ${opts.entity}
        ${whereStatement}
        ORDER BY SystemModstamp ASC, Id ASC
        ${limitStatement} 
      `)
  }

  return {
    countEntity,
    listEntity,
    _listEntityThenMap: async <TIn, TOut extends BaseRecord>({
      entity,
      fields,
      ...opts
    }: {
      entity: string
      fields: Array<Extract<keyof TIn, string>>
      mapper: {parse: (rawData: unknown) => TOut; _in: TIn}
      page_size?: number
      cursor?: string | null
    }) => {
      const limit = opts?.page_size ?? SFDC_SOQL_MAX_LIMIT
      const cursor = LastUpdatedAtId.fromCursor(opts?.cursor)
      const res = await listEntity<TIn>({entity, fields, cursor, limit})
      const items = res.records.map(opts.mapper.parse)
      const lastItem = items[items.length - 1]
      return {
        items,
        has_next_page: items.length > 0,
        next_cursor: lastItem
          ? LastUpdatedAtId.toCursor({
              last_id: lastItem.id,
              last_updated_at: lastItem.updated_at,
            })
          : opts?.cursor,
      }
    },
  }
}

export const salesforceProvider = {
  __init__: ({proxyLinks, getCredentials}) => {
    const sdk = initSalesforceSDK({
      baseUrl: PLACEHOLDER_BASE_URL,
      links: (defaultLinks) => [
        (req, next) =>
          next(
            modifyRequest(req, {
              url: req.url.replace(
                PLACEHOLDER_BASE_URL,
                PLACEHOLDER_BASE_URL +
                  '/services/data/v' +
                  SALESFORCE_API_VERSION,
              ),
            }),
          ),
        ...proxyLinks,
        ...defaultLinks,
      ],
    })
    // Would be nice if this method was in the salesforce-provider-jsforce file
    async function getJsForce() {
      const creds = await getCredentials()
      if (!creds.instance_url || !creds.access_token) {
        throw new Error('Missing instance_url or access_token')
      }
      const conn = new jsforce.Connection({
        instanceUrl: creds.instance_url,
        accessToken: creds.access_token,
        version: SALESFORCE_API_VERSION,
        maxRequest: 10,
      })
      return conn
    }
    return {...sdk, getJsForce} satisfies SalesforceSDK
  },
  countEntity: async ({instance, input}) => {
    // NOTE: extract this into a helper function inside sdk-salesforce
    const res = await instance.query(`SELECT COUNT() FROM ${input.entity}`)
    return {count: res.totalSize}
  },
  // MARK: - Account
  listAccounts: async ({instance, input, ctx}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Account',
      fields: listFields('account', ctx),
      mapper: mappers.account,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),
  getAccount: async ({instance, input}) => {
    const res = await instance.GET('/sobjects/Account/{id}', {
      params: {path: {id: input.id}},
    })
    return {
      record: mappers.contact.parse(res.data),
      raw: res.data,
    }
  },

  // MARK: - Contact

  listContacts: async ({instance, input, ctx}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Contact',
      fields: listFields('contact', ctx),
      mapper: mappers.contact,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),
  getContact: async ({instance, input}) => {
    const res = await instance.GET('/sobjects/Contact/{id}', {
      params: {path: {id: input.id}},
    })
    return {
      record: mappers.contact.parse(res.data),
      raw: res.data,
    }
  },

  // MARK: - Opportunity

  listOpportunities: async ({instance, input, ctx}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Opportunity',
      fields: listFields('opportunity', ctx),
      mapper: mappers.opportunity,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),

  // MARK: - Lead

  listLeads: async ({instance, input, ctx}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'Lead',
      fields: listFields('lead', ctx),
      mapper: mappers.lead,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),

  // MARK: - User

  listUsers: async ({instance, input, ctx}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: 'User',
      fields: listFields('user', ctx),
      mapper: mappers.user,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),

  listCustomObjectRecords: async ({instance, input}) =>
    sdkExt(instance)._listEntityThenMap({
      entity: input.id,
      fields: ['Name'],
      mapper: mappers.customObject,
      cursor: input?.cursor,
      page_size: input?.page_size,
    }),

  // MARK: - Metadata
  metadataListStandardObjects: () =>
    SALESFORCE_STANDARD_OBJECTS.map((name) => ({name})),

  metadataListCustomObjects: async ({instance}) => {
    const res = await instance.GET('/sobjects')
    return (res.data.sobjects ?? [])
      .filter((s) => s.custom)
      .map((s) => ({id: s.name!, name: s.name!}))
  },
  metadataListProperties: async ({instance, ...opts}) =>
    salesforceProviderJsForce.metadataListProperties({
      ...opts,
      instance: await instance.getJsForce(),
    }),
  metadataCreateCustomObjectSchema: async ({instance, ...opts}) =>
    salesforceProviderJsForce.metadataCreateCustomObjectSchema({
      ...opts,
      instance: await instance.getJsForce(),
    }),
  createCustomObjectRecord: async ({instance, ...opts}) =>
    salesforceProviderJsForce.createCustomObjectRecord({
      ...opts,
      instance: await instance.getJsForce(),
    }),
  metadataCreateAssociation: async ({instance, ...opts}) =>
    salesforceProviderJsForce.metadataCreateAssociation({
      ...opts,
      instance: await instance.getJsForce(),
    }),
} satisfies CRMProvider<SalesforceSDK>
