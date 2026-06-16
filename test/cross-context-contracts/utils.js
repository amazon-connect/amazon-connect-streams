export const dummyMessagePortFactory = () => {
  const eventBus = new connect.EventBus();
  return {
    postMessage: jest.fn(),
    addEventListener: jest.fn().mockImplementation(eventBus.subscribe.bind(eventBus)),
    dispatchMessageEvent: jest
      .fn()
      .mockImplementation((data) => eventBus.trigger.call(eventBus, 'message', { type: 'message', data })),
    start: jest.fn(),
    close: jest.fn(),
  };
};

export const dummyWindowFactory = () => {
  const eventBus = new connect.EventBus();
  return {
    postMessage: jest.fn(),
    addEventListener: jest.fn().mockImplementation(eventBus.subscribe.bind(eventBus)),
    dispatchMessageEvent: jest
      .fn()
      .mockImplementation((data) => eventBus.trigger.call(eventBus, 'message', { type: 'message', data })),
    dispatchEvent: jest.fn().mockImplementation((data) => eventBus.trigger.call(eventBus, data)),
    sessionStorage: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    },
    location: {
      reload: jest.fn(),
    },
  };
};

export const connectNewMessagePort = (port) => {
  if (typeof global.onconnect !== 'function') throw Error('A callback for global.onconnect event isnt registered');
  global.onconnect({ ports: [port] });
};

export const getRandomId = () => connect.randomId();

export const dummyLoginParams = {
  refreshToken: 'NA',
  authorizeEndpoint: '/auth/authorize',
  sharedWorkerUrl: '/connect/ccp-naws/static/shared-worker.0a85fe34-2ae3c847.js',
  ringtone: {
    voice: {
      disabled: false,
      ringtoneUrl: '/connect/ccp-naws/static/audios/ringtone.7c9fa2fc.mp3',
    },
    additionalVoice: {
      disabled: false,
      ringtoneUrl: '/connect/ccp-naws/static/audios/ringtone.7c9fa2fc.mp3',
    },
    chat: {
      disabled: false,
      ringtoneUrl: '/connect/ccp-naws/static/audios/ringtone.7c9fa2fc.mp3',
    },
    task: {
      disabled: false,
      ringtoneUrl: '/connect/ccp-naws/static/audios/ringtone.7c9fa2fc.mp3',
    },
    queue_callback: {
      disabled: false,
      ringtoneUrl: '/connect/ccp-naws/static/audios/ringtone.7c9fa2fc.mp3',
    },
  },
  endpoint: 'dummy-endpoint',
  authCookieName: 'dummy-auth-cookie-name',
  pageOptions: {
    enablePhoneTypeSettings: true,
    enableAudioDeviceSettings: false,
    enableVideoDeviceSettings: false,
  },
  agentAppEndpoint: 'dummy-agent-app-endpoint',
  taskTemplatesEndpoint: 'dummy-task-template-endpoint',
  authToken: 'dummy-auth-token',
  region: 'dummy-region',
  authTokenExpiration: 1696701812617,
  loginEndpoint: '/login?landat=/ccp-v2',
  longPollingOptions: {
    allowLongPollingShadowMode: false,
    allowLongPollingWebsocketOnlyMode: false,
  },
};

export const dummyConfigureMessage = {
  endpoint: dummyLoginParams.endpoint,
  agentAppEndpoint: dummyLoginParams.agentAppEndpoint,
  taskTemplatesEndpoint: dummyLoginParams.taskTemplatesEndpoint,
  authorizeEndpoint: dummyLoginParams.authorizeEndpoint,
  authCookieName: dummyLoginParams.authCookieName,
  authToken: dummyLoginParams.authToken,
  authTokenExpiration: dummyLoginParams.authTokenExpiration,
  refreshToken: dummyLoginParams.refreshToken,
  region: dummyLoginParams.region,
  longPollingOptions: dummyLoginParams.longPollingOptions,
};

