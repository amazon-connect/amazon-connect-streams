// Type definitions for Amazon Connect Streams API 1.4
// Project: https://github.com/aws/amazon-connect-streams
// Definitions by: Andy Hopper <https://github.com/andyhopp>, Marco Gonzalez <https://github.com/marcogrcr>
// TypeScript Version: 3.0
declare namespace connect {
  /**
   * A callback to receive `Agent` API object instances.
   *
   * @param agent The `Agent` API object instance.
   */
  type AgentCallback = (agent: Agent) => void;

  /**
   * A callback to receive `AgentMutedStatus` API object instances.
   *
   * @param agentMutedStatus The `AgentMutedStatus` API object instance.
   */
  type AgentMutedStatusCallback = (agentMutedStatus: AgentMutedStatus) => void;

  /**
   * A callback to receive an agent state change event.
   *
   * @param agentStateChange The agent state change event.
   */
  type AgentStateChangeCallback = (agentStateChange: AgentStateChange) => void;

  /**
   * A callback to receive 'UserMediaDeviceChange' API object instances
   *
   * @param userMediaDeviceChange The 'UserMediaDeviceChange' API object instance
   */
  type UserMediaDeviceChangeCallback = (userMediaDeviceChange: UserMediaDeviceChange) => void;

  /**
   * A callback to receive `SoftphoneError` errors.
   *
   * @param error A `SoftphoneError` error.
   */
  type SoftphoneErrorCallback = (error: SoftphoneError) => void;

  /**
   * Subscribe a method to be called when the agent is initialized.
   * If the agent has already been initialized, the call is synchronous and the callback is invoked immediately.
   * Otherwise, the callback is invoked once the first agent data is received from upstream.
   * This callback is provided with an `Agent` API object, which can also be created at any time after initialization is complete via `new connect.Agent()`.
   *
   * @param callback A callback that will receive an `Agent` API object instance.
   */
  function agent(callback: AgentCallback): void;

  /**
   * A callback to receive `Contact` API object instances.
   *
   * @param contact A `Contact` API object instance.
   */
  type ContactCallback = (contact: Contact) => void;

  /**
   * A callback to receive `ViewContactEvent` objects.
   *
   * @param contact A `ViewContactEvent` object.
   */
  type ViewContactCallback = (contact: ViewContactEvent) => void;

  /**
   * Subscribe a method to be called for each newly detected agent contact.
   * Note that this function is not only for incoming contacts, but for contacts which already existed when Streams was initialized, such as from a previous agent session.
   * This callback is provided with a `Contact` API object for this contact. `Contact` API objects can also be listed from the `Agent` API by calling `agent.getContacts()`.
   *
   * @param callback A callback that will receive an `Contact` API object instance.
   */
  function contact(callback: ContactCallback): void;

  /**
   * A useful utility function for creating callback closures that bind a function to an object instance.
   *
   * @param scope The instance object to be set as the scope of the function.
   * @param method The method to be encapsulated.
   */
  function hitch<T extends (...args: any[]) => any>(scope: object, method: T): T;

  interface Core {
    /**
     * Integrates with Amazon Connect by loading the pre-built CCP located at `ccpUrl` into an iframe and placing it into the `container` provided.
     * API requests are funneled through this CCP and agent and contact updates are published through it and made available to your JS client code.
     *
     * @param container The DOM element to place the CCP.
     * @param options The CCP init options.
     */
    initCCP(container: HTMLElement, options: InitCCPOptions): void;

    /**
     * Subscribes a callback function to be called when the agent authorization api succeeds.
     */
    onAuthorizeSuccess(f: Function): void;

    /**
     * Subscribes a callback function to be called when the connect.EventType.IFRAME_RETRIES_EXHAUSTED event is triggered.
     * 
     * @param f The callback function.
     */
    onIframeRetriesExhausted(f: Function): void;

    /**
     * Subscribes a callback function to be called when multiple authorization-type CTI API failures have happened.
     * After this event occurs, streams will not try to re-authenticate the user when more CTI API authorization-type (401) failures happen.
     * Note that CTI APIs are the agent, contact, and connection apis (specifically, those listed under the `connect.ClientMethods` enum). 
     * Therefore, it may be prudent to indicate to the agent that there is a problem related to authorization.
     * 
     * @param f The callback function.
     */
    onCTIAuthorizeRetriesExhausted(f: Function): void;

    /**
     * Subscribes a callback function to be called when multiple agent authorization api failures have happened.
     * After this event occurs, streams will not try to redirect the user to login when more agent authorization api failures happen. 
     * Therefore, it may be prudent to indicate to the agent that there is a problem related to authorization.
     * 
     * @param f The callback function.
     */
    onAuthorizeRetriesExhausted(f: Function): void;

    /**
     * Terminates Amazon Connect Streams. Removing any subscription methods that have been called.
     * The CCP iframe will not be removed though, so you'll have to manually remove it.
     */
    terminate(): void;

    /**
     * Changes the currently selected contact in the CCP user interface.
     * Useful when an agent handles more than one concurrent chat.
     *
     * @param contactId The contact ID.
     */
    viewContact(contactId: string): void;

    /**
     * Subscribes a callback that starts whenever the currently selected contact on the CCP changes.
     * The callback is called when the contact changes in the UI (i.e. via `click` events) or via `connect.core.viewContact()`.
     *
     * @param callback A callback that will receive a `ViewContactEvent` object.
     */
    onViewContact(callback: ViewContactCallback): void;

    /**
     * Subscribes a callback that starts whenever authentication fails (e.g. SAML authentication).
     *
     * @param callback A callback that will start whenever authentication fails.
     */
    onAuthFail(callback: SuccessFailCallback): void;

    /**
     * Subscribes a callback that starts whenever authorization fails (i.e. access denied).
     *
     * @param callback A callback that will start whenever access is denied.
     */
    onAccessDenied(callback: SuccessFailCallback): void;

    /**
     * Gets the `WebSocket` manager.
     * This method is only used when integrating with `amazon-connect-chatjs`.
     */
    getWebSocketManager(): any;

    /**
     * Subscribes a callback that executes when the CCP initialization is completed.
     *
     * @param callback A callback that will execute when the CCP initialization is completed.
     */
    onInitialized(callback: Function): void;

    /**
    * Returns a promise that is resolved with the list of media devices from iframe.
    *
    * @param timeout A timeout for the request in milliseconds.
    */
    getFrameMediaDevices(timeout: Number): Promise<any[]>;

    /**
     * Global upstream conduit for external use.
     * 
     */
    upstream?: object | null;
  }

