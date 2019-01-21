// Type definitions for amazon-connect-v1.20-XXXXXX.js
// Project: amazon-connect-streams
// Definitions by: Andy Hopper <andyhopp@amazon.com>

declare namespace connect {
    function agent( callback: (agent: Agent) => void ): void;
    function contact( callback: (contact: Contact) => void ): void;
    let core : Core;
    
    interface Core {
        initCCP(containerDiv: HTMLElement, options: InitCCPOptions);
    }

    interface InitCCPOptions {
        ccpUrl:         string,             /*REQUIRED*/
        loginPopup?:    boolean,            /*optional, default TRUE*/
        softphone?:     {                   /*optional*/
           disableRingtone?:  boolean,      /*optional*/
           allowFramedSoftphone?: boolean,  /*optional*/
           ringtoneUrl?: string             /*optional*/
        }
     }

    enum AgentStateType {
        INIT = 'init',
        ROUTABLE = 'routable',
        NOT_ROUTABLE = 'not_routable',
        OFFLINE = 'offline'
    }

    enum AgentAvailStates {
        INIT = "Init",
        BUSY = "Busy",
        AFTER_CALL_WORK = "AfterCallWork",
        CALLING_CUSTOMER = "CallingCustomer",
        DIALING = "Dialing",
        JOINING = "Joining",
        PENDING_AVAILABLE = "PendingAvailable",
        PENDING_BUSY = "PendingBusy"
    }

    enum AgentErrorStates {
        ERROR = 'Error',
        AGENT_HUNG_UP = 'AgentHungUp',
        BAD_ADDRESS_AGENT = 'BadAddressAgent',
        BAD_ADDRESS_CUSTOMER = 'BadAddressCustomer',
        DEFAULT = 'Default',
        FAILED_CONNECT_AGENT = 'FailedConnectAgent',
        FAILED_CONNECT_CUSTOMER = 'FailedConnectCustomer',
        LINE_ENGAGED_AGENT = 'LineEngagedAgent',
        LINE_ENGAGED_CUSTOMER = 'LineEngagedCustomer',
        MISSED_CALL_AGENT = 'MissedCallAgent',
        MISSED_CALL_CUSTOMER = 'MissedCallCustomer',
        MULTIPLE_CCP_WINDOWS = 'MultipleCcpWindows',
        REALTIME_COMMUNICATION_ERROR = 'RealtimeCommunicationError'
    }

    enum EndpointType {
        PHONE_NUMBER = 'phone_number', 
        AGENT = 'agent',
        QUEUE = 'queue'     
    }

    enum ConnectionType { 
        AGENT = 'agent',
        INBOUND = 'inbound',
        OUTBOUND = 'outbound',
        MONITORING = 'monitoring' 
    }

    enum ConnectionStateType {
        INIT = 'init',
        CONNECTING = 'connecting',
        CONNECTED = 'connected',
        HOLD = 'hold',
        DISCONNECTED = 'disconnected'
    }

    type CONNECTION_ACTIVE_STATES = { [key: string] : number };

    enum ContactStateType {
        INIT = 'init',
        INCOMING = 'incoming',
        PENDING = 'pending',
        CONNECTING = 'connecting',
        CONNECTED = 'connected',
        MISSED = 'missed',
        ERROR = 'error',
        ENDED = 'ended'        
    }

    enum CONTACT_ACTIVE_STATES {
        INCOMING = 'incoming',
        CONNECTING = 'connecting',
        CONNECTED = 'connected' 
    }

    enum ContactType { 
        VOICE = 'voice', 
        QUEUE_CALLBACK = 'queue_callback' 
    }

    enum SoftphoneCallType { 
        AUDIO_VIDEO = 'audio_video',
        VIDEO_ONLY = 'video_only',
        AUDIO_ONLY = 'audio_only',
        NONE = 'none' 
    }

    enum SoftphoneErrorTypes { 
        UNSUPPORTED_BROWSER = 'unsupported_browser',
        MICROPHONE_NOT_SHARED = 'microphone_not_shared',
        SIGNALLING_HANDSHAKE_FAILURE = 'signalling_handshake_failure',
        SIGNALLING_CONNECTION_FAILURE = 'signalling_connection_failure',
        ICE_COLLECTION_TIMEOUT = 'ice_collection_timeout',
        USER_BUSY_ERROR = 'user_busy_error',
        WEBRTC_ERROR = 'webrtc_error',
        REALTIME_COMMUNICATION_ERROR = 'realtime_communication_error',
        OTHER = 'other' 
    }

    enum CTIExceptions { 
        ACCESS_DENIED_EXCEPTION = 'AccessDeniedException',
        INVALID_STATE_EXCEPTION = 'InvalidStateException',
        BAD_ENDPOINT_EXCEPTION = 'BadEndpointException',
        INVALID_AGENT_ARNEXCEPTION = 'InvalidAgentARNException',
        INVALID_CONFIGURATION_EXCEPTION = 'InvalidConfigurationException',
        INVALID_CONTACT_TYPE_EXCEPTION = 'InvalidContactTypeException',
        PAGINATION_EXCEPTION = 'PaginationException',
        REFRESH_TOKEN_EXPIRED_EXCEPTION = 'RefreshTokenExpiredException',
        SEND_DATA_FAILED_EXCEPTION = 'SendDataFailedException',
        UNAUTHORIZED_EXCEPTION = 'UnauthorizedException' 
    }

