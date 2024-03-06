import {env, envRequired} from '@supaglue/env'
import {initBYOSupaglueSDK} from '@supaglue/sdk'

const supaglue = initBYOSupaglueSDK({
  ...(env['BYOS_URL'] && {baseUrl: env['BYOS_URL']}),
  headers: {
    // 'x-api-key': env['SUPAGLUE_API_KEY'],
    'x-customer-id': env['CUSTOMER_ID'],
    'x-provider-name': env['PROVIDER_NAME'],
    'x-nango-secret-key': env['NANGO_SECRET_KEY'],
    // 'x-mgmt-provider-name': env['MGMT_PROVIDER_NAME'] as
    //   | 'supaglue'
    //   | 'nango',
  },
})

async function main() {
  await supaglue.GET('/crm/v2/contact', {}).then((r) => console.log(r.data))
  return
  await supaglue.POST('/crm/v2/contact/_upsert', {
    body: {
      record: {email: 'test@test.com'},
      upsert_on: {key: 'email', values: ['test@test.com']},
    },
  })
  return
  await supaglue.POST('/crm/v2/account/_upsert', {
    body: {
      record: {name: 'example example 4', website: 'example1.com'},
      upsert_on: {key: 'website', values: ['example1.com']},
    },
  })
  return
  return
  await supaglue.GET('/customers/{customer_id}/connections/{provider_name}', {
    params: {
      path: {
        customer_id: envRequired['CUSTOMER_ID'],
        provider_name: envRequired['PROVIDER_NAME'],
      },
    },
  })
  await supaglue.GET('/crm/v2/account', {}).then((r) => console.log(r.data))

  await supaglue.GET('/customers/{customer_id}/connections', {
    params: {path: {customer_id: envRequired['CUSTOMER_ID']}},
  })
  await supaglue.GET('/crm/v2/metadata/objects', {
    params: {query: {type: 'custom'}},
  })

  // await supaglue.GET('/sync_configs')
  // let cursor: string | undefined = undefined
  //
  // while (true) {
  //   const r = await supaglue.GET('/engagement/v2/sequences', {
  //     params: {query: {cursor}},
  //   })
  //   console.log('Success', r.data)
  //   if (!r.data.nextPageCursor) {
  //     break
  //   }
  //   cursor = r.data.nextPageCursor as string | undefined
  // }
  // const res = await supaglue.POST('/engagement/v2/accounts/_upsert', {
  //   body: {record: {domain: 'examplebob.com', }, upsert_on: {name: 'Jacob'}},
  // })
  // console.log('Success', res.data)
  // const res = await supaglue.GET(
  //   '/crm/v2/metadata/objects/{object_name}/properties',
  //   {params: {path: {object_name: env['OBJECT'] ?? 'Account'}}},
  // )
  // console.log('Success', res.data)
  // const res = await supaglue.GET('/crm/v2/contacts/{id}', {
  //   params: {path: {id: '0033x00003D6SBOAA3'}},
  // })
  // console.log('Success', res.data)
  // const res = await supaglue.GET('/crm/v2/companies/{id}', {
  //   params: {path: {id: '0033x00003D6SBOAA3'}},
  // })
  // const res = await supaglue.POST('/engagement/v2/sequenceState', {
  //   body: {
  //     record: {
  //       contact_id: '41834',
  //       mailbox_id: '1',
  //       sequence_id: '38',
  //     },
  //   },
  // })
  // const res = await supaglue.GET('/crm/v2/metadata/properties', {
  //   params: {query: {name: 'MyStuff', type: 'custom'}},
  // })
  // await supaglue.PUT('/customers/{customer_id}', {
  //   body: {email: 'hello@gda.com', name: 'world'},
  //   params: {path: {customer_id: '1123'}},
  // })
  // const res = await supaglue.GET('/customers', {
  //   // params: {query: {name: 'MyStuff', type: 'custom'}},
  // })
  // console.log('Success', res.data)
  // res.data.record.name
}

main()

// const supaglue = initBYOSupaglueSDK({
//   headers: {
//     'x-customer-id': 'hubspot1',
//     'x-provider-name': 'hubspot',
//   },
// })

// supaglue.GET('/crm/v2/contacts').then((r) => {
//   if (r.error) {
//     console.log('Error', r.error)
//   } else {
//     console.log('Success', r.data)
//   }
// })