  enum EventType {
    ACKNOWLEDGE = 'acknowledge',
    ACK_TIMEOUT = 'ack_timeout',
    INIT = 'init',
    API_REQUEST = 'api_request',
    API_RESPONSE = 'api_response',
    AUTH_FAIL = 'auth_fail',
    ACCESS_DENIED = 'access_denied',
    CLOSE = 'close',
    CONFIGURE = 'configure',
    LOG = 'log',
    MASTER_REQUEST = 'master_request',
    MASTER_RESPONSE = 'master_response',
    SYNCHRONIZE = 'synchronize',
    TERMINATE = 'terminate',
    TERMINATED = 'terminated',
    SEND_LOGS = 'send_logs',
    RELOAD_AGENT_CONFIGURATION = 'reload_agent_configuration',
    BROADCAST = 'broadcast',
    API_METRIC = 'api_metric',
    CLIENT_METRIC = 'client_metric',
    SOFTPHONE_STATS = 'softphone_stats',
    SOFTPHONE_REPORT = 'softphone_report',
    CLIENT_SIDE_LOGS = 'client_side_logs',
    SERVER_BOUND_INTERNAL_LOG = 'server_bound_internal_log',
    MUTE = 'mute',
    IFRAME_STYLE = 'iframe_style',
    IFRAME_RETRIES_EXHAUSTED = 'iframe_retries_exhausted',
    UPDATE_CONNECTED_CCPS = 'update_connected_ccps',
    OUTER_CONTEXT_INFO = 'outer_context_info',
    MEDIA_DEVICE_REQUEST = 'media_device_request',
    MEDIA_DEVICE_RESPONSE = 'media_device_response',
    TAB_ID = 'tab_id',
    AUTHORIZE_SUCCESS = 'authorize_success',
    AUTHORIZE_RETRIES_EXHAUSTED = 'authorize_retries_exhausted',
    CTI_AUTHORIZE_RETRIES_EXHAUSTED = 'cti_authorize_retries_exhausted',
  }

  const core: Core;

  interface AgentApp {
    /** Alias for connect.core.initCCP */
    initCCP(container: HTMLElement, options: InitCCPOptions): void;
    /** Waits for CCP to load to begin iframe communication. */
    initAppCommunication(iframeId: string, endpoint: string): void;
    /** Registers the app to the registry and initializes it. */
    initApp(appName: string, containerId: string, appUrl: string, config?: AppOptions): void;
    /** Destoys the app by calling the destroy method defined in the app registry. */
    stopApp(): void;
    /** Memoizes app data along with start and stop functions. */
    AppRegistry: AppRegistry;
  }

  const agentApp: AgentApp;

  interface AppOptions {
    /** Optional CCP configuration that overrides and gets merged with defaults. */
    ccpParams?: OptionalInitCCPOptions;
    /** Optional inline styling for the app iframe. */
    style?: string;
  }

  interface AppRegistry {
    /** Saves app data to memory. */
    register(appName: string, config: AppRegistryOptions, containerDOM: HTMLElement): void;
    /** Initializes the app by calling the init method defined in the creator. */
    start(appName: string, creator: AppCreator): void;
    /** Destoys the app by calling the destroy method defined in the creator. */
    stop(): void;
  }

  type AppCreator = (moduleData: AppData) => AppMethods;

  type AppData = {
    containerDOM: HTMLElement;
    endpoint: string;
    style?: string;
    instance?: AppMethods;
  }

  interface AppMethods {
    init(): void;
    destroy(): void;
  }

  interface AppRegistryOptions {
    /** This is the page you would normally navigate to in order to use the app in a standalone page. */
    endpoint: string;
    /** An optional string to supply inline styling for the iframe. */
    style?: string;
  }

  interface ViewContactEvent {
    /** The ID of the viewed contact. */
    contactId: string;
  }

  interface SoftPhoneOptions {
    /**
     * Normally, the softphone microphone and speaker components are not allowed to be hosted in an iframe.
     * This is because the softphone must be hosted in a single window or tab.
     * The window hosting the softphone session must not be closed during the course of a softphone call or the call will be disconnected.
     * If `allowFramedSoftphone` is `true`, the softphone components will be allowed to be hosted in this window or tab.
     */
    readonly allowFramedSoftphone?: boolean;

    /** This option allows you to completely disable the built-in ringtone audio that is played when a call is incoming. */
    readonly disableRingtone?: boolean;

    /** If the ringtone is not disabled, this allows for overriding the ringtone with any browser-supported audio file accessible by the user. */
    readonly ringtoneUrl?: string;
  }

  interface ChatOptions {
    /** This option allows you to completely disable the built-in ringtone audio that is played when a chat is incoming. */
    readonly disableRingtone?: boolean;

    /** If the ringtone is not disabled, this allows for overriding the ringtone with any browser-supported audio file accessible by the user. */
    readonly ringtoneUrl?: string;
  }

  interface LoginOptions {
    /*
    * Whether to auto close the login prompt.
    */
    autoClose?: boolean,
    /*
    * The height of the login prompt window.
    */
    height?: number,
    /*
    * The width of the login prompt window.
    */
    width?: number,
    /*
    * The top of the login prompt window.
    */
    top?: number,
    /*
    * The left of the login prompt window.
    */
    left?: number
  }

  interface PageOptions {
    /**
     * If `true`, the settings tab will display a section for configuring audio input and output devices for the agent's local machine.
     * If `false`, or if `pageOptions` is not provided, the agent will not be able to change audio device settings from the settings tab.
     */
    readonly enableAudioDeviceSettings?: boolean;

    /**
     * If `true`, or if `pageOptions` is not provided, the settings tab will display a section for configuring the agent's phone type and deskphone number.
     * If `false`, the agent will not be able to change the phone type or deskphone number from the settings tab.
     */
    readonly enablePhoneTypeSettings?: boolean;
  }

  interface InitCCPOptions {
    /**
     * The URL of the CCP.
     * This is the page you would normally navigate to in order to use the CCP in a standalone page, it is different for each instance.
     */
    readonly ccpUrl: string;

    /**
     * Amazon connect instance region. Only required for chat channel.
     * @example "us-west-2"
     */
    readonly region?: string;

    /**
     * Set to `false` to disable the login popup which is shown when the user's authentication expires.
     * @default true
     */
    readonly loginPopup?: boolean;

    /**
     * Options to open login popup in a new window instead of a new tab. If loginPopup is set to
     * `false`, these options will be ignored.
     */
    readonly loginOptions?: LoginOptions;

    /**
     * Set to `true` in conjunction with the `loginPopup` parameter to automatically close the login
     * Popup window once the authentication step has completed. If the login page opened in a new
     * tab, this parameter will also auto-close that tab.
     * @default false
     */
    readonly loginPopupAutoClose?: boolean;

    /** Allows custom URL to be used to initiate the ccp, as in the case of SAML authentication. */
    readonly loginUrl?: string;

    /** Allows you to specify some settings surrounding the softphone feature of Connect. */
    readonly softphone?: SoftPhoneOptions;

    /** Allows you to specify ringtone settings for Chat. */
    readonly chat?: ChatOptions;

    /**
     * Allows you to customize the title attribute of the CCP iframe.
     * @example "Contact Control Panel"
     */
    readonly iframeTitle?: string;

