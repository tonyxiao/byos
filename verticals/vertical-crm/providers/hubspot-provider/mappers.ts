import {mapper, z, zBaseRecord, zCast} from '@supaglue/vdk'
import type {Oas_crm_contacts, Oas_crm_owners} from '@opensdks/sdk-hubspot'
import type {PipelineStageMapping} from '.'
import {unified} from '../../router'

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

export const HSBase = z.object({
  id: z.string(),
  properties: z
    .object({
      hs_object_id: z.string(),
      createdate: z.string().nullish(),
      lastmodifieddate: z.string().nullish(),
      hs_lastmodifieddate: z.string().nullish(),
    })
    .passthrough(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean(),
})
export const HSContact = z.object({
  id: z.string(),
  properties: z
    .object({
      hs_object_id: z.string(),
      hs_lastmodifieddate: z.string().nullish(),
      createdate: z.string().nullish(),
      lastmodifieddate: z.string().nullish(),
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
export const HSDeal = z.object({
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
export const HSCompany = z.object({
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

export const propertiesToFetch = {
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

export const mappers = {
  companies: mapper(HSCompany, unified.account, {
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
  contacts: mapper(HSContact, unified.contact, {
    id: 'id',
    first_name: 'properties.firstname',
    last_name: 'properties.lastname',
    updated_at: (record) => new Date(record.updatedAt).toISOString(),
  }),
  opportunity: mapper(HSDeal, unified.opportunity, {
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
  lead: mapper(HSBase, unified.lead, {
    id: 'id',
    updated_at: (record) => new Date(record.updatedAt).toISOString(),
  }),
  user: mapper(zCast<Owner>(), unified.user, {
    id: 'id',
    updated_at: 'updatedAt',
    created_at: 'createdAt',
    last_modified_at: 'updatedAt',
    name: (o) => [o.firstName, o.lastName].filter((n) => !!n?.trim()).join(' '),
    email: 'email',
    is_active: (record) => !record.archived, // Assuming archived is a boolean
    is_deleted: (record) => !!record.archived, // Assuming archived is a boolean
  }),
  customObject: mapper(HSBase, zBaseRecord, {
    id: 'id',
    updated_at: 'properties.hs_lastmodifieddate',
  }),
}
const HSProperties = z.record(z.string())

// const reverse_address = mapper(unified.address, zHSProperties, {
//   address: (addr) => addr?.street_1 ?? '',
//   // TODO: Support address2 for companies only
//   city: (addr) => addr?.city ?? '',
//   state: (addr) => addr?.state ?? '',
//   zip: (addr) => addr?.postal_code ?? '',
//   country: (addr) => addr?.country ?? '',
// })

// const reverse_phone_numbers = mapper(
//   z.array(unified.phone_number),
//   zHSProperties,
//   {
//     phone: (phones) =>
//       phones.find((p) => p.phone_number_type === 'primary')?.phone_number ?? '',
//     mobilephone: (phones) =>
//       phones.find((p) => p.phone_number_type === 'mobile')?.phone_number ?? '',
//     fax: (phones) =>
//       phones.find((p) => p.phone_number_type === 'fax')?.phone_number ?? '',
//   },
// )

/** destinations mappers */
export const reverseMappers = {
  companies_input: mapper(unified.account_input, HSProperties, (input) =>
    removeUndefinedValues({
      // We will remove undefined values later... Though it's arguable this is stil the right approach
      // for mapping when it got so complicated
      name: nullToEmptyString(input.name),
      industry: nullToEmptyString(input.industry),
      description: nullToEmptyString(input.description),
      website: nullToEmptyString(input.website),
      numberofemployees: nullToEmptyString(
        input.number_of_employees?.toString(),
      ),
      lifecyclestage: nullToEmptyString(input.lifecycle_stage),
      hubspot_owner_id: nullToEmptyString(input.owner_id),
      // only primary phone is supported for hubspot accounts
      phone:
        input.phone_numbers?.find((p) => p.phone_number_type === 'primary')
          ?.phone_number ?? '',
      address: input.addresses?.[0]?.street_1 ?? '',
      // NOTE: Support address2 for companies only
      city: input.addresses?.[0]?.city ?? '',
      state: input.addresses?.[0]?.state ?? '',
      zip: input.addresses?.[0]?.postal_code ?? '',
      country: input.addresses?.[0]?.country ?? '',
      ...input.passthrough_fields,
    }),
  ),
  contacts_input: mapper(unified.contact_input, HSProperties, (input) =>
    removeUndefinedValues({
      last_name: nullToEmptyString(input.last_name),
      first_name: nullToEmptyString(input.first_name),
      ...input.passthrough_fields,
    }),
  ),
}

// MARK: - Utils

const removeValues = (
  obj: Record<string, unknown>,
  fn: (k: string, v: unknown) => boolean,
) => {
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  Object.keys(obj).forEach((key) => (fn(key, obj[key]) ? delete obj[key] : {}))
  return obj
}

const removeUndefinedValues = <T extends Record<string, unknown>>(
  obj: T,
): {[k in keyof T]: Exclude<T[k], undefined>} =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
  removeValues(obj, (_, v) => v === undefined) as any

const nullToEmptyString = (
  value: string | undefined | null,
): string | undefined => (value === null ? '' : value)
