import type {
  HttpMethod,
  JSONLike,
  PathsWithMethod,
  SuccessResponse,
} from 'openapi-typescript-helpers'
import {HTTPError} from '@opensdks/runtime'

export * from './mapper'
export * from './pagination'
export * from './provider'
export * from './trpc'
export * from './type-utils/PathsOf'
export * from './type-utils/StrictObj'

export * from '@opensdks/fetch-links'
export * from '@opensdks/util-zod'

export type {
  PathsWithMethod,
  OperationRequestBodyContent,
} from 'openapi-typescript-helpers'

export type ResponseFrom<
  Paths extends {},
  M extends HttpMethod,
  P extends PathsWithMethod<Paths, M>,
> = JSONLike<
  SuccessResponse<
    M extends keyof Paths[P]
      ? 'responses' extends keyof Paths[P][M]
        ? Paths[P][M]['responses']
        : never
      : never
  >
>

export {HTTPError} from '@opensdks/runtime'

/** TODO: MOve me into opensdks/runtime */
export function isHttpError<T>(
  err: unknown,
  /** HTTPError code. TODO: Support range... */
  code?: number,
): err is HTTPError<T> {
  if (err instanceof HTTPError) {
    if (code == null || err.code === code) {
      return true
    }
  }
  return false
}
