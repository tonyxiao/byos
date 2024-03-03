import {z, zBaseRecord} from '@supaglue/vdk'

export const address_type = z
  .enum(['primary', 'mailing', 'other', 'billing', 'shipping'])
  .openapi({ref: 'crm.address_type'})

export const address = z
  .object({
    /** @enum {string} */
    address_type,
    /** @example San Francisco */
    city: z.string().nullable(),
    /** @example USA */
    country: z.string().nullable(),
    /** @example 94107 */
    postal_code: z.string().nullable(),
    /** @example CA */
    state: z.string().nullable(),
    /** @example 525 Brannan */
    street_1: z.string().nullable(),
    /** @example null */
    street_2: z.string().nullable(),
  })
  .openapi({ref: 'crm.address'})

export const email_address_type = z
  .enum(['primary', 'work', 'other'])
  .openapi({ref: 'crm.email_address_type'})

export const email_address = z
  .object({
    /** @example hello@supaglue.com */
    email_address: z.string(),

    email_address_type,
  })
  .openapi({ref: 'crm.email_address'})

export const phone_number_type = z
  .enum(['primary', 'mobile', 'fax', 'other'])
  .openapi({ref: 'crm.phone_number_type'})

export const phone_number = z.object({
  /** @example +14151234567 */
  phone_number: z.string().nullable(),

  phone_number_type,
})

export const lifecycle_stage = z
  .enum([
    'subscriber',
    'lead',
    'marketingqualifiedlead',
    'salesqualifiedlead',
    'opportunity',
    'customer',
    'evangelist',
    'other',
  ])
  .openapi({ref: 'crm.lifecycle_stage'})

export const account = zBaseRecord
  .extend({
    name: z.string().nullish(),
    is_deleted: z.boolean().nullish(),
    website: z.string().nullish(),
    industry: z.string().nullish(),
    number_of_employees: z.number().nullish(),
    owner_id: z.string().nullish(),
    created_at: z.string().nullish(),
    // not implemented yet
    description: z.string().nullish().openapi({example: 'Integration API'}),
    last_activity_at: z.string().nullish().describe('date-time'),
    addresses: z.array(address).nullish(),
    phone_numbers: z.array(phone_number).nullish(),
    lifecycle_stage: lifecycle_stage.nullish(),
    last_modified_at: z.string().nullish(),
  })
  .openapi({ref: 'crm.account'})

export const contact = zBaseRecord
  .extend({
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
  })
  .openapi({ref: 'crm.contact'})

export const lead = zBaseRecord
  .extend({
    name: z.string().nullish(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    owner_id: z.string().nullish(),
    title: z.string().nullish(),
    company: z.string().nullish(),
    converted_date: z.string().nullish(),
    lead_source: z.string().nullish(),
    converted_account_id: z.string().nullish(),
    converted_contact_id: z.string().nullish(),
    addresses: z.array(address).nullish(),
    email_addresses: z.array(email_address).nullish(),
    phone_numbers: z.array(phone_number).nullish(),
    created_at: z.string().nullish(),
    is_deleted: z.boolean().nullish(),
    last_modified_at: z.string().nullish(),
  })
  .openapi({ref: 'crm.lead'})

export const opportunity_status = z
  .enum(['OPEN', 'WON', 'LOST'])
  .openapi({ref: 'crm.opportunity_status'})

export const opportunity = zBaseRecord
  .extend({
    name: z.string().nullish(),
    description: z.string().nullish(),
    owner_id: z.string().nullish(),
    status: opportunity_status.nullish(),
    stage: z.string().nullish(),
    close_date: z.string().nullish(),
    account_id: z.string().nullish(),
    pipeline: z.string().nullish(),
    amount: z.number().nullish(),
    last_activity_at: z.string().nullish(),
    created_at: z.string().nullish(),
    is_deleted: z.boolean().nullish(),
    last_modified_at: z.string().nullish(),
  })
  .openapi({ref: 'crm.opportunity'})

export const user = zBaseRecord
  .extend({
    name: z.string().nullish(),
    email: z.string().nullish(),
    is_active: z.boolean().nullish(),
    created_at: z.string().nullish(),
    is_deleted: z.boolean().nullish(),
    last_modified_at: z.string().nullish(),
  })
  .openapi({ref: 'crm.user'})

export const meta_standard_object = z
  .object({
    name: z.string(),
  })
  .openapi({ref: 'crm.meta_standard_object'})

export const meta_custom_object = z
  .object({
    id: z.string(),
    name: z.string(),
  })
  .openapi({ref: 'crm.meta_custom_object'})

export const meta_property = z
  .object({
    id: z.string().openapi({
      description:
        'The machine name of the property as it appears in the third-party Provider',
      example: 'FirstName',
    }),
    label: z.string().openapi({
      description:
        'The human-readable name of the property as provided by the third-party Provider.',
      example: 'First Name',
    }),
    type: z.string().optional().openapi({
      description:
        'The type of the property as provided by the third-party Provider. These types are not unified by Supaglue. For Intercom, this is string, integer, boolean, or object. For Outreach, this is integer, boolean, number, array, or string.',
      example: 'string',
    }),
    raw_details: z.record(z.unknown()).optional().openapi({
      description:
        'The raw details of the property as provided by the third-party Provider, if available.',
      example: {},
    }),
  })
  .openapi({ref: 'crm.meta_property'})

export const metaStandardObject = z
  .object({
    name: z.string(),
  })
  .openapi({ref: 'crm.metaStandardObject'})

export const metaCustomObject = z
  .object({
    // Custom object does not always have an id
    // id: z.string(),
    name: z.string(),
  })
  .openapi({ref: 'crm.metaCustomObject'})

export const metaProperty = z
  .object({
    id: z.string().openapi({
      description:
        'The machine name of the property as it appears in the third-party Provider',
      example: 'FirstName',
    }),
    label: z.string().openapi({
      description:
        'The human-readable name of the property as provided by the third-party Provider.',
      example: 'First Name',
    }),
    type: z.string().optional().openapi({
      description:
        'The type of the property as provided by the third-party Provider. These types are not unified by Supaglue. For Intercom, this is string, integer, boolean, or object. For Outreach, this is integer, boolean, number, array, or string.',
      example: 'string',
    }),
    raw_details: z.record(z.unknown()).optional().openapi({
      description:
        'The raw details of the property as provided by the third-party Provider, if available.',
      example: {},
    }),
  })
  .openapi({ref: 'crm.metaProperty'})

export const property_type = z
  .enum([
    'text',
    'textarea',
    'number',
    'picklist',
    'multipicklist',
    'date',
    'datetime',
    'boolean',
    'url',
    'other',
  ])
  .openapi({
    ref: 'crm.property_type',
    description: `
:::note
\`picklist\` and \`multipicklist\` property types are currently only supported in Salesforce and Hubspot
:::

:::note
\`url\` property type currently is only natively supported in Salesforce.
:::`.trim(),
  })

export const association_schema = z
  .object({
    id: z.string(),
    source_object: z.string().openapi({example: 'contact'}),
    target_object: z.string().openapi({example: 'my_custom_object'}),
    display_name: z.string(),
  })
  .openapi({ref: 'crm.association_schema'})


