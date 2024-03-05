import {initNangoSDK} from '@opensdks/sdk-nango'

const nango = initNangoSDK({
  headers: {authorization: `Bearer ${process.env['NANGO_SECRET_KEY']}`},
})

void nango.GET('/environment-variables').then((r) => {
  console.log(r.data[0].name)
})
