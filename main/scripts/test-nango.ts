import {initNangoSDK} from '@opensdks/sdk-nango'

const nango = initNangoSDK({
  headers: {authorization: `Bearer ${process.env['NANGO_SECRET_KEY']}`},
})

void nango
  .GET('/connection/{connectionId}', {
    params: {path: {connectionId: 'cus_64a350c383ea68001832fd8a'}, query: {provider_config_key: 'ccfg_hubspot'}},
  })
  