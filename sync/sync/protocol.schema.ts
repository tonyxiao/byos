/**
 * AirbyteProtocol structs
 */
export interface AirbyteProtocol {
    airbyte_message?:            AirbyteMessage;
    configured_airbyte_catalog?: ConfiguredAirbyteCatalog;
    [property: string]: any;
}

export interface AirbyteMessage {
    /**
     * catalog message: the catalog
     */
    catalog?:          AirbyteCatalog;
    connectionStatus?: AirbyteConnectionStatus;
    /**
     * connector config message: a message to communicate an updated configuration from a
     * connector that should be persisted
     */
    control?: AirbyteControlMessage;
    /**
     * log message: any kind of logging you want the platform to know about.
     */
    log?: AirbyteLogMessage;
    /**
     * record message: the record
     */
    record?: AirbyteRecordMessage;
    spec?:   ConnectorSpecification;
    /**
     * schema message: the state. Must be the last message produced. The platform uses this
     * information
     */
    state?: AirbyteStateMessage;
    /**
     * trace message: a message to communicate information about the status and performance of a
     * connector
     */
    trace?: AirbyteTraceMessage;
    /**
     * Message type
     */
    type: Type;
    [property: string]: any;
}

/**
 * catalog message: the catalog
 *
 * Airbyte stream schema catalog
 */
export interface AirbyteCatalog {
    streams: AirbyteStream[];
    [property: string]: any;
}

export interface AirbyteStream {
    /**
     * Path to the field that will be used to determine if a record is new or modified since the
     * last sync. If not provided by the source, the end user will have to specify the
     * comparable themselves.
     */
    default_cursor_field?: string[];
    /**
     * Stream schema using Json Schema specs.
     */
    json_schema: { [key: string]: any };
    /**
     * Stream's name.
     */
    name: string;
    /**
     * Optional Source-defined namespace. Currently only used by JDBC destinations to determine
     * what schema to write to. Airbyte streams from the same sources should have the same
     * namespace.
     */
    namespace?: string;
    /**
     * If the source defines the cursor field, then any other cursor field inputs will be
     * ignored. If it does not, either the user_provided one is used, or the default one is used
     * as a backup.
     */
    source_defined_cursor?: boolean;
    /**
     * If the source defines the primary key, paths to the fields that will be used as a primary
     * key. If not provided by the source, the end user will have to specify the primary key
     * themselves.
     */
    source_defined_primary_key?: Array<string[]>;
    /**
     * List of sync modes supported by this stream.
     */
    supported_sync_modes: SyncMode[];
    [property: string]: any;
}

export enum SyncMode {
    FullRefresh = "full_refresh",
    Incremental = "incremental",
}

/**
 * Airbyte connection status
 */
export interface AirbyteConnectionStatus {
    message?: string;
    status:   Status;
    [property: string]: any;
}

export enum Status {
    Failed = "FAILED",
    Succeeded = "SUCCEEDED",
}

/**
 * connector config message: a message to communicate an updated configuration from a
 * connector that should be persisted
 */
export interface AirbyteControlMessage {
    /**
     * connector config orchestrator message: the updated config for the platform to store for
     * this connector
     */
    connectorConfig?: AirbyteControlConnectorConfigMessage;
    /**
     * the time in ms that the message was emitted
     */
    emitted_at: number;
    /**
     * the type of orchestrator message
     */
    type: OrchestratorType;
    [property: string]: any;
}

/**
 * connector config orchestrator message: the updated config for the platform to store for
 * this connector
 */
export interface AirbyteControlConnectorConfigMessage {
    /**
     * the config items from this connector's spec to update
     */
    config: { [key: string]: any };
    [property: string]: any;
}

/**
 * the type of orchestrator message
 */
export enum OrchestratorType {
    ConnectorConfig = "CONNECTOR_CONFIG",
}

/**
 * log message: any kind of logging you want the platform to know about.
 */
export interface AirbyteLogMessage {
    /**
     * log level
     */
    level: Level;
    /**
     * log message
     */
    message: string;
    /**
     * an optional stack trace if the log message corresponds to an exception
     */
    stack_trace?: string;
    [property: string]: any;
}

/**
 * log level
 */
export enum Level {
    Debug = "DEBUG",
    Error = "ERROR",
    Fatal = "FATAL",
    Info = "INFO",
    Trace = "TRACE",
    Warn = "WARN",
}

