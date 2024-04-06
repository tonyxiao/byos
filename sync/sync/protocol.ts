import type {
  AirbyteCatalog,
  AirbyteConnectionStatus,
  AirbyteControlMessage,
  AirbyteLogMessage,
  AirbyteRecordMessage,
  AirbyteStateMessage,
  AirbyteTraceMessage,
  ConnectorSpecification,
  Type,
} from './protocol.schema'

/** TODO: How do we make sure SyncMessage satisfies AirbyteMessage? */
export type SyncMessage<T extends Type = Type> = Extract<
  | {type: 'CATALOG'; catalog: AirbyteCatalog; [k: string]: unknown}
  | {
      type: 'CONNECTION_STATUS'
      connectionStatus: AirbyteConnectionStatus
      [k: string]: unknown
    }
  | {type: 'CONTROL'; control: AirbyteControlMessage; [k: string]: unknown}
  | {type: 'LOG'; log: AirbyteLogMessage; [k: string]: unknown}
  | {type: 'RECORD'; record: AirbyteRecordMessage; [k: string]: unknown}
  | {type: 'SPEC'; spec: ConnectorSpecification; [k: string]: unknown}
  | {type: 'STATE'; state: AirbyteStateMessage; [k: string]: unknown}
  | {type: 'TRACE'; trace: AirbyteTraceMessage; [k: string]: unknown},
  {type: T}
>
