import {initBYOSupaglueSDK} from '@supaglue/sdk'

const supaglue = initBYOSupaglueSDK({
  headers: {
    // 'x-api-key': process.env['SUPAGLUE_API_KEY']!,
    // 'x-customer-id': process.env['CUSTOMER_ID']!, // '64a350c383ea68001832fd8a',
    // 'x-provider-name': process.env['PROVIDER_NAME']!, // 'hubspot',
    // 'x-customer-id': 'test-connection-id',
    // 'x-provider-name': 'salesforce',
  },
})

async function main() {
  await supaglue.GET('/customers')
  // await supaglue.GET('/sync_configs')
  // let cursor: string | undefined = undefined
  //
  // while (true) {
  //   const r = await supaglue.GET('/verticals/sales-engagement/sequences', {
  //     params: {query: {cursor}},
  //   })
  //   console.log('Success', r.data)
  //   if (!r.data.nextPageCursor) {
  //     break
  //   }
  //   cursor = r.data.nextPageCursor as string | undefined
  // }
  // const res = await supaglue.POST('/verticals/sales-engagement/accounts/_upsert', {
  //   body: {record: {domain: 'examplebob.com', }, upsert_on: {name: 'Jacob'}},
  // })
  // console.log('Success', res.data)
  // const res = await supaglue.GET(
  //   '/verticals/crm/metadata/objects/{object_name}/properties',
  //   {params: {path: {object_name: process.env['OBJECT'] ?? 'Account'}}},
  // )
  // console.log('Success', res.data)
  // const res = await supaglue.GET('/verticals/crm/contacts/{id}', {
  //   params: {path: {id: '0033x00003D6SBOAA3'}},
  // })
  // console.log('Success', res.data)
  // const res = await supaglue.GET('/verticals/crm/companies/{id}', {
  //   params: {path: {id: '0033x00003D6SBOAA3'}},
  // })
  // const res = await supaglue.POST('/verticals/sales-engagement/sequenceState', {
  //   body: {
  //     record: {
  //       contact_id: '41834',
  //       mailbox_id: '1',
  //       sequence_id: '38',
  //     },
  //   },
  // })
  // const res = await supaglue.GET('/verticals/crm/metadata/properties', {
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

// supaglue.GET('/verticals/crm/contacts').then((r) => {
//   if (r.error) {
//     console.log('Error', r.error)
//   } else {
//     console.log('Success', r.data)
//   }
// })