/**
 * record message: the record
 */
export interface AirbyteRecordMessage {
    /**
     * record data
     */
    data: { [key: string]: any };
    /**
     * when the data was emitted from the source. epoch in millisecond.
     */
    emitted_at: number;
    /**
     * Information about this record added mid-sync
     */
    meta?: AirbyteRecordMessageMeta;
    /**
     * namespace the data is associated with
     */
    namespace?: string;
    /**
     * stream the data is associated with
     */
    stream: string;
    [property: string]: any;
}

/**
 * Information about this record added mid-sync
 */
export interface AirbyteRecordMessageMeta {
    /**
     * Lists of changes to the content of this record which occurred during syncing
     */
    changes?: AirbyteRecordMessageMetaChange[];
    [property: string]: any;
}

export interface AirbyteRecordMessageMetaChange {
    /**
     * The type of change that occurred
     */
    change: Change;
    /**
     * The field that had the change occur (required)
     */
    field: string;
    /**
     * The reason that the change occurred
     */
    reason: Reason;
    [property: string]: any;
}

/**
 * The type of change that occurred
 */
export enum Change {
    Nulled = "NULLED",
    Truncated = "TRUNCATED",
}

/**
 * The reason that the change occurred
 */
export enum Reason {
    DestinationFieldSizeLimitation = "DESTINATION_FIELD_SIZE_LIMITATION",
    DestinationRecordSizeLimitation = "DESTINATION_RECORD_SIZE_LIMITATION",
    DestinationSerializationError = "DESTINATION_SERIALIZATION_ERROR",
    DestinationTypecastError = "DESTINATION_TYPECAST_ERROR",
    PlatformFieldSizeLimitation = "PLATFORM_FIELD_SIZE_LIMITATION",
    PlatformRecordSizeLimitation = "PLATFORM_RECORD_SIZE_LIMITATION",
    PlatformSerializationError = "PLATFORM_SERIALIZATION_ERROR",
    SourceFieldSizeLimitation = "SOURCE_FIELD_SIZE_LIMITATION",
    SourceRecordSizeLimitation = "SOURCE_RECORD_SIZE_LIMITATION",
    SourceRetrievalError = "SOURCE_RETRIEVAL_ERROR",
    SourceSerializationError = "SOURCE_SERIALIZATION_ERROR",
}

/**
 * Specification of a connector (source/destination)
 */
export interface ConnectorSpecification {
    /**
     * Additional and optional specification object to describe what an 'advanced' Auth flow
     * would need to function.
     * - A connector should be able to fully function with the configuration as described by the
     * ConnectorSpecification in a 'basic' mode.
     * - The 'advanced' mode provides easier UX for the user with UI improvements and
     * automations. However, this requires further setup on the
     * server side by instance or workspace admins beforehand. The trade-off is that the user
     * does not have to provide as many technical
     * inputs anymore and the auth process is faster and easier to complete.
     */
    advanced_auth?: AdvancedAuth;
    changelogUrl?:  string;
    /**
     * ConnectorDefinition specific blob. Must be a valid JSON string.
     */
    connectionSpecification: { [key: string]: any };
    documentationUrl?:       string;
    /**
     * the Airbyte Protocol version supported by the connector. Protocol versioning uses SemVer.
     */
    protocol_version?: string;
    /**
     * List of destination sync modes supported by the connector
     */
    supported_destination_sync_modes?: DestinationSyncMode[];
    /**
     * If the connector supports DBT or not.
     */
    supportsDBT?: boolean;
    /**
     * (deprecated) If the connector supports incremental mode or not.
     */
    supportsIncremental?: boolean;
    /**
     * If the connector supports normalization or not.
     */
    supportsNormalization?: boolean;
    [property: string]: any;
}

/**
 * Additional and optional specification object to describe what an 'advanced' Auth flow
 * would need to function.
 * - A connector should be able to fully function with the configuration as described by the
 * ConnectorSpecification in a 'basic' mode.
 * - The 'advanced' mode provides easier UX for the user with UI improvements and
 * automations. However, this requires further setup on the
 * server side by instance or workspace admins beforehand. The trade-off is that the user
 * does not have to provide as many technical
 * inputs anymore and the auth process is faster and easier to complete.
 */