    /** Allows you to configure which configuration sections are displayed in the settings tab.  **/
    readonly pageOptions?: PageOptions;
  }


  interface OptionalInitCCPOptions {
    /**
     * Amazon connect instance region. Only required for chat channel.
     * @example "us-west-2"
     */
    readonly region?: string;

    /**
     * Set to `false` to disable the login popup which is shown when the user's authentication expires.
     * @default true
     */
    readonly loginPopup?: boolean;

    /**
     * Options to open login popup in a new window instead of a new tab. If loginPopup is set to
     * `false`, these options will be ignored.
     */
    readonly loginOptions?: LoginOptions;

    /**
     * Set to `true` in conjunction with the `loginPopup` parameter to automatically close the login
     * Popup window once the authentication step has completed. If the login page opened in a new
     * tab, this parameter will also auto-close that tab.
     * @default false
     */
    readonly loginPopupAutoClose?: boolean;

    /** Allows custom URL to be used to initiate the ccp, as in the case of SAML authentication. */
    readonly loginUrl?: string;

    /** Allows you to specify some settings surrounding the softphone feature of Connect. */
    readonly softphone?: SoftPhoneOptions;

    /** Allows you to specify ringtone settings for Chat. */
    readonly chat?: ChatOptions;

    /** Allows you to configure which configuration sections are displayed in the settings tab. */
    readonly pageOptions?: PageOptions;
  }

  /** This enumeration lists the different types of agent states. */
  enum AgentStateType {
    /** The agent state hasn't been initialized yet. */
    INIT = "init",

    /** The agent is in a state where they can be routed contacts. */
    ROUTABLE = "routable",

    /** The agent is in a state where they cannot be routed contacts. */
    NOT_ROUTABLE = "not_routable",

    /** The agent is offline. */
    OFFLINE = "offline",
  }

  enum AgentAvailStates {
    INIT = "Init",
    BUSY = "Busy",
    AFTER_CALL_WORK = "AfterCallWork",
    CALLING_CUSTOMER = "CallingCustomer",
    DIALING = "Dialing",
    JOINING = "Joining",
    PENDING_AVAILABLE = "PendingAvailable",
    PENDING_BUSY = "PendingBusy",
  }

  enum AgentErrorStates {
    ERROR = "Error",
    AGENT_HUNG_UP = "AgentHungUp",
    BAD_ADDRESS_AGENT = "BadAddressAgent",
    BAD_ADDRESS_CUSTOMER = "BadAddressCustomer",
    DEFAULT = "Default",
    FAILED_CONNECT_AGENT = "FailedConnectAgent",
    FAILED_CONNECT_CUSTOMER = "FailedConnectCustomer",
    LINE_ENGAGED_AGENT = "LineEngagedAgent",
    LINE_ENGAGED_CUSTOMER = "LineEngagedCustomer",
    MISSED_CALL_AGENT = "MissedCallAgent",
    MISSED_CALL_CUSTOMER = "MissedCallCustomer",
    MULTIPLE_CCP_WINDOWS = "MultipleCcpWindows",
    REALTIME_COMMUNICATION_ERROR = "RealtimeCommunicationError",
  }

  /** This enumeration lists the different types of endpoints. */
  enum EndpointType {
    /** An endpoint pointing to a phone number. */
    PHONE_NUMBER = "phone_number",

    /** An endpoint pointing to an agent in the same instance. */
    AGENT = "agent",

    /** An endpoint pointing to a queue call flow in the same instance. */
    QUEUE = "queue",
  }

  enum ReferenceType {
    URL = "URL",
  }

  /** Lists the different types of connections. */
  enum ConnectionType {
    /** The agent connection. */
    AGENT = "agent",

    /** An inbound connection, usually representing an inbound call. */
    INBOUND = "inbound",

    /** An outbound connection, representing either an outbound call or additional connection added to the contact. */
    OUTBOUND = "outbound",

    /** A special connection type representing a manager listen-in session. */
    MONITORING = "monitoring",
  }

  /** An enumeration listing the different states that a connection can have. */
  enum ConnectionStateType {
    /** The connection has not yet been initialized. */
    INIT = "init",

    /** The connection is being initialized. */
    CONNECTING = "connecting",

    /** The connection is connected to the contact. */
    CONNECTED = "connected",

    /** The connection is connected but on hold. */
    HOLD = "hold",

    /** The connection is no longer connected to the contact. */
    DISCONNECTED = "disconnected",
  }

  enum ContactEvents {
    INIT = "init",
    REFRESH = "refresh",
    DESTROYED = "destroyed",
    INCOMING = "incoming",
    PENDING = "pending",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    MISSED = "missed",
    ACW = "acw",
    VIEW = "view",
    ENDED = "ended",
    ERROR = "error",
    ACCEPTED = "accepted",
  }

  /** An enumeration listing the different high-level states that a contact can have. */
  enum ContactStateType {
    /** Indicates the contact is being initialized. */
    INIT = "init",

    /**
     * Indicates that the contact is incoming and is waiting for acceptance.
     * This state is skipped for `ContactType.VOICE` contacts but is essential for `ContactType.QUEUE_CALLBACK` contacts.
     */
    INCOMING = "incoming",

    /** Indicates the contact is pending. */
    PENDING = "pending",

    /**
     * Indicates that the contact is currently connecting.
     * For `ContactType.VOICE` contacts, this is when the user will accept the incoming call.
     * For all other types, the contact will be accepted during the `ContactStateType.INCOMING` state.
     */
    CONNECTING = "connecting",

    /** Indicates the contact is connected. */
    CONNECTED = "connected",

    /** Indicates the contact timed out before the agent could accept it. */
    MISSED = "missed",

    /** Indicates the contact is rejected */
    REJECTED = "rejected",

    /** Indicates the contact is in an error state. */
    ERROR = "error",

    /** Indicates the contact has ended. */
    ENDED = "ended",
  }

  enum CONTACT_ACTIVE_STATES {
    INCOMING = "incoming",
    PENDING = "pending",
    CONNECTING = "connecting",
    CONNECTED = "connected",
  }

  /** This enumeration lists all of the contact types supported by Connect Streams. */
  enum ContactType {
    /** Normal incoming and outgoing voice calls. */
    VOICE = "voice",

    /**
     * Special outbound voice calls which are routed to agents before being placed.
     * For more information about how to setup and use queued callbacks, see the Amazon Connect user documentation.
     */
    QUEUE_CALLBACK = "queue_callback",

    /** Chat contact. */
    CHAT = "chat",

    /** Task contact. */
    TASK = "task",
  }

  /** This enumeration lists the different types of contact channels. */
  enum ChannelType {
    /** A voice contact. */
    VOICE = "VOICE",

    /** A chat contact. */
    CHAT = "CHAT",

    /** A task contact. */
    TASK = "TASK",
  }

  enum MediaType {
    SOFTPHONE = "softphone",
    CHAT = "chat",
    TASK = "task",
  }

