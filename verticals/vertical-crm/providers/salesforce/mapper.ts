/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {mapper, zCast} from '@supaglue/vdk'
import type {SalesforceSDKTypes} from '@opensdks/sdk-salesforce'
import {commonModels} from '../../router'

// import {updateFieldPermissions} from './salesforce/updatePermissions'

export type SFDC = SalesforceSDKTypes['oas']['components']['schemas']

export const mappers = {
  contact: mapper(zCast<SFDC['ContactSObject']>(), commonModels.contact, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    first_name: 'FirstName',
    last_name: 'LastName',
  }),
  account: mapper(zCast<SFDC['AccountSObject']>(), commonModels.account, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    name: 'Name',
    is_deleted: 'IsDeleted',
    website: 'Website',
    industry: 'Industry',
    number_of_employees: 'NumberOfEmployees',
    owner_id: 'OwnerId',
    created_at: (record) =>
      record.CreatedDate ? new Date(record.CreatedDate).toISOString() : '',
  }),
  opportunity: mapper(
    zCast<SFDC['OpportunitySObject']>(),
    commonModels.opportunity,
    {
      id: 'Id',
      updated_at: 'SystemModstamp',
      name: 'Name',
      description: 'Description',
      owner_id: 'OwnerId',
      status: (record) => (record.IsClosed ? 'Closed' : 'Open'),
      stage: 'StageName',
      close_date: (record) =>
        record.CloseDate ? new Date(record.CloseDate) : null,
      account_id: 'AccountId',
      amount: 'Amount',
      last_activity_at: (record) =>
        record.LastActivityDate ? new Date(record.LastActivityDate) : null,
      created_at: (record) =>
        record.CreatedDate ? new Date(record.CreatedDate).toISOString() : '',
      is_deleted: 'IsDeleted',
      last_modified_at: (record) =>
        record.LastModifiedDate
          ? new Date(record.LastModifiedDate).toISOString()
          : '',
    },
  ),
  lead: mapper(zCast<SFDC['LeadSObject']>(), commonModels.lead, {
    id: 'Id',
    updated_at: 'SystemModstamp',
    name: 'Name',
    first_name: 'FirstName',
    last_name: 'LastName',
    owner_id: 'OwnerId',
    title: 'Title',
    company: 'Company',
    converted_date: (record) =>
      record.ConvertedDate ? new Date(record.ConvertedDate).toISOString() : '',
    lead_source: 'LeadSource',
    converted_account_id: 'ConvertedAccountId',
    converted_contact_id: 'ConvertedContactId',
    addresses: (record) =>
      record.Street ||
      record.City ||
      record.State ||
      record.Country ||
      record.PostalCode
        ? [
            {
              street1: record.Street ?? null,
              street2: null,
              city: record.City ?? null,
              state: record.State ?? null,
              country: record.Country ?? null,
              postal_code: record.PostalCode ?? null,
              address_type: 'primary',
            },
          ]
        : [],
    email_addresses: (record) =>
      record.Email
        ? [{email_address: record.Email, email_address_type: 'primary'}]
        : [],
    phone_numbers: (record) =>
      record.Phone
        ? [
            {
              phone_number: record.Phone ?? null,
              phone_number_type: 'primary',
            },
          ]
        : [],
    created_at: (record) =>
      record.CreatedDate ? new Date(record.CreatedDate).toISOString() : '',
    is_deleted: 'IsDeleted',
    last_modified_at: (record) =>
      record.SystemModstamp
        ? new Date(record.SystemModstamp).toISOString()
        : '',
  }),
  user: mapper(zCast<SFDC['UserSObject']>(), commonModels.user, {
    id: 'Id',
    name: 'Name',
    email: 'Email',
    is_active: 'IsActive',
    updated_at: 'SystemModstamp',
    created_at: (record) =>
      record.CreatedDate ? new Date(record.CreatedDate).toISOString() : '',
    last_modified_at: (record) =>
      record.CreatedDate ? new Date(record.CreatedDate).toISOString() : '',
  }),

  customObject: {
    parse: (rawData: any) => ({
      id: rawData.Id,
      updated_at: rawData.SystemModstamp
        ? new Date(rawData.SystemModstamp).toISOString()
        : '',
      name: rawData.Name,
      createdAt: rawData.CreatedDate
        ? new Date(rawData.CreatedDate).toISOString()
        : '',
      updatedAt: rawData.CreatedDate
        ? new Date(rawData.CreatedDate).toISOString()
        : '',
      lastModifiedAt: rawData.CreatedDate
        ? new Date(rawData.CreatedDate).toISOString()
        : '',
      raw_data: rawData,
    }),
    _in: {
      Name: true,
    },
  },
}

/** Properties to fetch for common object */
export const propertiesForCommonObject = {
  account: [
    'OwnerId',
    'Name',
    'Description',
    'Industry',
    'Website',
    'NumberOfEmployees',
    // We may not need all of these fields in order to map to common object
    'BillingCity',
    'BillingCountry',
    'BillingPostalCode',
    'BillingState',
    'BillingStreet',
    // We may not need all of these fields in order to map to common object
    'ShippingCity',
    'ShippingCountry',
    'ShippingPostalCode',
    'ShippingState',
    'ShippingStreet',
    'Phone',
    'Fax',
    'LastActivityDate',
    'CreatedDate',
    'IsDeleted',
  ] satisfies Array<keyof SFDC['AccountSObject']>,
  contact: [
    'OwnerId',
    'AccountId',
    'FirstName',
    'LastName',
    'Email',
    'Phone',
    'Fax',
    'MobilePhone',
    'LastActivityDate',
    // We may not need all of these fields in order to map to common object
    'MailingCity',
    'MailingCountry',
    'MailingPostalCode',
    'MailingState',
    'MailingStreet',
    // We may not need all of these fields in order to map to common object
    'OtherCity',
    'OtherCountry',
    'OtherPostalCode',
    'OtherState',
    'OtherStreet',
    'IsDeleted',
    'CreatedDate',
  ] satisfies Array<keyof SFDC['ContactSObject']>,
  opportunity: [
    'OwnerId',
    'Name',
    'Description',
    'LastActivityDate',
    'Amount',
    'IsClosed',
    'IsDeleted',
    'IsWon',
    'StageName',
    'CloseDate',
    'CreatedDate',
    'AccountId',
  ] satisfies Array<keyof SFDC['OpportunitySObject']>,
  lead: [
    'OwnerId',
    'Title',
    'FirstName',
    'LastName',
    'ConvertedDate',
    'CreatedDate',
    'SystemModstamp',
    'ConvertedContactId',
    'ConvertedAccountId',
    'Company',
    'City',
    'State',
    'Street',
    'Country',
    'PostalCode',
    'Phone',
    'Email',
    'IsDeleted',
  ] satisfies Array<keyof SFDC['LeadSObject']>,
  user: ['Name', 'Email', 'IsActive', 'CreatedDate'] satisfies Array<
    keyof SFDC['UserSObject']
  >,
}
