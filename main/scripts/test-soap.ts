import {env} from '@supaglue/env'
import * as jsforce from 'jsforce'

const SALESFORCE_API_VERSION = '57.0'
const conn = new jsforce.Connection({
  instanceUrl: env['SFDC_INSTANCE_URL']!,
  accessToken: env['SFDC_ACCESS_TOKEN']!,
  maxRequest: 10,
  version: SALESFORCE_API_VERSION,
})

void conn.metadata.read('CustomObject', 'Account')