  enum SoftphoneCallType {
    AUDIO_VIDEO = "audio_video",
    VIDEO_ONLY = "video_only",
    AUDIO_ONLY = "audio_only",
    NONE = "none",
  }

  enum SoftphoneErrorTypes {
    UNSUPPORTED_BROWSER = "unsupported_browser",
    MICROPHONE_NOT_SHARED = "microphone_not_shared",
    SIGNALLING_HANDSHAKE_FAILURE = "signalling_handshake_failure",
    SIGNALLING_CONNECTION_FAILURE = "signalling_connection_failure",
    ICE_COLLECTION_TIMEOUT = "ice_collection_timeout",
    USER_BUSY_ERROR = "user_busy_error",
    WEBRTC_ERROR = "webrtc_error",
    REALTIME_COMMUNICATION_ERROR = "realtime_communication_error",
    OTHER = "other",
  }

  enum CTIExceptions {
    ACCESS_DENIED_EXCEPTION = "AccessDeniedException",
    INVALID_STATE_EXCEPTION = "InvalidStateException",
    BAD_ENDPOINT_EXCEPTION = "BadEndpointException",
    INVALID_AGENT_ARNEXCEPTION = "InvalidAgentARNException",
    INVALID_CONFIGURATION_EXCEPTION = "InvalidConfigurationException",
    INVALID_CONTACT_TYPE_EXCEPTION = "InvalidContactTypeException",
    PAGINATION_EXCEPTION = "PaginationException",
    REFRESH_TOKEN_EXPIRED_EXCEPTION = "RefreshTokenExpiredException",
    SEND_DATA_FAILED_EXCEPTION = "SendDataFailedException",
    UNAUTHORIZED_EXCEPTION = "UnauthorizedException",
  }

  /*
   * A callback to receive notifications of success or failure.
   */
  type SuccessFailCallback<T extends any[] = []> = (...args: T) => void;

  interface SuccessFailOptions {
    /** A callback that starts when the operation completes successfully. */
    readonly success?: SuccessFailCallback;

    /** A callback that starts when the operation has an error. */
    readonly failure?: SuccessFailCallback<[string]>;
  }

  interface ConnectOptions extends SuccessFailOptions {
    /** The queue ARN to associate the contact with. */
    readonly queueARN?: string;
  }

  interface AgentSetStateOptions {
    /**  Enables enqueuing agent state while agent is handling a live contact. */
    readonly enqueueNextState?: boolean;
  }

  /**
   * The Agent API provides event subscription methods and action methods which can be called on behalf of the agent.
   * There is only ever one agent per Streams instantiation and all contacts and actions are assumed to be taken on behalf of this one agent.
   */
  class Agent {

    /**
     * Subscribe a method to be called whenever new agent data is available.
     *
     * @param callback A callback to receive the `Agent` API object instance.
     */
    onRefresh(callback: AgentCallback): void;

    /**
     * Subscribe a method to be called when the agent's state changes.
     *
     * @param callback A callback to receive the `AgentStateChange` API object instance.
     */
    onStateChange(callback: AgentStateChangeCallback): void;

    /**
     * Subscribe a method to be called when the agent becomes routable, meaning that they can be routed incoming contacts.
     *
     * @param callback A callback to receive the `Agent` API object instance.
     */
    onRoutable(callback: AgentCallback): void;

    /**
     * Subscribe a method to be called when the agent becomes not-routable, meaning that they are online but cannot be routed incoming contacts.
     *
     * @param callback A callback to receive the `Agent` API object instance.
     */
    onNotRoutable(callback: AgentCallback): void;

    /**
     * Subscribe a method to be called when the agent goes offline.
     *
     * @param callback A callback to receive the `Agent` API object instance.
     */
    onOffline(callback: AgentCallback): void;

    /**
     * Subscribe a method to be called when the agent is put into an error state.
     * This can occur if Streams is unable to get new agent data, or if the agent fails to accept an incoming contact, or in other error cases.
     * It means that the agent is not routable, and may require that the agent switch to a routable state before being able to be routed contacts again.
     *
     * @param callback A callback to receive the `Agent` API object instance.
     */
    onError(callback: AgentCallback): void;

    /**
     * Subscribe a method to be called when the agent is put into an error state specific to softphone funcionality.
     *
     * @param callback A callback to receive the `SoftphoneError` error.
     */
    onSoftphoneError(callback: SoftphoneErrorCallback): void;

    /**
     * Subscribe a method to be called when the agent enters the "After Call Work" (ACW) state.
     * This is a non-routable state which exists to allow agents some time to wrap up after handling a contact before they are routed additional contacts.
     *
     * @param callback A callback to receive the `Agent` API object instance.
     */
    onAfterCallWork(callback: AgentCallback): void;

    /** Get the agent's current 'AgentAvailabilityState' object indicating their actual state type. */
    getAvailabilityState(): AgentAvailabilityState;

    /** Get the agent's current `AgentState` object indicating their availability state type. */
    getState(): AgentState;

    /** Alias for `getState()`. */
    getStatus(): AgentState;

    /** 
     * Get the AgentState object of the agent's enqueued next status. 
     * If the agent has not enqueued a next status, returns null.
     */
    getNextState(): AgentState;


    /**
     * Get the duration of the agent's state in milliseconds relative to local time.
     * This takes into account time skew between the JS client and the Amazon Connect service.
     */
    getStateDuration(): number;

    /**
     * Mostly for internal purposes only.
     * Contains strings which indicates actions that the agent can take in the CCP.
     */
    getPermissions(): string[];

    /**
     * Gets a list of `Contact` API objects for each of the agent's current contacts.
     *
     * @param contactTypeFilter If provided, only contacts of the given `ContactType` enum are returned.
     */
    getContacts(contactTypeFilter?: ContactType): Contact[];

    /** Gets the full `AgentConfiguration` object for the agent. */
    getConfiguration(): AgentConfiguration;

    /**
     * Gets the list of selectable `AgentState` API objects.
     * These are the agent states that can be selected when the agent is not handling a live contact.
     */
    getAgentStates(): AgentStateDefinition[];

    /** Gets the agent's routing profile. */
    getRoutingProfile(): AgentRoutingProfile;

    /**
     * Gets a map of channel type to 1 or 0.
     * 1 represents an enabled channel.
     * 0 represents a disabled channel.
     */
    getChannelConcurrency(): AgentChannelConcurrencyMap;

    /**
     * Gets a number indicating how many concurrent contacts can an agent have on a given channel.
     * 0 represents a disabled channel.
     *
     * @param channel The channel to get the configured concurrency.
     */
    getChannelConcurrency(channel: ChannelType): number;

    /** Gets the agent's user friendly display name. */
    getName(): string;

    /**
     * Gets the agent's phone number.
     * This is the phone number that is dialed by Amazon Connect to connect calls to the agent for incoming and outgoing calls if softphone is not enabled.
     */
    getExtension(): string;

