import type {Observable} from 'rxjs'
import type {
  AirbyteCatalog,
  AirbyteConnectionStatus,
  AirbyteControlMessage,
  AirbyteLogMessage,
  AirbyteRecordMessage,
  AirbyteStateMessage,
  AirbyteTraceMessage,
  ConfiguredAirbyteCatalog,
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

export const STATE_COMMIT = {
  type: 'STATE',
  state: {type: 'COMMIT'},
} satisfies SyncMessage

export const STATE_INITIAL_RECORDS_EMITTED = {
  type: 'STATE',
  state: {type: 'INITIAL_RECORDS_EMITTED'},
} satisfies SyncMessage

/**
 * https://docs.airbyte.com/understanding-airbyte/airbyte-protocol-docker/#source
 * spec() -> ConnectorSpecification
 * check(Config) -> AirbyteConnectionStatus
 * discover(Config) -> AirbyteCatalog
 * read(Config, ConfiguredAirbyteCatalog, State) -> Stream<AirbyteRecordMessage | AirbyteStateMessage>
 */
export interface SourceConnector<TConfig, TState = unknown> {
  spec?(): ConnectorSpecification
  check?(config: TConfig): AirbyteConnectionStatus
  discover?(config: TConfig): AirbyteCatalog
  read(
    config: TConfig,
    catalog: ConfiguredAirbyteCatalog,
    state: TState,
  ): Source
}

/**
 * https://docs.airbyte.com/understanding-airbyte/airbyte-protocol-docker/#destination
 * spec() -> ConnectorSpecification
 * check(Config) -> AirbyteConnectionStatus
 * write(Config, AirbyteCatalog, Stream<AirbyteMessage>(stdin)) -> Stream<AirbyteStateMessage>
 */
export interface DestinationConnector<TConfig> {
  spec?(): ConnectorSpecification
  check?(config: TConfig): AirbyteConnectionStatus
  /** This gets turned into the destination */
  write(config: TConfig, catalog: AirbyteCatalog, source: Source): Source
}