export const mockAWSClientSuccessResponse = (response) =>
  jest.fn().mockReturnValue({
    on: () => ({ send: (cb) => cb(null, response) }),
  });

export const dummyCreateTransportResponse = {
  agentDiscoveryTransport: null,
  chatTokenTransport: null,
  softphoneTransport: null,
  webRTCTransport: null,
  webSocketTransport: {
    expiry: '2023-11-20T22:04:25.416Z',
    transportLifeTimeInSeconds: 3742,
    url: 'wss://dummy-endpoint',
  },
};

export const dummyGetAgentSnapshotResponse = {
  nextToken: 'next-token',
  snapshot: {
    agentAvailabilityState: {
      state: 'Offline',
      timeStamp: 1700500056.102,
    },
    contacts: [],
    nextState: null,
    snapshotTimestamp: 1700537607.968,
    state: {
      agentStateARN:
        'arn:aws:connect:us-west-2:012345678910:instance/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/agent-state/offlinea-bbbb-cccc-dddd-eeeeeeeeeeee',
      name: 'Offline',
      startTimestamp: 1700500056.968,
      type: 'offline',
    },
  },
};

export const dummyGetAgentConfigurationResponse = {
  configuration: {
    agentARN:
      'arn:aws:connect:us-west-2:012345678910:instance/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/agent/agentaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    agentPreferences: {
      LANGUAGE: 'en_US',
    },
    extension: '',
    name: 'Dummy Agent',
    routingProfile: {
      channelConcurrencyMap: {
        CHAT: 10,
        TASK: 10,
        VOICE: 1,
      },
      defaultOutboundQueue: {
        name: 'BasicQueue',
        queueARN:
          'arn:aws:connect:us-west-2:012345678910:instance/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/queue/queueaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      },
      name: 'Basic Routing Profile',
      routingProfileARN:
        'arn:aws:connect:us-west-2:012345678910:instance/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/routing-profile/rprofile-bbbb-cccc-dddd-eeeeeeeeeeee',
    },
    softphoneAutoAccept: false,
    softphoneEnabled: true,
    username: 'dummy-username',
  },
};

export const dummyGetAgentPermissionsResponse = {
  nextToken: null,
  permissions: ['outboundCall'],
};

export const dummyGetAgentStatesResponse = {
  nextToken: null,
  states: [
    {
      agentStateARN:
        'arn:aws:connect:us-west-2:012345678910:instance/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/agent-state/availabl-bbbb-cccc-dddd-eeeeeeeeeeee',
      name: 'Available',
      startTimestamp: null,
      type: 'routable',
    },
    {
      agentStateARN:
        'arn:aws:connect:us-west-2:012345678910:instance/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/agent-state/lunchaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      name: 'Lunch',
      startTimestamp: null,
      type: 'not_routable',
    },
    {
      agentStateARN:
        'arn:aws:connect:us-west-2:012345678910:instance/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/agent-state/offlinea-bbbb-cccc-dddd-eeeeeeeeeeee',
      name: 'Offline',
      startTimestamp: null,
      type: 'offline',
    },
  ],
};

export const dummyGetDialableCountryCodesResponse = {
  countryCodes: ['us'],
  nextToken: null,
};

export const dummyGetRoutingProfileQueuesResponse = {
  nextToken: null,
  queues: [
    {
      name: 'BasicQueue',
      queueARN:
        'arn:aws:connect:us-west-2:012345678910:instance/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/queue/basicaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    },
    {
      name: 'CallbackQueue',
      queueARN:
        'arn:aws:connect:us-west-2:012345678910:instance/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/queue/callback-bbbb-cccc-dddd-eeeeeeeeeeee',
    },
    {
      name: null,
      queueARN:
        'arn:aws:connect:us-west-2:012345678910:instance/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/queue/agent/selfaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    },
  ],
};