export interface AdvancedAuth {
    auth_flow_type?:             AuthFlowType;
    oauth_config_specification?: OAuthConfigSpecification;
    /**
     * Json Path to a field in the connectorSpecification that should exist for the advanced
     * auth to be applicable.
     */
    predicate_key?: string[];
    /**
     * Value of the predicate_key fields for the advanced auth to be applicable.
     */
    predicate_value?: string;
    [property: string]: any;
}

export enum AuthFlowType {
    Oauth10 = "oauth1.0",
    Oauth20 = "oauth2.0",
}

export interface OAuthConfigSpecification {
    /**
     * OAuth specific blob. This is a Json Schema used to validate Json configurations produced
     * by the OAuth flows as they are
     * returned by the distant OAuth APIs.
     * Must be a valid JSON describing the fields to merge back to
     * `ConnectorSpecification.connectionSpecification`.
     * For each field, a special annotation `path_in_connector_config` can be specified to
     * determine where to merge it,
     *
     * Examples:
     *
     * complete_oauth_output_specification={
     * refresh_token: {
     * type: string,
     * path_in_connector_config: ['credentials', 'refresh_token']
     * }
     * }
     */
    complete_oauth_output_specification?: { [key: string]: any };
    /**
     * OAuth specific blob. This is a Json Schema used to validate Json configurations persisted
     * as Airbyte Server configurations.
     * Must be a valid non-nested JSON describing additional fields configured by the Airbyte
     * Instance or Workspace Admins to be used by the
     * server when completing an OAuth flow (typically exchanging an auth code for refresh
     * token).
     *
     * Examples:
     *
     * complete_oauth_server_input_specification={
     * client_id: {
     * type: string
     * },
     * client_secret: {
     * type: string
     * }
     * }
     */
    complete_oauth_server_input_specification?: { [key: string]: any };
    /**
     * OAuth specific blob. This is a Json Schema used to validate Json configurations persisted
     * as Airbyte Server configurations that
     * also need to be merged back into the connector configuration at runtime.
     * This is a subset configuration of `complete_oauth_server_input_specification` that
     * filters fields out to retain only the ones that
     * are necessary for the connector to function with OAuth. (some fields could be used during
     * oauth flows but not needed afterwards, therefore
     * they would be listed in the `complete_oauth_server_input_specification` but not
     * `complete_oauth_server_output_specification`)
     * Must be a valid non-nested JSON describing additional fields configured by the Airbyte
     * Instance or Workspace Admins to be used by the
     * connector when using OAuth flow APIs.
     * These fields are to be merged back to `ConnectorSpecification.connectionSpecification`.
     * For each field, a special annotation `path_in_connector_config` can be specified to
     * determine where to merge it,
     *
     * Examples:
     *
     * complete_oauth_server_output_specification={
     * client_id: {
     * type: string,
     * path_in_connector_config: ['credentials', 'client_id']
     * },
     * client_secret: {
     * type: string,
     * path_in_connector_config: ['credentials', 'client_secret']
     * }
     * }
     */
    complete_oauth_server_output_specification?: { [key: string]: any };
    /**
     * OAuth specific blob. This is a Json Schema used to validate Json configurations used as
     * input to OAuth.
     * Must be a valid non-nested JSON that refers to properties from
     * ConnectorSpecification.connectionSpecification
     * using special annotation 'path_in_connector_config'.
     * These are input values the user is entering through the UI to authenticate to the
     * connector, that might also shared
     * as inputs for syncing data via the connector.
     *
     * Examples:
     *
     * if no connector values is shared during oauth flow,
     * oauth_user_input_from_connector_config_specification=[]
     * if connector values such as 'app_id' inside the top level are used to generate the API
     * url for the oauth flow,
     * oauth_user_input_from_connector_config_specification={
     * app_id: {
     * type: string
     * path_in_connector_config: ['app_id']
     * }
     * }
     * if connector values such as 'info.app_id' nested inside another object are used to
     * generate the API url for the oauth flow,
     * oauth_user_input_from_connector_config_specification={
     * app_id: {
     * type: string
     * path_in_connector_config: ['info', 'app_id']
     * }
     * }
     */
    oauth_user_input_from_connector_config_specification?: { [key: string]: any };
    [property: string]: any;
}

