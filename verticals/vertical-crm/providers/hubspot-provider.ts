import type {BaseRecord} from '@supaglue/vdk'
import {LastUpdatedAtNextOffset, mapper, uniqBy, z, zCast} from '@supaglue/vdk'
import {LRUCache} from 'lru-cache'
import * as RM from 'remeda'
import type {Oas_crm_contacts, Oas_crm_owners} from '@opensdks/sdk-hubspot'
import {initHubspotSDK, type HubspotSDK} from '@opensdks/sdk-hubspot'
import type {CRMProvider} from '../router'
import {commonModels} from '../router'

export type SimplePublicObject =
  Oas_crm_contacts['components']['schemas']['SimplePublicObject']
export type Owner = Oas_crm_owners['components']['schemas']['PublicOwner']

//   // In certain cases, Hubspot cannot determine the object type based on just the name for custom objects,
//   // so we need to get the ID.
//  const getObjectTypeIdFromNameOrId = async(nameOrId: string): Promise<string> => {
//     // Standard objects can be referred by name no problem
//     if (isStandardObjectType(nameOrId)) {
//       return nameOrId;
//     }
//     if (this.#isAlreadyObjectTypeId(nameOrId)) {
//       return nameOrId;
//     }
//     await this.maybeRefreshAccessToken();
//     const schemas = await this.#client.crm.schemas.coreApi.getAll();
//     const schemaId = schemas.results.find((schema) => schema.name === nameOrId || schema.objectTypeId === nameOrId)
//       ?.objectTypeId;
//     if (!schemaId) {
//       throw new NotFoundError(`Could not find custom object schema with name or id ${nameOrId}`);
//     }
//     return schemaId;
//   }

export const HUBSPOT_STANDARD_OBJECTS = [
  'company',
  'contact',
  'deal',
  'line_item',
  'product',
  'ticket',
  'quote',
  'call',
  'communication',
  'email',
  'meeting',
  'note',
  'postal_mail',
  'task',
] as const

