/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type * as jsforce from 'jsforce'
import type {CustomField as SalesforceCustomField} from 'jsforce/lib/api/metadata/schema'
import type {CRMProvider} from '../../router'

// import {updateFieldPermissions} from './salesforce/updatePermissions'

type PropertyType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'picklist'
  | 'multipicklist'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'url'
  | 'other'

type PicklistOption = {
  label: string
  value: string
  description?: string
  hidden?: boolean
}

type PropertyUnified = {
  id: string
  customName?: string
  label: string
  description?: string
  isRequired?: boolean
  defaultValue?: string | number | boolean
  groupName?: string
  type: PropertyType
  precision?: number
  scale?: number
  options?: PicklistOption[]
  rawDetails?: Record<string, unknown>
}

type CustomObjectSchema = {
  name: string
  description: string | null
  labels: {
    singular: string
    plural: string
  }
  primaryFieldId: string
  fields: PropertyUnified[]
  // TODO: timestamps?
}

type CustomObjectSchemaCreateParams = CustomObjectSchema

function mapStringToPropertyType(type: string): PropertyType {
  switch (type) {
    case 'text':
    case 'textarea':
    case 'number':
    case 'picklist':
    case 'multipicklist':
    case 'date':
    case 'datetime':
    case 'boolean':
    case 'url':
      return type
    default:
      return 'other'
  }
}

type ToolingAPIValueSet = {
  restricted: boolean
  valueSetDefinition: {
    sorted: boolean
    value: Array<{label: string; valueName: string; description: string}>
  }
}
type ToolingAPICustomField = {
  FullName: string
  Metadata: (
    | {
        type: 'DateTime' | 'Url' | 'Checkbox' | 'Date'
      }
    | {
        type: 'Text' | 'TextArea'
        length: number
      }
    | {
        type: 'Number'
        precision: number
        scale: number
      }
    | {
        type: 'MultiselectPicklist'
        valueSet: ToolingAPIValueSet
        visibleLines: number
      }
    | {
        type: 'Picklist'
        valueSet: ToolingAPIValueSet
      }
  ) & {
    required: boolean
    label: string
    description?: string
    defaultValue: string | null
  }
}