export enum DestinationSyncMode {
    Append = "append",
    AppendDedup = "append_dedup",
    Overwrite = "overwrite",
}

/**
 * schema message: the state. Must be the last message produced. The platform uses this
 * information
 */
export interface AirbyteStateMessage {
    /**
     * (Deprecated) the state data
     */
    data?:             { [key: string]: any };
    destinationStats?: AirbyteStateStats;
    global?:           AirbyteGlobalState;
    sourceStats?:      AirbyteStateStats;
    stream?:           AirbyteStreamState;
    type?:             AirbyteStateType;
    [property: string]: any;
}

export interface AirbyteStateStats {
    /**
     * the number of records which were emitted for this state message, for this stream or
     * global. While the value should always be a round number, it is defined as a double to
     * account for integer overflows, and the value should always have a decimal point for
     * proper serialization.
     */
    recordCount?: number;
    [property: string]: any;
}

export interface AirbyteGlobalState {
    shared_state?: { [key: string]: any };
    stream_states: AirbyteStreamState[];
    [property: string]: any;
}

export interface AirbyteStreamState {
    stream_descriptor: StreamDescriptor;
    stream_state?:     { [key: string]: any };
    [property: string]: any;
}

/**
 * The stream associated with the error, if known (optional)
 *
 * The stream associated with the status
 */
export interface StreamDescriptor {
    name:       string;
    namespace?: string;
    [property: string]: any;
}

/**
 * The type of state the other fields represent. Is set to LEGACY, the state data should be
 * read from the `data` field for backwards compatibility. If not set, assume the state
 * object is type LEGACY. GLOBAL means that the state should be read from `global` and means
 * that it represents the state for all the streams. It contains one shared state and
 * individual stream states. PER_STREAM means that the state should be read from `stream`.
 * The state present in this field correspond to the isolated state of the associated stream
 * description.
 */
export enum AirbyteStateType {
    Global = "GLOBAL",
    Legacy = "LEGACY",
    Stream = "STREAM",
}

/**
 * trace message: a message to communicate information about the status and performance of a
 * connector
 */
export interface AirbyteTraceMessage {
    analytics?: AirbyteAnalyticsTraceMessage;
    /**
     * the time in ms that the message was emitted
     */
    emitted_at: number;
    /**
     * error trace message: the error object
     */
    error?: AirbyteErrorTraceMessage;
    /**
     * Estimate trace message: a guess at how much data will be produced in this sync
     */
    estimate?: AirbyteEstimateTraceMessage;
    /**
     * Stream status trace message:  the current status of a stream within a source
     */
    stream_status?: AirbyteStreamStatusTraceMessage;
    /**
     * the type of trace message
     */
    type: TraceType;
    [property: string]: any;
}

/**
 * A message to communicate usage information about the connector which is not captured by
 * regular sync analytics because it's specific to the connector internals.
 * This is useful to understand how the connector is used and how to improve it. Each
 * message is an event with a type and an optional payload value (both of them being
 * strings). The event types should not be dynamically generated but defined statically. The
 * payload value is optional and can contain arbitrary strings.
 */
export interface AirbyteAnalyticsTraceMessage {
    /**
     * The event type - should be a static string. Keep in mind that all strings are shared
     * across all connectors.
     */
    type: string;
    /**
     * The value of the event - can be an arbitrary string. In case the value is numeric, it
     * should be converted to a string. Casting for analytics purposes can happen in the
     * warehouse.
     */
    value?: string;
    [property: string]: any;
}

/**
 * error trace message: the error object
 */
export interface AirbyteErrorTraceMessage {
    /**
     * The type of error
     */
    failure_type?: FailureType;
    /**
     * The internal error that caused the failure
     */
    internal_message?: string;
    /**
     * A user-friendly message that indicates the cause of the error
     */
    message: string;
    /**
     * The full stack trace of the error
     */
    stack_trace?: string;
    /**
     * The stream associated with the error, if known (optional)
     */
    stream_descriptor?: StreamDescriptor;
    [property: string]: any;
}

/**
 * The type of error
 */
export enum FailureType {
    ConfigError = "config_error",
    SystemError = "system_error",
    TransientError = "transient_error",
}

/**
 * Estimate trace message: a guess at how much data will be produced in this sync
 */