    /** Returns a list of eligible countries to be dialed / deskphone redirected. */
    getDialableCountries(): string[];

    /** Indicates whether the agent's phone calls should route to the agent's browser-based softphone or the telephone number configured as the agent's extension. */
    isSoftphoneEnabled(): boolean;

    /**
     * Updates the agent's configuration with the given `AgentConfiguration` object.
     * The phone number specified must be in E.164 format or the update fails.
     *
     * @param config The desired configuration.
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    setConfiguration(
      config: AgentConfiguration,
      callbacks?: SuccessFailOptions
    ): void;

    /**
     * Set the agent's current availability state.
     * Will enqueue state if the agent is handling a live contact and enqueueNextState is true.
     *
     * @param state The new agent state.
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     * @param options
     */
    setState(
      state: AgentStateDefinition,
      callbacks?: SuccessFailOptions,
      options?: AgentSetStateOptions
    ): void;

    /**
     * Create task contact.
     * Can only be performed if the agent is not handling a live contact.
     *
     * @param taskContact The new task contact.
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    createTask(taskContact: TaskContactDefinition, callbacks?: SuccessFailOptions): void;

    /** Alias for `setState()`. */
    setStatus(
      state: AgentStateDefinition,
      callbacks?: SuccessFailOptions
    ): void;

    /**
     * Creates an outbound contact to the given endpoint.
     *
     * @param endpoint An `Endpoint` API object to connect to.
     * @param connectOptions The connection options.
     */
    connect(endpoint: Endpoint, connectOptions?: ConnectOptions): void;

    /** Returns a list of the ARNs associated with this agent's routing profile's queues. */
    getAllQueueARNs(): string[];

    /**
     * Returns the endpoints associated with the queueARNs specified in `queueARNs`.
     *
     * @param queueARNs A single Queue ARN or a list of Queue ARNs associated with the desired queues.
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    getEndpoints(
      queueARNs: string | string[],
      callbacks: GetEndpointsCallbacks
    ): void;

    /**
     * The data behind the `Agent` API object is ephemeral and changes whenever new data is provided.
     * This method provides an opportunity to create a snapshot version of the `Agent` API object and save it for future use, such as adding to a log file or posting elsewhere.
     */
    toSnapshot(): Agent;

    /** Sets the agent local media to mute mode. */
    mute(): void;

    /** Sets the agent localmedia to unmute mode. */
    unmute(): void;

    /**
     * Sets the speaker device (output device for call audio)
     *
     * @param deviceId The id of the media device.
     */
    setSpeakerDevice(deviceId: string): void;

    /**
     * Sets the microphone device (input device for call audio)
     *
     * @param deviceId The id of the media device.
     */
    setMicrophoneDevice(deviceId: string): void;

    /**
     * Sets the ringer device (output device for ringtone)
     *
     * @param deviceId The id of the media device.
     */
    setRingerDevice(deviceId: string): void;

    /**
     * Subscribe a method to be called when the agent updates the mute status, meaning that agents mute/unmute APIs are called and the local media stream is successfully updated with the new status.
     *
     * @param callback A callback to receive updates on agent mute state
     */
    onMuteToggle(callback: AgentMutedStatusCallback): void;

    /**
     * Creates an outbound contact to the given endpoint.
     *
     * @param endpoint An `Endpoint` API object to connect to.
     * @param connectOptions The connection options.
     */
    connect(endpoint: Endpoint, connectOptions?: ConnectOptions): void;

    /**
     * Subscribe a method to be called when the agent changes the speaker device (output device for call audio).
     *
     * @param callback A callback to receive updates on the speaker device
     */
    onSpeakerDeviceChanged(callback: UserMediaDeviceChangeCallback): void;

    /**
     * Subscribe a method to be called when the agent changes the microphone device (input device for call audio).
     *
     * @param callback A callback to receive updates on the microphone device
     */
    onMicrophoneDeviceChanged(callback: UserMediaDeviceChangeCallback): void;

    /**
     * Subscribe a method to be called when the agent changes the ringer device (output device for ringtone).
     *
     * @param callback A callback to receive updates on the ringer device
     */
    onRingerDeviceChanged(callback: UserMediaDeviceChangeCallback): void;

    /**
     * Subscribe a method to be called when the agent has a nextState.
     *
     * @param callback A callback that is invoked with the Agent object.
     */
    onEnqueuedNextState(callback: AgentCallback): void;
  }

  interface AgentMutedStatus {
    /** A value indicating whether the agent local media is muted. */
    readonly muted: boolean;
  }

  interface AgentStateChange {
    /** The `Agent` API object. */
    readonly agent: Agent;

    /** The name of the agent's previous state. */
    readonly oldState: string;

    /** The name of the agent's new state. */
    readonly newState: string;
  }

  interface AgentStateDefinition {
    /** The agent state ARN. */
    readonly agentStateARN: string;

    /** The agent state type. */
    readonly type: AgentStateType;

    /** The name of the agent state to be displayed in the UI. */
    readonly name: string;
  }

  interface AgentPreferences {
    readonly locale?: string;
  }

  interface UserMediaDeviceChange {
    /** A value indicating the id of the media device. */
    readonly deviceId: string;
  }

  interface TaskContactDefinition {
    /** The  endpoint to assign to */
    readonly endpoint: Endpoint;

    /** The linked contact id */
    readonly previousContactId?: string;

    /** The task name */
    readonly name: string;

    /** The task description */
    readonly description: string;

    /** The task references */
    readonly references: ReferenceDictionary;

    /** The task scheduled time */
    readonly scheduledTime: number;

    /** A random value */
    readonly idempotencyToken: string;

  }

  /**
   * An object containing the current Agent state
   */
  interface AgentAvailabilityState {
    /** The name of the agent's actual state. */
    readonly state: string;
    /** Date indicating when the agent went into the current state. */
    readonly timeStamp: Date;
  }

  /** An object containing the current Agent state. */
  interface AgentState {
    /** The agent's current state ARN. */
    readonly agentStateARN: string | null;

    /** The name of the agent's current availability state. */
    readonly name: string;

    /** Indicates when the state was set. */
    readonly startTimestamp: Date;

    /** The agent's current availability state type, as per the `AgentStateType` enumeration. */
    readonly type: AgentStateType;
  }

  interface AgentConfiguration {
    /** See `agent.getAgentStates()` for more info. */
    readonly agentStates: AgentStateDefinition[];

    readonly agentPreferences?: AgentPreferences;

    /** See `agent.getDialableCountries()` for more info. */
    readonly dialableCountries: string[];

    /** See `agent.getExtension()` for more info. */
    extension: string;

    /** See `agent.getName()` for more info. */
    readonly name: string;

    /** See `agent.getPermissions()` for more info. */
    readonly permissions: string[];

    /** See `agent.getRoutingProfile()` for more info. */
    readonly routingProfile: AgentRoutingProfile;

