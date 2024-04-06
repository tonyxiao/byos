import {endWith, identity, lastValueFrom, takeWhile, tap} from 'rxjs'
import type {Destination, Link, Source, SyncMessage} from './protocol'

export async function sync(input: {
  source: Source
  destination: Destination
  links?: Link[]
  watch?: boolean
}) {
  const start = Date.now()
  let count = 0
  let ready = false
  await lastValueFrom(
    // Raw Source, may come from fs, firestore or postgres
    input.source
      // Final commit in case the source does not emit one to make sure
      // destination always get a chance before pipeline shuts down
      .pipe(endWith<SyncMessage>({type: 'STATE', state: {type: 'COMMIT'}}))
      // Plugins
      .pipe(
        ...((input.links ?? []) as [NonNullable<typeof input.links>[number]]),
      )
      // Destination
      .pipe(input.destination)
      // Progress & flow controlß
      .pipe(
        !input.watch
          ? takeWhile(
              (e) =>
                !(
                  e.type === 'STATE' &&
                  e.state.type === 'INITIAL_RECORDS_EMITTED'
                ),
            )
          : identity,
      )
      .pipe(
        tap((e) => {
          count++
          if (ready) {
            console.warn(`#${count}: Event received after ready`, e)
          }
          if (!e) {
            console.log(`#${count}: Bad event`, e)
          } else if (
            e.type === 'STATE' &&
            e.state.type === 'INITIAL_RECORDS_EMITTED'
          ) {
            console.log(
              `#${count}: Initial records emitted in ${Date.now() - start}ms`,
            )
            ready = true
          } else if (e.type === 'RECORD') {
            console.log(
              `#${count}: ${e.record.namespace} exists=${
                e.record.stream != null
              }`,
            )
          } else {
            console.log(`#${count}: Received ${e.type} ${Date.now() - start}ms`)
          }
        }),
      ),
    {defaultValue: undefined},
  )
  console.log('Sync complete, should exit unless we have open handles')
  return count
}
