import type {PathsWithMethod, ResponseFrom} from '@supaglue/vdk'
import {mapper, z, zCast} from '@supaglue/vdk'
import type {PipedriveSDKTypes} from '@opensdks/sdk-pipedrive'
import {commonModels} from '../../router'

// Unfortunately pipedrive does not use the schemas field properly...
// So we have to do the type magic...
// type Pipedrive = PipedriveSDKTypes['oas']['components']['schemas']
type PipedrivePaths = PipedriveSDKTypes['oas']['paths']

type GETResponse<P extends PathsWithMethod<PipedrivePaths, 'get'>> =
  ResponseFrom<PipedrivePaths, 'get', P>

// Move this into sdk-pipedrive would be good
export type Organization = NonNullable<
  GETResponse<'/organizations'>['data']
>[number]
export type Person = NonNullable<GETResponse<'/persons'>['data']>[number]
export type Deal = NonNullable<GETResponse<'/deals'>['data']>[number]
export type Lead = NonNullable<GETResponse<'/leads'>['data']>[number]
export type User = NonNullable<GETResponse<'/users'>['data']>[number]

export const mappers = {
  account: mapper(zCast<Organization>(), commonModels.account, {
    id: (p) => `${p.id}`,
    updated_at: 'update_time',
    name: 'name',
  }),
  contact: mapper(zCast<Person>(), commonModels.contact, {
    id: (p) => `${p.id}`,
    updated_at: 'update_time',
    first_name: (p) => p.first_name ?? '',
    last_name: (p) => p.last_name ?? '',
  }),
  opportunity: mapper(zCast<Deal>(), commonModels.opportunity, {
    id: (p) => `${p.id}`,
    updated_at: 'update_time',
    name: 'title',
  }),
  lead: mapper(zCast<Lead>(), commonModels.lead, {
    id: (p) => `${p.id}`,
    updated_at: 'update_time',
  }),
  user: mapper(zCast<User>(), commonModels.user, {
    id: (p) => `${p.id}`,
    updated_at: 'modified',
  }),
}

/**
 * {
  "success": false,
  "error": "Scope and URL mismatch",
  "errorCode": 403,
  "error_info": "Please check developers.pipedrive.com"
}
 */
export const zErrorPayload = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  errorCode: z.number().optional(),
  error_info: z.string().optional(),
})