    /** Indicates whether auto accept soft phone calls is enabled. */
    readonly softphoneAutoAccept: boolean;

    /** See `agent.isSoftphoneEnabled()` for more info. */
    softphoneEnabled: boolean;

    /** The username for the agent as entered in their Amazon Connect user account. */
    readonly username: string;
  }

  interface AgentRoutingProfile {
    /** See `agent.getChannelConcurrency()` for more info. */
    readonly channelConcurrencyMap: AgentChannelConcurrencyMap;

    /** The default queue which should be associated with outbound contacts. */
    readonly defaultOutboundQueue: Queue;

    /** The name of the routing profile. */
    readonly name: string;

    /** The queues contained in the routing profile. */
    readonly queues: Queue[];

    /** The routing profile ARN. */
    readonly routingProfileARN: string;

    /** Alias for `routingProfileARN`. */
    readonly routingProfileId: string;
  }

  type AgentChannelConcurrencyMap = {
    readonly [channel in ChannelType]: number;
  };

  interface GetEndpointsResult {
    endpoints: Endpoint[];
    addresses: Endpoint[];
  }

  interface GetEndpointsCallbacks {
    readonly success: SuccessFailCallback<[GetEndpointsResult]>;
    readonly failure?: SuccessFailCallback<[string]>;
  }

  interface AttributeDictionary {
    readonly [key: string]: {
      name: string;
      value: string;
    };
  }

  interface ReferenceDictionary {
    readonly [key: string]: {
      type: ReferenceType;
      value: string;
    };
  }

  /**
   * The Contact API provides event subscription methods and action methods which can be called on behalf of a specific contact.
   * Contacts come and go and so should these API objects.
   * It is good practice not to persist these objects or keep them as internal state.
   * If you need to, store the `contactId` of the contact and make sure that the contact still exists by fetching it from the `Agent` API object before calling methods on it.
   */
  class Contact {
    /** The unique contactId of this contact. */
    readonly contactId: string;

    /**
     * Subscribe a method to be invoked whenever the contact is updated.
     *
     * @param callback A callback to receive the `Contact` API object instance.
     */
    onRefresh(callback: ContactCallback): void;

    /**
     * Subscribe a method to be invoked when a queue callback contact is incoming.
     * In this state, the contact is waiting to be accepted if it is a softphone call or is waiting for the agent to answer if it is not a softphone call.
     *
     * @param callback A callback to receive the `Contact` API object instance.
     */
    onIncoming(callback: ContactCallback): void;

    /**
     * Subscribe a method to be invoked when the contact is pending.
     * This event is expected to occur before the connecting event.
     *
     * @param callback A callback to receive the `Contact` API object instance.
     */
    onPending(callback: ContactCallback): void;

    /**
     * Subscribe a method to be invoked when the contact is connecting.
     * This works with chat and softphone contacts.
     * This event happens when a call or chat comes in, before accepting (there is an exception for queue callbacks, in which onConnecting's handler is started after the callback is accepted).
     * Note that once the contact has been accepted, the `onAccepted` handler will be triggered.
     *
     * @param callback A callback to receive the `Contact` API object instance.
     */
    onConnecting(callback: ContactCallback): void;

    /**
     * Subscribe a method to be invoked whenever the contact is accepted.
     *
     * @param callback A callback to receive the `Contact` API object instance.
     */
    onAccepted(callback: ContactCallback): void;

    /**
     * Subscribe a method to be invoked whenever the contact is missed.
     * This is an event which is fired when a contact is put in state "missed" by the backend, which happens when the agent does not answer for a certain amount of time, when the agent rejects the call, or when the other participant hangs up before the agent can accept.
     *
     * @param callback A callback to receive the `Contact` API object instance.
     */
    onMissed(callback: ContactCallback): void;

    /**
     * Subscribe a method to be invoked whenever the contact is ended or destroyed.
     * This could be due to the conversation being ended by the agent, or due to the contact being missed.
     * Call `contact.getState()` to determine the state of the contact and take appropriate action.
     *
     * @param callback A callback to receive the `Contact` API object instance.
     */
    onEnded(callback: ContactCallback): void;

    /**
     * Subscribe a method to be invoked whenever the contact is destroyed.
     *
     * @param callback A callback to receive the `Contact` API object instance.
     */
    onDestroy(callback: ContactCallback): void;

    /**
     * Subscribe a method to be invoked whenever the contact enters the ACW state.
     * This is after the connection has been closed, but before the contact is destroyed.
     *
     * @param callback A callback to receive the `Contact` API object instance.
     */
    onACW(callback: ContactCallback): void;

    /**
     * Subscribe a method to be invoked when the contact is connected.
     *
     * @param callback A callback to receive the `Contact` API object instance.
     */
    onConnected(callback: ContactCallback): void;

    /**
     * Subscribe a method to be invoked when the contact error event is triggered. 
     * This event is only triggered when a contact state of type error appears in the snapshot.
     * 
     * @param callback A callback to receive the `Contact` API object instance.
     */
    onError(callback: ContactCallback): void;

    /**
     * Returns a formatted string with the contact event and ID.
     *
     * @param event The event to format.
     */
    getEventName(event: ContactEvents): string;

    /** Get the unique contactId of this contact. */
    getContactId(): string;

    /**
     * Get the original (initial) contact id from which this contact was transferred, or none if this is not an internal Connect transfer.
     * This is typically a contact owned by another agent, thus this agent will not be able to manipulate it.
     * It is for reference and association purposes only, and can be used to share data between transferred contacts externally if it is linked by originalContactId.
     */
    getOriginalContactId(): string;

    /** Alias for `getOriginalContactId()`. */
    getInitialContactId(): string;

    /**
     * Get the type of the contact.
     * This indicates what type of media is carried over the connections of the contact.
     */
    getType(): ContactType;

    /** Get an object representing the state of the contact. */
    getState(): ContactState;

    /** Alias for `getStatus()` */
    getStatus(): ContactState;

    /** Get name for the contact. */
    getName(): string;

    /** Get description for the contact. */
    getDescription(): string;

    /** Get references for the contact. */
    getReferences(): ReferenceDictionary;

    /**
     * Get the duration of the contact state in milliseconds relative to local time.
     * This takes into account time skew between the JS client and the Amazon Connect backend servers.
     */
    getStateDuration(): number;

    /** Alias for `getStateDuration()` */
    getStatusDuration(): number;

    /** Get the queue associated with the contact. */
    getQueue(): Queue;

    /** Gets the timestamp associated with when the contact was placed in the queue. */
    getQueueTimestamp(): Date;

    /** Get a list containing `Connection` API objects for each connection in the contact. */
    getConnections(): BaseConnection[];

    /** Get the initial connection of the contact. */
    getInitialConnection(): BaseConnection;

    /** Get the initial connection of the contact, or null if the initial connection is no longer active. */
    getActiveInitialConnection(): BaseConnection | null;