export interface AirbyteEstimateTraceMessage {
    /**
     * The estimated number of bytes to be emitted by this sync for this stream
     */
    byte_estimate?: number;
    /**
     * The name of the stream
     */
    name: string;
    /**
     * The namespace of the stream
     */
    namespace?: string;
    /**
     * The estimated number of rows to be emitted by this sync for this stream
     */
    row_estimate?: number;
    /**
     * Estimates are either per-stream (STREAM) or for the entire sync (SYNC). STREAM is
     * preferred, and requires the source to count how many records are about to be emitted
     * per-stream (e.g. there will be 100 rows from this table emitted). For the rare source
     * which cannot tell which stream a record belongs to before reading (e.g. CDC databases),
     * SYNC estimates can be emitted. Sources should not emit both STREAM and SOURCE estimates
     * within a sync.
     */
    type: EstimateType;
    [property: string]: any;
}

/**
 * Estimates are either per-stream (STREAM) or for the entire sync (SYNC). STREAM is
 * preferred, and requires the source to count how many records are about to be emitted
 * per-stream (e.g. there will be 100 rows from this table emitted). For the rare source
 * which cannot tell which stream a record belongs to before reading (e.g. CDC databases),
 * SYNC estimates can be emitted. Sources should not emit both STREAM and SOURCE estimates
 * within a sync.
 */
export enum EstimateType {
    Stream = "STREAM",
    Sync = "SYNC",
}

/**
 * Stream status trace message:  the current status of a stream within a source
 */
export interface AirbyteStreamStatusTraceMessage {
    /**
     * The current status of the stream
     */
    status: AirbyteStreamStatus;
    /**
     * The stream associated with the status
     */
    stream_descriptor: StreamDescriptor;
    [property: string]: any;
}

/**
 * The current status of the stream
 *
 * The current status of a stream within the context of an executing synchronization job.
 */
export enum AirbyteStreamStatus {
    Complete = "COMPLETE",
    Incomplete = "INCOMPLETE",
    Running = "RUNNING",
    Started = "STARTED",
}

/**
 * the type of trace message
 */
export enum TraceType {
    Analytics = "ANALYTICS",
    Error = "ERROR",
    Estimate = "ESTIMATE",
    StreamStatus = "STREAM_STATUS",
}

/**
 * Message type
 */
export enum Type {
    Catalog = "CATALOG",
    ConnectionStatus = "CONNECTION_STATUS",
    Control = "CONTROL",
    Log = "LOG",
    Record = "RECORD",
    Spec = "SPEC",
    State = "STATE",
    Trace = "TRACE",
}

/**
 * Airbyte stream schema catalog
 */
export interface ConfiguredAirbyteCatalog {
    streams: ConfiguredAirbyteStream[];
    [property: string]: any;
}

export interface ConfiguredAirbyteStream {
    /**
     * Path to the field that will be used to determine if a record is new or modified since the
     * last sync. This field is REQUIRED if `sync_mode` is `incremental`. Otherwise it is
     * ignored.
     */
    cursor_field?:         string[];
    destination_sync_mode: DestinationSyncMode;
    /**
     * Monotically increasing numeric id representing the current generation of a stream. This
     * id can be shared across syncs.
     * If this is null, it means that the platform is not supporting the refresh and it is
     * expected that no extra id will be added to the records and no data from previous
     * generation will be cleanup.
     */
    generation_id?: number;
    /**
     * The minimum generation id which is needed in a stream. If it is present, the destination
     * will try to delete the data that are part of a generation lower than this property. If
     * the minimum generation is equals to 0, no data deletion is expected from the destiantion
     * If this is null, it means that the platform is not supporting the refresh and it is
     * expected that no extra id will be added to the records and no data from previous
     * generation will be cleanup.
     */
    minimum_generation_id?: number;
    /**
     * Paths to the fields that will be used as primary key. This field is REQUIRED if
     * `destination_sync_mode` is `*_dedup`. Otherwise it is ignored.
     */
    primary_key?: Array<string[]>;
    stream:       AirbyteStream;
    /**
     * Monotically increasing numeric id representing the current sync id. This is aimed to be
     * unique per sync.
     * If this is null, it means that the platform is not supporting the refresh and it is
     * expected that no extra id will be added to the records and no data from previous
     * generation will be cleanup.
     */
    sync_id?:  number;
    sync_mode: SyncMode;
    [property: string]: any;
}
