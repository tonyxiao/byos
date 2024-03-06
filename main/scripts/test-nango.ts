import {env} from '@supaglue/env'
import {initNangoSDK} from '@opensdks/sdk-nango'

const nango = initNangoSDK({
  headers: {authorization: `Bearer ${env['NANGO_SECRET_KEY']}`},
})

void nango.GET('/connection/{connectionId}', {
  params: {
    path: {connectionId: 'cus_65ca441598f972a94d97e1bb'},
    query: {provider_config_key: 'ccfg_salesforce'},
  },
})