    type AgentCallback = (agent: Agent) => void;
    interface SuccessFailOptions {
        success?: Function;
        failure?: Function;
    }
    interface ConnectOptions extends SuccessFailOptions {
        queueARN?: string;
    }

    interface Agent {
        // Notifications
        onContactPending(cb: AgentCallback);
        onRefresh(cb: AgentCallback);
        onRoutable(cb: AgentCallback);
        onNotRoutable(cb: AgentCallback);
        onOffline(cb: AgentCallback);
        onError(cb: AgentCallback);
        onAfterCallWork(cb: AgentCallback);

        // API
        getState() : AgentState;
        getStateDuration() : number;
        getPermissions() : string[];
        getContacts(contactTypeFilter: string) : Contact[];
        getConfiguration() : AgentConfiguration;
        getAgentStates() : AgentState[];
        getRoutingProfile() : AgentRoutingProfile;
        getName() : string;
        getExtension(): string;
        isSoftphoneEnabled(): boolean;
        setConfiguration(configuration: AgentConfiguration, SuccessFailOptions);
        setState(state: AgentState, options: SuccessFailOptions);
        connect(endpoint: Endpoint, options: ConnectOptions);
        toSnapshot() : Agent;
    }

    interface AgentState {
        /**
         * The name of the agent's current availability state.
         */
        name: string;
        
        /**
         * The agent's current availability state type, as per the AgentStateType enumeration.
         */
        type: AgentStateType;

        /**
         * A relative local state duration. To get the actual duration of the state relative
         * to the current time, use agent.getStateDuration().
         */
        duration?: number;
    }

    interface AgentConfiguration {

    }

    interface AgentRoutingProfile {
        /**
         * The name of the routing profile.
         */
        name: string;

        /**
         * The queues contained in the routing profile.
         */
        queues: string;

        /**
         * The default queue which should be associated with outbound contacts.
         */
        defaultOutboundQueue: string
    }

    type ContactCallback = (contact: Contact) => void;

    interface Contact {
        // Notifications
        onRefresh(cb: ContactCallback);
        onIncoming(cb: ContactCallback);
        onAccepted(cb: ContactCallback);
        onEnded(cb: ContactCallback);
        onConnected(cb: ContactCallback);

        // API
        getContactId() : string;
        getOriginalContactId() : string;
        getType() : string;
        getStatus() : ContactState;
        getStatusDuration() : number;
        getQueue() : Queue;
        getConnections() : Connection[];
        getInitialConnection() : Connection;
        getActiveInitialConnection() : Connection;
        getThirdPartyConnections() : Connection;
        getSingleActiveThirdPartyConnection() : Connection;
        getAgentConnection() : Connection;
        getAttributes() : { [key: string] : string };
        isSoftphoneCall() : boolean;
        isInbound() : boolean;
        isConnected() : boolean;
        accept(options: SuccessFailOptions);
        destroy(options: SuccessFailOptions);
        notifyIssue(options: SuccessFailOptions);
        addConnection(endpoint: Endpoint, options: SuccessFailOptions);
        toggleActiveConnections(options: SuccessFailOptions);
        conferenceConnections(options: SuccessFailOptions);
    }

    interface ContactState {
        /**
         * The contact state type, as per the ContactStateType enumeration.
         */
        type: string;

        /**
         * A relative local state duration. To get the actual duration of the state
         * relative to the current time, use contact.getStateDuration().
         */
        duration: number
    }

    interface Queue {
        /**
         * The queueARN of the queue.
         */
        queueARN: string

        /**
         * The name of the queue.
         */
        name: string
    }
    
    class Endpoint {
        endpointARN: string;
        endpointId: string;
        type: connect.EndpointType;
        name: string;
        phoneNumber: string;
        agentLogin: string;
        queue: string
        static byPhoneNumber(phoneNumber: string) : Endpoint;
    }

    interface Connection {
        getContactId() : string;
        getConnectionId() : string;
        getEndpoint() : Endpoint;
        getState(): ConnectionState;
        getStateDuration(): number;
        getType(): "inbound" | "outbound" | "monitoring";
        isInitialConnection() : boolean;
        isActive(): boolean;
        isConnected(): boolean;
        isConnecting(): boolean;
        isOnHold(): boolean;
        destroy(options: SuccessFailOptions);
    }

    interface ConnectionState {
        /**
         * The connection state type, as per the ConnectionStateType enumeration.
         */
        type: string;

        /**
         * A relative local state duration. To get the actual duration of the state
         * relative to the current time, use connection.getStateDuration().
         */
        duration: number        
    }
}