const HSBase = z.object({
  id: z.string(),
  properties: z
    .object({
      hs_object_id: z.string(),
      createdate: z.string().optional(),
      lastmodifieddate: z.string().optional(),
    })
    .passthrough(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean(),
})
const HSContact = z.object({
  id: z.string(),
  properties: z
    .object({
      hs_object_id: z.string(),
      createdate: z.string().nullish(),
      lastmodifieddate: z.string(),
      // properties specific to contacts below...
      email: z.string().nullish(),
      firstname: z.string().nullish(),
      lastname: z.string().nullish(),
    })
    .passthrough(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean(),
})
const HSDeal = z.object({
  id: z.string(),
  properties: z
    .object({
      hs_object_id: z.string(),
      createdate: z.string().nullish(),
      lastmodifieddate: z.string().nullish(),
      // properties specific to opportunities below...
      dealname: z.string().nullish(),
      hubspot_owner_id: z.string().nullish(),
      notes_last_updated: z.string().nullish(), // Assuming lastActivityAt is a string in HubSpot format
      dealstage: z.string().nullish(),
      pipeline: z.string().nullish(),
      closedate: z.string().nullish(), // Assuming closeDate is a string in HubSpot format
      description: z.string().nullish(),
      amount: z.string().nullish(),
      hs_is_closed_won: z.string().nullish(),
      hs_is_closed: z.string().nullish(),

      // account_id: z.string().nullish(),
      // status: z.string().nullish(),
      is_deleted: z.boolean().nullish(), // Does this exist?
      archivedAt: z.string().nullish(), // Does this exist?
    })
    .passthrough(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean(),
  /** toObjectType => toObjectId[] */
  '#associations': z
    .record(z.enum(['company']), z.array(z.string()))
    .optional(),
  '#pipelineStageMapping': zCast<PipelineStageMapping>(),
})
const HSAccount = z.object({
  id: z.string(),
  properties: z
    .object({
      hs_object_id: z.string(),
      createdate: z.string().nullish(),
      lastmodifieddate: z.string().nullish(),
      name: z.string().nullish(),
      description: z.string().nullish(),
      hubspot_owner_id: z.string().nullish(),
      industry: z.string().nullish(),
      website: z.string().nullish(),
      numberofemployees: z.string().nullish(),
      addresses: z.string().nullish(), // Assuming addresses is a string; adjust the type if needed
      phonenumbers: z.string().nullish(), // Assuming phonenumbers is a string; adjust the type if needed
      lifecyclestage: z.string().nullish(),
      notes_last_updated: z.string().nullish(),
    })
    .passthrough(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean(),
})

const propertiesToFetch = {
  account: [
    'Id',
    'Name',
    'Type',
    'ParentId',
    'BillingAddress',
    'ShippingAddress',
    'Phone',
    'Fax',
    'Website',
    'Industry',
    'NumberOfEmployees',
    'OwnerId',
    'CreatedDate',
    'LastModifiedDate',
  ],
  company: [
    'hubspot_owner_id',
    'description',
    'industry',
    'website',
    'domain',
    'hs_additional_domains',
    'numberofemployees',
    'address',
    'address2',
    'city',
    'state',
    'country',
    'zip',
    'phone',
    'notes_last_updated',
    'lifecyclestage',
    'createddate',
  ],
  contact: [
    'address', // TODO: IP state/zip/country?
    'address2',
    'city',
    'country',
    'email',
    'fax',
    'firstname',
    'hs_createdate', // TODO: Use this or createdate?
    'hs_is_contact', // TODO: distinguish from "visitor"?
    'hubspot_owner_id',
    'lifecyclestage',
    'lastname',
    'mobilephone',
    'phone',
    'state',
    'work_email',
    'zip',
  ],
  deal: [
    'dealname',
    'description',
    'amount',
    'hubspot_owner_id',
    'notes_last_updated',
    'closedate',
    'dealstage',
    'pipeline',
    'hs_is_closed_won',
    'hs_is_closed',
  ],
}

const mappers = {
  account: mapper(HSAccount, commonModels.account, {
    id: 'id',
    name: 'properties.name',
    updated_at: (record) => new Date(record.updatedAt).toISOString(),
    is_deleted: (record) => !!record.archived,
    website: 'properties.website',
    industry: 'properties.industry',
    number_of_employees: (record) =>
      record.properties.numberofemployees
        ? Number.parseInt(record.properties.numberofemployees, 10)
        : null,
    owner_id: 'properties.hubspot_owner_id',
    created_at: (record) => new Date(record.createdAt).toISOString(),
  }),
  contact: mapper(HSContact, commonModels.contact, {
    id: 'id',
    first_name: 'properties.firstname',
    last_name: 'properties.lastname',
    updated_at: (record) => new Date(record.updatedAt).toISOString(),
  }),
  opportunity: mapper(HSDeal, commonModels.opportunity, {
    id: 'id',
    name: 'properties.dealname',
    description: 'properties.description',
    owner_id: 'properties.hubspot_owner_id',
    status: (record) =>
      record.properties.hs_is_closed_won
        ? 'WON'
        : record.properties.hs_is_closed
          ? 'LOST'
          : 'OPEN',
    stage: (r) =>
      r['#pipelineStageMapping'][r.properties.pipeline ?? '']?.stageLabelById?.[
        r.properties.dealstage ?? ''
      ],
    account_id: (r) => r['#associations']?.company?.[0],
    close_date: 'properties.closedate',
    amount: (record) =>
      record.properties.amount
        ? Number.parseFloat(record.properties.amount)
        : null,
    last_activity_at: 'properties.notes_last_updated',
    created_at: 'properties.createdate',
    // TODO: take into account archivedAt if needed
    updated_at: (record) => new Date(record.updatedAt).toISOString(),
    last_modified_at: (record) => new Date(record.updatedAt).toISOString(),
  }),
  lead: mapper(HSBase, commonModels.lead, {
    id: 'id',
    updated_at: (record) => new Date(record.updatedAt).toISOString(),
  }),
  user: mapper(zCast<Owner>(), commonModels.user, {
    id: 'id',
    updated_at: 'updatedAt',
    created_at: 'createdAt',
    last_modified_at: 'updatedAt',
    name: (o) => [o.firstName, o.lastName].filter((n) => !!n?.trim()).join(' '),
    email: 'email',
    is_active: (record) => !record.archived, // Assuming archived is a boolean
    is_deleted: (record) => !!record.archived, // Assuming archived is a boolean
  }),
}

const _listEntityIncrementalThenMap = async <TIn, TOut extends BaseRecord>(
  instance: HubspotSDK,
  {
    objectType,
    fields,
    ...opts
  }: {
    objectType: string
    fields: string[]
    /** Will use the properties endpoint to fetch all available fields */
    includeAllFields?: boolean
    associations?: string[]
    mapper: {parse: (rawData: unknown) => TOut; _in: TIn}
    page_size?: number
    cursor?: string | null
    // For caching prupose only really...
    ctx: {customerId: string}
  },
) => {
  const limit = opts?.page_size ?? 100
  const cursor = LastUpdatedAtNextOffset.fromCursor(opts?.cursor)
  const kUpdatedAt =
    objectType === 'contacts' ? 'lastmodifieddate' : 'hs_lastmodifieddate'
  // We may want to consider using the list rather than search endpoint for this stuff...

  const res = await instance[`crm_${objectType as 'contacts'}`].POST(
    `/crm/v3/objects/${objectType as 'contacts'}/search`,
    {
      body: {
        properties: Array.from(
          new Set([
            'hs_object_id',
            'createdate',
            'lastmodifieddate',
            'hs_lastmodifieddate',
            'name',
            ...fields,
            ...(opts.includeAllFields
              ? await cachedGetObjectProperties(instance, {
                  customerId: opts.ctx.customerId,
                  objectType,
                })
              : []),
          ]),
        ),
        filterGroups: cursor?.last_updated_at
          ? [
              {
                filters: [
                  {
                    propertyName: kUpdatedAt,
                    operator: 'GTE',
                    value: cursor?.last_updated_at,
                  },
                ],
              },
            ]
          : [],
        after: cursor?.next_offset ?? '',
        sorts: [
          {
            propertyName: kUpdatedAt,
            direction: 'ASCENDING',
          },
          // Cannot sort by multiple values unfortunately...
          // {
          //   propertyName: 'hs_object_id',
          //   direction: 'ASCENDING',
          // },
        ] as unknown as string[],
        limit,
      },
    },
  )

  const batchedAssociations = await Promise.all(
    (opts.associations ?? []).map(async (associatedType) => {
      const toObjectIdsByFromObjectId = await _batchListAssociations(instance, {
        fromObjectIds: res.data.results.map((r) => r.id),
        fromObjectType: objectType,
        toObjectType: associatedType,
      })
      return [associatedType, toObjectIdsByFromObjectId] as const
    }),
  )
  // console.log('associations:', batchedAssociations)
  const pipelineStageMapping =
    objectType === 'deals'
      ? await cachedGetPipelineStageMapping(instance, opts.ctx)
      : undefined

  const resultsExtended = res.data.results.map((rawData) => {
    const currentAssociations = Object.fromEntries(
      batchedAssociations.map(([associatedType, toObjectIdsByFromObjectId]) => {
        const toIds = toObjectIdsByFromObjectId[rawData.id] ?? []
        return [associatedType, toIds]
      }),
    ) satisfies z.infer<typeof HSDeal>['#associations']
    // console.log('currentAssociations:', currentAssociations)

    return {
      ...rawData,
      '#associations': currentAssociations,
      '#pipelineStageMapping': pipelineStageMapping,
    }
  })

  const items = resultsExtended.map(opts.mapper.parse)
  const lastItem = items[items.length - 1]
  return {
    items,
    // Not the same as simply items.length === 0
    has_next_page: !!res.data.paging?.next?.after,
    next_cursor:
      (lastItem
        ? LastUpdatedAtNextOffset.toCursor({
            last_updated_at: lastItem.updated_at,
            next_offset:
              // offset / offset-like cursor is only usable if the filtering criteria doesn't change, notably the last_updated_at timestamp
              // in practice this means that we only care about `after` offset when we have more than `limit` number of items modified at the exact
              // same timestamp
              lastItem.updated_at === cursor?.last_updated_at
                ? res.data.paging?.next?.after
                : undefined,
          })
        : opts?.cursor) ?? null,
  }
}

// TODO: implement this when reading batch
export const _batchListAssociations = async (
  instance: HubspotSDK,
  opts: {
    fromObjectIds: string[]
    fromObjectType: string
    toObjectType: string
  },
): Promise<Record<string /*fromId*/, string[] /* toIds */>> => {
  if (!opts.fromObjectIds.length) {
    return {}
  }
  try {
    const associations = await instance.crm_associations.POST(
      '/{fromObjectType}/{toObjectType}/batch/read',
      {
        params: {
          path: {
            fromObjectType: opts.fromObjectType,
            toObjectType: opts.toObjectType,
          },
        },
        body: {inputs: opts.fromObjectIds.map((id) => ({id}))},
      },
    )
    return associations.data.results
      .map((result) => ({
        [result.from.id]: [...new Set(result.to.map(({id}) => id))],
      }))
      .reduce((acc, curr) => ({...acc, ...curr}), {})
  } catch (err) {
    console.log(err)
    throw err
  }
}

const objectPropertiesCache = new LRUCache<
  string /* {customerId}_{objectType} */,
  string[] /* {fieldName}[] */
>({
  ttl: 1000 * 60 * 5,
  ttlAutopurge: false,
  max: 100,
})

const cachedGetObjectProperties = async (
  instance: HubspotSDK,
  opts: {customerId: string; objectType: string},
) => {
  const cacheKey = `${opts.customerId}_${opts.objectType}`
  const cached = objectPropertiesCache.get(cacheKey)
  if (cached) {
    console.log(
      '[hubspot] Using cached available fields for objectType:',
      opts.objectType,
    )
    return cached
  }
  const fields = await instance.crm_properties
    .GET('/crm/v3/properties/{objectType}', {
      params: {path: {objectType: opts.objectType}},
    })
    .then((r) => r.data.results.map((obj) => obj.name))
  objectPropertiesCache.set(cacheKey, fields)
  return fields
}

const pipelineStageMappingCache = new LRUCache<
  string /* {customerId} */,
  PipelineStageMapping
>({
  ttl: 1000 * 60 * 5,
  ttlAutopurge: false,
  max: 100,
})

// TODO: Introduce a proper caching fetchLink based on customerId that can be backed by
// memory cache or redis cache... For now we are just gonna hack around by passing the customerId context around...
const cachedGetPipelineStageMapping = async (
  instance: HubspotSDK,
  opts: {customerId: string},
): ReturnType<typeof _getPipelineStageMapping> => {
  const cached = pipelineStageMappingCache.get(opts.customerId)
  if (cached) {
    console.log(
      '[hubspot] Using cached pipeline stage mapping for customerId:',
      opts.customerId,
    )
    return cached
  }
  const res = await _getPipelineStageMapping(instance)
  pipelineStageMappingCache.set(opts.customerId, res)
  return res
}

type PipelineStageMapping = Awaited<ReturnType<typeof _getPipelineStageMapping>>
const _getPipelineStageMapping = async (instance: HubspotSDK) => {
  const res = await instance.crm_pipelines.GET(
    '/crm/v3/pipelines/{objectType}',
    {params: {path: {objectType: 'deals'}}},
  )
  return RM.mapToObj(res.data.results, (result) => [
    result.id,
    {
      label: result.label,
      stageLabelById: RM.mapToObj(result.stages, (stage) => [
        stage.id,
        stage.label,
      ]),
    },
  ])
}

const _listEntityFullThenMap = async <TIn, TOut extends BaseRecord>(
  instance: HubspotSDK,
  {
    entity,
    ...opts
  }: {
    entity: string
    mapper: {parse: (rawData: unknown) => TOut; _in: TIn}
    page_size?: number
    cursor?: string | null
  },
) => {
  const res = await instance[`crm_${entity as 'owners'}`].GET(
    `/crm/v3/${entity as 'owners'}/`,
    {
      params: {
        query: {
          after: opts?.cursor ?? undefined,
          limit: opts?.page_size ?? 100,
        },
      },
    },
  )
  return {
    items: res.data.results.map(opts.mapper.parse),
    has_next_page: !!res.data.paging?.next?.after,
    // This would reset the sync and loop back from the beginning, except
    // the has_next_page check prevents that
    next_cursor: res.data.paging?.next?.after,
  }
}

export const hubspotProvider = {
  __init__: ({proxyLinks}) =>
    initHubspotSDK({
      headers: {authorization: 'Bearer ...'}, // This will be populated by Nango, or you can populate your own...
      links: (defaultLinks) => [...proxyLinks, ...defaultLinks],
    }),
  listContacts: async ({instance, input, ctx}) =>
    _listEntityIncrementalThenMap(instance, {
      ...input,
      objectType: 'contacts',
      mapper: mappers.contact,
      fields: propertiesToFetch.contact,
      includeAllFields: true,
      ctx,
    }),
  listAccounts: async ({instance, input, ctx}) =>
    _listEntityIncrementalThenMap(instance, {
      ...input,
      objectType: 'companies',
      mapper: mappers.account,
      fields: propertiesToFetch.account,
      includeAllFields: true,
      ctx,
    }),
  listOpportunities: async ({instance, input, ctx}) =>
    _listEntityIncrementalThenMap(instance, {
      ...input,
      objectType: 'deals',
      mapper: mappers.opportunity,
      fields: propertiesToFetch.deal,
      includeAllFields: true,
      associations: ['company'],
      ctx,
    }),
  // Original supaglue never implemented this, TODO: handle me...
  // listLeads: async ({instance, input, ctx}) =>
  //   _listEntityThenMap(instance, {
  //     ...input,
  //     entity: 'leads',
  //     mapper: mappers.lead,
  //     fields: [],
  //   }),
  // Owners does not have a search API... so we have to do a full sync every time
  listUsers: async ({instance, input}) =>
    _listEntityFullThenMap(instance, {
      entity: 'owners',
      mapper: mappers.user,
      page_size: input?.page_size,
      cursor: input?.cursor,
    }),
  metadataListObjects: async ({instance, input}) =>
    uniqBy(
      [
        ...(!input.type || input.type === 'standard'
          ? HUBSPOT_STANDARD_OBJECTS.map((obj) => ({id: obj, name: obj}))
          : []),
        ...(!input.type || input.type === 'custom'
          ? await instance.crm_schemas
              .GET('/crm/v3/schemas')
              .then((res) =>
                res.data.results.map((obj) => ({id: obj.id, name: obj.name})),
              )
          : []),
      ],
      (o) => o.id,
    ),
  metadataListObjectProperties: async ({instance, input}) => {
    const res = await instance.crm_properties.GET(
      '/crm/v3/properties/{objectType}',
      {params: {path: {objectType: input.object_name}}},
    )
    return res.data.results.map((obj) => ({
      id: obj.name,
      label: obj.label,
      type: obj.type,
    }))
  },
  // metadataCreateObjectsSchema: async ({instance, input}) => {
  //   const res = await instance.crm_schemas.POST('/crm/v3/schemas', {
  //     body: {
  //       name: input.name,
  //       labels: input.label.singular,
  //       description: input.description || '',
  //       properties: input.fields.map((p) => ({
  //         type: p.type || 'string',
  //         label: p.label,
  //         name: p.label,
  //         fieldType: p.type || 'string',
  //       })),
  //       primaryFieldId: input.primaryFieldId,
  //     },
  //   })
  //   console.log('input:', input)
  //   // console.log('res:', res)
  //   return [{id: '123', name: input.name}]
  // },
  // metadataCreateAssociation: async ({instance, input}) => {
  //   const res = await instance.crm_associations.POST(
  //     '/crm/v3/associations/{fromObjectType}/{toObjectType}/batch/create',
  //     {
  //       params: {
  //         path: {
  //           fromObjectType: input.sourceObject,
  //           toObjectType: input.targetObject,
  //         },
  //       },
  //       body: {
  //         inputs: [
  //           {
  //             from: {id: input.sourceObject},
  //             to: {id: input.targetObject},
  //             type: `${input.sourceObject}_${input.targetObject}`,
  //           },
  //         ],
  //       },
  //     },
  //   )
  //   return res.data
  // },
} satisfies CRMProvider<HubspotSDK>
