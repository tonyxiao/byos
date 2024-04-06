import type {Observable} from 'rxjs'
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

export interface StateMessage extends Omit<AirbyteStateMessage, 'type'> {
  type: AirbyteStateMessage['type'] | 'COMMIT' | 'INITIAL_RECORDS_EMITTED'
}

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
  | {type: 'TRACE'; trace: AirbyteTraceMessage; [k: string]: unknown}
  | {type: 'STATE'; state: StateMessage; [k: string]: unknown},
  {type: T}
>

export type Source = Observable<SyncMessage>
export type Link = (obs: Observable<SyncMessage>) => Observable<SyncMessage>
export type Destination = (
  obs: Observable<SyncMessage>,
) => Observable<SyncMessage>