    /** Get a list of all of the third-party connections, i.e. the list of all connections except for the initial connection, or an empty list if there are no third-party connections. */
    getThirdPartyConnections(): BaseConnection[];

    /**
     * In Voice contacts, there can only be one active third-party connection.
     * This method returns the single active third-party connection, or null if there are no currently active third-party connections.
     */
    getSingleActiveThirdPartyConnection(): BaseConnection | null;

    /**
     * Gets the agent connection.
     * This is the connection that represents the agent's participation in the contact.
     */
    getAgentConnection(): BaseConnection;

    /** Gets a map of the attributes associated with the contact. */
    getAttributes(): AttributeDictionary;

    /** Determine whether this contact is a softphone call.  */
    isSoftphoneCall(): boolean;

    /** Determine whether this is an inbound or outbound contact. */
    isInbound(): boolean;

    /**
     * Determine whether the contact is in a connected state.
     * Note that contacts no longer exist once they have been removed.
     * To detect these instances, subscribe to the `contact.onEnded()` event for the contact.
     */
    isConnected(): boolean;

    /**
     * Accept an incoming contact.
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    accept(callbacks?: SuccessFailOptions): void;

    /**
     * Close the contact and all of its associated connections.
     * This method can also reject and clear contacts but those behaviors will be deprecated.
     * If the contact is a voice contact, and there is a third-party, the customer remains bridged with the third party and will not be disconnected from the call.
     * Otherwise, the agent and customer are disconnected.
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    destroy(callbacks?: SuccessFailOptions): void;

    /**
     * Reject an incoming contact.
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    reject(callbacks?: SuccessFailOptions): void;

    /**
     * Clear the contact.
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    clear(callbacks: SuccessFailOptions): void;

    /**
     * This is an API that completes this contact entirely.
     * That means that this should only be used for non-monitoring agent connections.
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    complete(callbacks?: SuccessFailOptions): void;

    /**
     * Provide diagnostic information for the contact in the case something exceptional happens on the front end.
     * The Streams logs will be published along with the issue code and description provided here.
     *
     * @param issueCode An arbitrary issue code to associate with the diagnostic report.
     * @param description A description to associate with the diagnostic report.
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    notifyIssue(
      issueCode: string,
      description: string,
      callbacks?: SuccessFailOptions
    ): void;

    /**
     * Add a new outbound third-party connection to this contact and connect it to the specified endpoint.
     *
     * @param endpoint The endpoint to add.
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    addConnection(endpoint: Endpoint, callbacks?: SuccessFailOptions): void;

    /**
     * Rotate through the connected and on hold connections of the contact.
     * This operation is only valid if there is at least one third-party connection and the initial connection is still connected.
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    toggleActiveConnections(callbacks?: SuccessFailOptions): void;

    /**
     * Conference together the active connections of the conversation.
     * This operation is only valid if there is at least one third-party connection and the initial connection is still connected.
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    conferenceConnections(callbacks?: SuccessFailOptions): void;

    /**
     * The data behind the `Contact` API object is ephemeral and changes whenever new data is provided.
     * This method provides an opportunity to create a snapshot version of the `Contact` API object and save it for future use, such as adding to a log file or posting elsewhere.
     */
    toSnapshot(): Contact;

    /** Determine whether this contact is a softphone call and multiparty conference feature is turned on.  */
    isMultiPartyConferenceEnabled(): boolean;
  }

  interface ContactState {
    /** The contact state type, as per the ContactStateType enumeration. */
    readonly type: ContactStateType;

    /** Indicates when the the contact was put in that state. */
    readonly timestamp: Date;
  }

  interface Queue {
    /** The name of the queue. */
    readonly name: string;

    /** The ARN of the queue. */
    readonly queueARN: string;

    /** Alias for `queueARN`. */
    readonly queueId: string;
  }

  class Endpoint {
    readonly endpointARN: string;
    readonly endpointId: string;
    readonly type: EndpointType;
    readonly name: string;
    readonly phoneNumber: string;
    readonly agentLogin: string;
    readonly queue: string;

    /**
     * Creates an endpoint from a E.164 phone number.
     *
     * @param phoneNumber The E.164 endpoint phone number.
     */
    static byPhoneNumber(phoneNumber: string): Endpoint;
  }

  class SoftphoneError {
    readonly errorType: string;
    readonly errorMessage: string;
    readonly endPointUrl: string;

    constructor(errorType: string, errorMessage: string, endPointUrl: string);

    getErrorType(): string;

    getErrorMessage(): string;

    getEndPointUrl(): string;
  }

  /**
   * The Connection API provides action methods (no event subscriptions) which can be called to manipulate the state of a particular connection within a contact.
   * Like contacts, connections come and go.
   * It is good practice not to persist these objects or keep them as internal state.
   * If you need to, store the contactId and connectionId of the connection and make sure that the contact and connection still exist by fetching them in order from the Agent API object before calling methods on them.
   */
  class BaseConnection {
    /** The unique contactId of the contact to which this connection belongs. */
    readonly contactId: string;

    /** The unique connectionId for this connection. */
    readonly connectionId: string;

    /** Gets the unique contactId of the contact to which this connection belongs. */
    getContactId(): string;

    /** Gets the unique connectionId for this connection. */
    getConnectionId(): string;

    /** Gets the endpoint to which this connection is connected. */
    getEndpoint(): Endpoint;

    /** Alias for `getEndpoint()`. */
    getAddress(): Endpoint;

    /** Gets the `ConnectionState` object for this connection. */
    getState(): ConnectionState;

    /** Alias for `getState()` */
    getStatus(): ConnectionState;

    /**
     * Get the duration of the connection state, in milliseconds, relative to local time.
     * This takes into account time skew between the JS client and the Amazon Connect service.
     */
    getStateDuration(): number;

    /** Alias for `getStateDuration()` */
    getStatusDuration(): number;

    /** Get the type of connection. */
    getType(): ConnectionType;

    /** Get the currently monitored contact info, or null if that does not exist. */
    getMonitorInfo(): MonitorInfo | null;

    /** Determine if the connection is the contact's initial connection. */
    isInitialConnection(): boolean;

    /**
     * Determine if the contact is active.
     * The connection is active it is incoming, connecting, connected, or on hold.
     */
    isActive(): boolean;

    /** Determine if the connection is connected, meaning that the agent is live in a conversation through this connection. */
    isConnected(): boolean;

    /** Determine whether the connection is in the process of connecting. */
    isConnecting(): boolean;

    /** Determine whether the connection is on hold. */
    isOnHold(): boolean;