function capitalizeString(str: string): string {
  if (!str) {
    return str
  }
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// TODO: Figure out what to do with id and reference types
const toSalesforceType = (
  property: PropertyUnified,
): ToolingAPICustomField['Metadata']['type'] => {
  switch (property.type) {
    case 'number':
      return 'Number'
    case 'text':
      return 'Text'
    case 'textarea':
      return 'TextArea'
    case 'boolean':
      return 'Checkbox'
    case 'picklist':
      return 'Picklist'
    case 'multipicklist':
      return 'MultiselectPicklist'
    case 'date':
      return 'Date'
    case 'datetime':
      return 'DateTime'
    case 'url':
      return 'Url'
    default:
      return 'Text'
  }
}

function validateCustomObject(params: CustomObjectSchemaCreateParams): void {
  if (!params.fields.length) {
    throw new Error('Cannot create custom object with no fields')
  }

  const primaryField = params.fields.find(
    (field) => field.id === params.primaryFieldId,
  )

  if (!primaryField) {
    throw new Error(
      `Could not find primary field with key name ${params.primaryFieldId}`,
    )
  }

  if (primaryField.type !== 'text') {
    throw new Error(
      `Primary field must be of type text, but was ${primaryField.type} with key name ${params.primaryFieldId}`,
    )
  }

  if (!primaryField.isRequired) {
    throw new Error(
      `Primary field must be required, but was not with key name ${params.primaryFieldId}`,
    )
  }

  if (capitalizeString(primaryField.id) !== 'Name') {
    throw new Error(
      `Primary field for salesforce must have key name 'Name', but was ${primaryField.id}`,
    )
  }

  const nonPrimaryFields = params.fields.filter(
    (field) => field.id !== params.primaryFieldId,
  )

  if (nonPrimaryFields.some((field) => !field.id.endsWith('__c'))) {
    throw new Error('Custom object field key names must end with __c')
  }

  if (
    nonPrimaryFields.some(
      (field) => field.type === 'boolean' && field.isRequired,
    )
  ) {
    throw new Error('Boolean fields cannot be required in Salesforce')
  }
}

const toSalesforceCustomFieldCreateParams = (
  objectName: string,
  property: any,
  prefixed = false,
): Partial<SalesforceCustomField> => {
  const base: Partial<SalesforceCustomField> = {
    // When calling the CustomObjects API, it does not need to be prefixed.
    // However, when calling the CustomFields API, it needs to be prefixed.
    fullName: prefixed ? `${objectName}.${property.id}` : property.id,
    label: property.label,
    type: toSalesforceType(property),
    required: property.isRequired,
    defaultValue: property.defaultValue?.toString() ?? null,
  }
  // if (property.defaultValue) {
  //   base = { ...base, defaultValue: property.defaultValue.toString() };
  // }
  if (property.type === 'text') {
    return {
      ...base,
      // TODO: Maybe textarea should be longer
      length: 255,
    }
  }
  if (property.type === 'number') {
    return {
      ...base,
      scale: property.scale,
      precision: property.precision,
    }
  }
  if (property.type === 'boolean') {
    return {
      ...base,
      // Salesforce does not support the concept of required boolean fields
      required: false,
      // JS Force (incorrectly) expects string here
      // This is required for boolean fields
      defaultValue: property.defaultValue?.toString() ?? 'false',
    }
  }
  // TODO: Support picklist options
  return base
}

const toSalesforceCustomObjectCreateParams = (
  objectName: string,
  labels: {
    singular: string
    plural: string
  },
  description: string | null,
  primaryField: PropertyUnified,
  nonPrimaryFieldsToUpdate: PropertyUnified[],
) => ({
  deploymentStatus: 'Deployed',
  sharingModel: 'ReadWrite',
  fullName: objectName,
  description,
  label: labels.singular,
  pluralLabel: labels.plural,
  nameField: {
    label: primaryField?.label,
    type: 'Text',
  },
  fields: nonPrimaryFieldsToUpdate.map((field) =>
    toSalesforceCustomFieldCreateParams(objectName, field),
  ),
})

/**
 * Some salesforce APIs (e.g. metadata) are SOAP based which is not currently supported in
 * openSDKs so we use the jsforce lib instead
 */
export const salesforceProviderJsForce = {
  metadataListProperties: async ({instance: sfdc, input}) => {
    const data = await sfdc.metadata.read('CustomObject', input.name)
    return data.fields.map((obj) => ({
      id: obj.fullName || 'unknown',
      label: obj.label || 'unknown',
    }))
  },

  metadataCreateCustomObjectSchema: async ({instance: sfdc, input}) => {
    validateCustomObject({
      ...input,
      fields: input.fields.map((field) => ({
        ...field,
        type: mapStringToPropertyType(field.type),
      })),
    })
    const objectName = input.name.endsWith('__c')
      ? input.name
      : `${input.name}__c`

    const readResponse = await sfdc.metadata.read('CustomObject', objectName)
    if (readResponse.fullName) {
      console.log(`Custom object with name ${objectName} already exists`)
    }

    const primaryField = input.fields.find(
      (field) => field.id === input.primaryFieldId,
    )
    if (!primaryField) {
      throw new Error('Primary field not found')
    }

    const nonPrimaryFields = input.fields.filter(
      (field) => field.id !== input.primaryFieldId,
    )

    const primaryFieldMapped = {
      ...primaryField,
      type: mapStringToPropertyType(primaryField.type),
    }

    const nonPrimaryFieldsMapped = nonPrimaryFields.map((field) => ({
      ...field,
      type: mapStringToPropertyType(field.type),
    }))

    const result = await sfdc.metadata.create(
      'CustomObject',
      toSalesforceCustomObjectCreateParams(
        objectName,
        input.labels,
        input.description || null,
        primaryFieldMapped,
        nonPrimaryFieldsMapped,
      ),
    )

    // const nonRequiredFields = nonPrimaryFields.filter(
    //   (field) => !field.isRequired,
    // )

    // await updateFieldPermissions(
    //   sfdc,
    //   objectName,
    //   nonRequiredFields.map((field) => field.id),
    // )

    if (result.success) {
      // throw new Error(
      //   `Failed to create custom object. Since creating a custom object with custom fields is not an atomic operation in Salesforce, you should use the custom object name ${
      //     input.name
      //   } as the 'id' parameter in the Custom Object GET endpoint to check if it was already partially created. If so, use the PUT endpoint to update the existing object. Raw error message from Salesforce: ${JSON.stringify(
      //     result,
      //     null,
      //     2,
      //   )}`,
      // )
      return {id: input.name, name: input.name}
    }
    throw new Error(
      `Failed to create custom object. Since creating a custom object with custom fields is not an atomic operation in Salesforce, you should use the custom object name ${
        input.name
      } as the 'id' parameter in the Custom Object GET endpoint to check if it was already partially created. If so, use the PUT endpoint to update the existing object. Raw error message from Salesforce: ${JSON.stringify(
        result,
        null,
        2,
      )}`,
    )
  },
  createCustomObjectRecord: async ({instance: sfdc, input}) => {
    const result = await sfdc.sobject(input.id).create(input.record)
    return {record: {id: result.id}}
  },
  metadataCreateAssociation: async ({instance: sfdc, input}) => {
    // if id doesn't end with __c, we need to add it ourselves
    if (!input.id.endsWith('__c')) {
      input.id = `${input.id}__c`
    }

    // Look up source custom object to figure out a relationship name
    const sourceCustomObjectMetadata = await sfdc.metadata.read(
      'CustomObject',
      input.source_object,
    )

    // If the relationship field doesn't already exist, create it
    const existingField = sourceCustomObjectMetadata.fields?.find(
      (field: any) => field.fullName === input.id,
    )

    const customFieldPayload = {
      fullName: `${input.source_object}.${input.id}`,
      label: input.label,
      // The custom field name you provided Related Opportunity on object Opportunity can
      // only contain alphanumeric characters, must begin with a letter, cannot end
      // with an underscore or contain two consecutive underscore characters, and
      // must be unique across all Opportunity fields
      // TODO: allow developer to specify name?
      relationshipName:
        sourceCustomObjectMetadata.pluralLabel?.replace(/\s/g, '') ??
        'relationshipName',
      type: 'Lookup',
      required: false,
      referenceTo: input.target_object,
    }

    if (existingField) {
      const result = await sfdc.metadata.update(
        'CustomField',
        customFieldPayload,
      )

      console.log('result', result)

      if (!result.success) {
        throw new Error(
          `Failed to update custom field for association type: ${JSON.stringify(
            result.errors,
            null,
            2,
          )}`,
        )
      }
    } else {
      const result = await sfdc.metadata.create(
        'CustomField',
        customFieldPayload,
      )

      if (!result.success) {
        throw new Error(
          `Failed to create custom field for association type: ${JSON.stringify(
            result.errors,
            null,
            2,
          )}`,
        )
      }
    }

    const {userInfo} = sfdc
    if (!userInfo) {
      throw new Error('Could not get info of current user')
    }

    // Get the user record
    const user = await sfdc.retrieve('User', userInfo.id, {
      fields: ['ProfileId'],
    })

    // Get the first permission set
    // TODO: Is this the right thing to do? How do we know the first one is the best one?
    const result = await sfdc.query(
      `SELECT Id FROM PermissionSet WHERE ProfileId='${user['ProfileId']}' LIMIT 1`,
    )
    if (!result.records.length) {
      throw new Error(
        `Could not find permission set for profile ${user['ProfileId']}`,
      )
    }

    const permissionSetId = result.records[0]?.Id

    // Figure out which fields already have permissions
    const {records: existingFieldPermissions} = await sfdc.query(
      `SELECT Id,Field FROM FieldPermissions WHERE SobjectType='${input.source_object}' AND ParentId='${permissionSetId}' AND Field='${input.source_object}.${input.id}'`,
    )
    if (existingFieldPermissions.length) {
      // Update permission
      const existingFieldPermission = existingFieldPermissions[0]
      const result = await sfdc.update('FieldPermissions', {
        Id: existingFieldPermission?.Id as string,
        ParentId: permissionSetId,
        SobjectType: input.source_object,
        Field: `${input.source_object}.${input.id}`,
        PermissionsEdit: true,
        PermissionsRead: true,
      })
      if (!result.success) {
        throw new Error(
          `Failed to update field permission for association type: ${JSON.stringify(
            result.errors,
            null,
            2,
          )}`,
        )
      }
    } else {
      // Create permission
      const result = await sfdc.create('FieldPermissions', {
        ParentId: permissionSetId,
        SobjectType: input.source_object,
        Field: `${input.source_object}.${input.id}`,
        PermissionsEdit: true,
        PermissionsRead: true,
      })
      if (!result.success) {
        throw new Error(
          `Failed to create field permission for association type: ${JSON.stringify(
            result.errors,
            null,
            2,
          )}`,
        )
      }
    }
    return {
      id: `${input.source_object}.${input.id}`,
      sourceObject: input.source_object,
      targetObject: input.target_object,
      label: input.label,
    }
  },
  metadataUpdateCustomObjectSchema: async ({instance: sfdc, input}) => {
    const objectName = input.name.endsWith('__c')
      ? input.name
      : `${input.name}__c`

    const readResponse = await sfdc.metadata.read('CustomObject', objectName)
    if (!readResponse.fullName) {
      throw new Error(`Custom object with name ${objectName} does not exist`)
    }

    const primaryField = input.fields.find(
      (field) => field.id === input.primaryFieldId,
    )
    if (!primaryField) {
      throw new Error('Primary field not found')
    }

    const nonPrimaryFields = input.fields.filter(
      (field) => field.id !== input.primaryFieldId,
    )

    const primaryFieldMapped = {
      ...primaryField,
      type: mapStringToPropertyType(primaryField.type),
    }

    const nonPrimaryFieldsMapped = nonPrimaryFields.map((field) => ({
      ...field,
      type: mapStringToPropertyType(field.type),
    }))

    const result = await sfdc.metadata.update(
      'CustomObject',
      toSalesforceCustomObjectCreateParams(
        objectName,
        input.labels,
        input.description || null,
        primaryFieldMapped,
        nonPrimaryFieldsMapped,
      ),
    )

    if (result.success) {
      return {id: input.name, name: input.name}
    }
    throw new Error(
      `Failed to update custom object. Raw error message from Salesforce: ${JSON.stringify(
        result,
        null,
        2,
      )}`,
    )
  },
} satisfies Omit<CRMProvider<jsforce.Connection>, '__init__'>
