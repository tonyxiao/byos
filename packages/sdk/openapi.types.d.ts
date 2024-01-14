/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  '/health': {
    /** Health check */
    get: operations['public-health']
  }
  '/openapi.json': {
    get: operations['public-getOpenAPISpec']
  }
  '/engagement/v2/contacts': {
    get: operations['salesEngagement-listContacts']
  }
  '/engagement/v2/sequences': {
    get: operations['salesEngagement-listSequences']
  }
  '/crm/v2/contacts': {
    get: operations['crm-listContacts']
  }
}

export type webhooks = Record<string, never>

export interface components {
  schemas: {
    /**
     * Error
     * @description The error information
     * @example {
     *   "code": "INTERNAL_SERVER_ERROR",
     *   "message": "Internal server error",
     *   "issues": []
     * }
     */
    'error.INTERNAL_SERVER_ERROR': {
      /**
       * @description The error message
       * @example Internal server error
       */
      message: string
      /**
       * @description The error code
       * @example INTERNAL_SERVER_ERROR
       */
      code: string
      /**
       * @description An array of issues that were responsible for the error
       * @example []
       */
      issues?: {
        message: string
      }[]
    }
    'sales-engagement.contact': {
      id: string
      first_name: string
      last_name: string
    }
    /**
     * Error
     * @description The error information
     * @example {
     *   "code": "BAD_REQUEST",
     *   "message": "Invalid input data",
     *   "issues": []
     * }
     */
    'error.BAD_REQUEST': {
      /**
       * @description The error message
       * @example Invalid input data
       */
      message: string
      /**
       * @description The error code
       * @example BAD_REQUEST
       */
      code: string
      /**
       * @description An array of issues that were responsible for the error
       * @example []
       */
      issues?: {
        message: string
      }[]
    }
    /**
     * Error
     * @description The error information
     * @example {
     *   "code": "NOT_FOUND",
     *   "message": "Not found",
     *   "issues": []
     * }
     */
    'error.NOT_FOUND': {
      /**
       * @description The error message
       * @example Not found
       */
      message: string
      /**
       * @description The error code
       * @example NOT_FOUND
       */
      code: string
      /**
       * @description An array of issues that were responsible for the error
       * @example []
       */
      issues?: {
        message: string
      }[]
    }
    'sales-engagement.sequence': {
      id: string
      name?: string
    }
    'crm.contact': {
      id: string
      first_name?: string | null
      last_name?: string | null
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}

export type $defs = Record<string, never>

export type external = Record<string, never>

export interface operations {
  /** Health check */
  'public-health': {
    responses: {
      /** @description Successful response */
      200: {
        content: {
          'application/json': string
        }
      }
      /** @description Internal server error */
      500: {
        content: {
          'application/json': components['schemas']['error.INTERNAL_SERVER_ERROR']
        }
      }
    }
  }
  'public-getOpenAPISpec': {
    responses: {
      /** @description Successful response */
      200: {
        content: {
          'application/json': unknown
        }
      }
      /** @description Internal server error */
      500: {
        content: {
          'application/json': components['schemas']['error.INTERNAL_SERVER_ERROR']
        }
      }
    }
  }
  'salesEngagement-listContacts': {
    parameters: {
      query?: {
        limit?: number
        offset?: number
      }
    }
    responses: {
      /** @description Successful response */
      200: {
        content: {
          'application/json': {
            hasNextPage: boolean
            items: components['schemas']['sales-engagement.contact'][]
          }
        }
      }
      /** @description Invalid input data */
      400: {
        content: {
          'application/json': components['schemas']['error.BAD_REQUEST']
        }
      }
      /** @description Not found */
      404: {
        content: {
          'application/json': components['schemas']['error.NOT_FOUND']
        }
      }
      /** @description Internal server error */
      500: {
        content: {
          'application/json': components['schemas']['error.INTERNAL_SERVER_ERROR']
        }
      }
    }
  }
  'salesEngagement-listSequences': {
    parameters: {
      query?: {
        cursor?: string | null
      }
    }
    responses: {
      /** @description Successful response */
      200: {
        content: {
          'application/json': {
            nextPageCursor?: string | null
            items: components['schemas']['sales-engagement.sequence'][]
          }
        }
      }
      /** @description Invalid input data */
      400: {
        content: {
          'application/json': components['schemas']['error.BAD_REQUEST']
        }
      }
      /** @description Not found */
      404: {
        content: {
          'application/json': components['schemas']['error.NOT_FOUND']
        }
      }
      /** @description Internal server error */
      500: {
        content: {
          'application/json': components['schemas']['error.INTERNAL_SERVER_ERROR']
        }
      }
    }
  }
  'crm-listContacts': {
    parameters: {
      query?: {
        limit?: number
        offset?: number
      }
    }
    responses: {
      /** @description Successful response */
      200: {
        content: {
          'application/json': {
            hasNextPage: boolean
            items: components['schemas']['crm.contact'][]
          }
        }
      }
      /** @description Invalid input data */
      400: {
        content: {
          'application/json': components['schemas']['error.BAD_REQUEST']
        }
      }
      /** @description Not found */
      404: {
        content: {
          'application/json': components['schemas']['error.NOT_FOUND']
        }
      }
      /** @description Internal server error */
      500: {
        content: {
          'application/json': components['schemas']['error.INTERNAL_SERVER_ERROR']
        }
      }
    }
  }
}

export interface oasTypes {
  components: components
  external: external
  operations: operations
  paths: paths
  webhooks: webhooks
}

export default oasTypes