    /**
     * Ends the connection.
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    destroy(callbacks?: SuccessFailOptions): void;

    /**
     * Send a digit or string of digits through this connection.
     * This is only valid for contact types that can accept digits, currently this is limited to softphone-enabled voice contacts.
     *
     * @param digits The digits to dial.
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    sendDigits(digits: string, callbacks?: SuccessFailOptions): void;

    /**
     * Put this connection on hold.
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    hold(callbacks?: SuccessFailOptions): void;

    /**
     * Resume this connection if it was on hold.
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    resume(callbacks?: SuccessFailOptions): void;
  }

  /**
   * The VoiceConnection API provides action methods (no event subscriptions) which can be called to manipulate the state of a particular voice connection within a contact.
   * Like contacts, connections come and go.
   * It is good practice not to persist these objects or keep them as internal state.
   * If you need to, store the `contactId` and `connectionId` of the connection and make sure that the contact and connection still exist by fetching them in order from the `Agent` API object before calling methods on them.
   */
  class VoiceConnection extends BaseConnection {
    /** Returns the media info object associated with this connection. */
    getMediaInfo(): VoiceMediaInfo;

    /** Returns the `MediaType` enum value: `"softphone"`. */
    getMediaType(): MediaType.SOFTPHONE;

    /** Gets a `Promise` with the media controller associated with this connection. */
    getMediaController(): Promise<any>;

    /** Returns the `SpeakerId` associated to this Voice Connection */
    getVoiceIdSpeakerId(): Promise<any>;

    /** Returns the `VoiceId speaker status` associated to this Voice Connection */
    getVoiceIdSpeakerStatus(): Promise<any>;

    /** Opt out speaker associated to this Voice Connection from VoiceId*/
    optOutVoiceIdSpeaker(): Promise<any>;

    /** Returns VoiceId speaker authentication status */
    evaluateSpeakerWithVoiceId(): Promise<any>;

    /** Enroll speaker into VoiceId */
    enrollSpeakerInVoiceId(): Promise<any>;

    /** Update speaker id */
    updateVoiceIdSpeakerId(): Promise<any>;

    /** Delete speaker id */
    deleteVoiceIdSpeakerId(): Promise<any>;

    /** Returns the quick connect name of the third-party call participant with which the connection is associated. */
    getQuickConnectName(): string | null;

    /** Determine whether the connection is mute server side. */
    isMute(): boolean;

    /**
     * Mute the connection server side
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    muteParticipant(callbacks?: SuccessFailOptions): void;

    /**
     * Unmute the connection server side if it was mute
     *
     * @param callbacks Success and failure callbacks to determine whether the operation was successful.
     */
    unmuteParticipant(callbacks?: SuccessFailOptions): void;

  }

  /**
   * The ChatConnection API provides action methods (no event subscriptions) which can be called to manipulate the state of a particular chat connection within a contact.
   * Like contacts, connections come and go.
   * It is good practice not to persist these objects or keep them as internal state.
   * If you need to, store the `contactId` and `connectionId` of the connection and make sure that the contact and connection still exist by fetching them in order from the `Agent` API object before calling methods on them.
   */
  class ChatConnection extends BaseConnection {
    /** Get the media info object associated with this connection. */
    getMediaInfo(): ChatMediaInfo;

    /** Provides a promise which resolves with the API response from createTransport transportType chat_token for this connection. */
    getConnectionToken(): Promise<ConnectionToken>;

    /** Returns the `MediaType` enum value: `"chat"`.  */
    getMediaType(): MediaType.CHAT;

    /**
     * Gets a `Promise` with the media controller associated with this connection.
     * The promise resolves to a `ChatSession` object from `amazon-connect-chatjs` library.
     */
    getMediaController(): Promise<any>;
  }

  /**
   * The TaskConnection API provides action methods (no event subscriptions) which can be called to manipulate the state of a particular task connection within a contact.
   * Like contacts, connections come and go.
   * It is good practice not to persist these objects or keep them as internal state.
   * If you need to, store the `contactId` and `connectionId` of the connection and make sure that the contact and connection still exist by fetching them in order from the `Agent` API object before calling methods on them.
   */
  class TaskConnection extends BaseConnection {
    /** Get the media info object associated with this connection. */
    getMediaInfo(): TaskMediaInfo;

    /** Returns the `MediaType` enum value: `"task"`.  */
    getMediaType(): MediaType.TASK;

    /**
     * Gets a `Promise` with the media controller associated with this connection.
     * The promise resolves to a `ChatSession` object from `amazon-connect-taskjs` library.
     */
    getMediaController(): Promise<any>;
  }

  interface ConnectionState {
    /** A `Date` object that indicates when the the connection was put in that state. */
    readonly timestamp: Date;

    /** The connection state type, as per the `ConnectionStateType` enumeration. */
    readonly type: ConnectionStateType;
  }

  interface ConnectionToken {
    readonly chatTokenTransport: {
      readonly expiry: string;
      readonly participantToken: string;
    };
  }

  interface VoiceMediaInfo {
    readonly autoAccept: boolean;
    readonly callConfigJson: string;
    readonly callContextToken: string;
    readonly callType: SoftphoneCallType;
    readonly mediaLegContextToken: string;
  }

  interface ChatMediaInfo {
    readonly contactId: string;
    getConnectionToken: ChatConnection["getConnectionToken"];
    readonly initialContactId: string;
    readonly originalInfo: {
      readonly chatAutoAccept: boolean;
      readonly connectionData: string;
      readonly customerName: string | null;
    };
    readonly participantId: string;
    readonly participantToken: string;
  }

  interface TaskMediaInfo {
    readonly contactId: string;
    readonly initialContactId: string;
  }

  interface MonitorInfo {
    readonly agentName: string;
    readonly customerName: string;
    readonly joinTime: Date;
  }

  /**
   * The Streams library comes with a logging utility that can be used to easily gather logs and provide them for diagnostic purposes.
   * You can even add your own logs to this logger if you prefer.
   * Logs are written to the console log per normal and also kept in memory.
   */
  interface Logger {
    /**
     * Adds a log entry with debug level.
     * @param template The `printf`-style template.
     * @param args The arguments to the template.
     */
    debug(template: string, ...args: unknown[]): LogEntry;

    /**
     * Adds a log entry with info level.
     * @param template The `printf`-style template.
     * @param args The arguments to the template.
     */
    info(template: string, ...args: unknown[]): LogEntry;

    /**
     * Adds a log entry with warn level.
     * @param template The `printf`-style template.
     * @param args The arguments to the template.
     */
    warn(template: string, ...args: unknown[]): LogEntry;

    /**
     * Adds a log entry with error level.
     * @param template The `printf`-style template.
     * @param args The arguments to the template.
     */
    error(template: string, ...args: unknown[]): LogEntry;

    /** Downloads the logs on the agent's machine in JSON form. */
    download(): void;
  }

  /** Allows to add additional information to a log entry. */
  interface LogEntry {
    /**
     * Adds an error stack trace and additional info.
     *
     * @param err The error to add.
     */
    withException(err: Error): LogEntry;

    /**
     * Adds an arbitrary object.
     *
     * @param obj The object to add.
     */
    withObject(obj: object): LogEntry;
  }

  /** Gets the global logger instance. */
  function getLog(): Logger;
}
