# Streams API - Cheat sheet

## Get Agent Instance
You can obtain an agent instance using either the `connect.agent(callback)` API or the `new connect.Agent()` API.
- `connect.agent(callback)`: Can be called at any time after invoking `connect.core.initCCP()`. The callback will be triggered once the agent is initialized or immediately if already initialized.
- `new connect.Agent()`: Preferred when you want fewer callbacks. However, ensure the agent is initialized before calling this, as it will throw an error otherwise.

An agent is considered initialized after the first agent data is retrieved from the backend and `connect.agent()` is triggered. Logging out of Connect uninitializes the agent.
```js
// Using connect.agent(callback)
connect.agent((agent) => {
  const state = agent.getState();
});
```
```js
// Using new connect.Agent()
// Make sure to use this approach only after agent is initialized.
const agent = new connect.Agent();
const state = agent.getState();
```

## Get Agent State
Get the current state of the agent:
```js
const state = agent.getState();
console.log("Agent's current state", state);
```


## Get All Agent States
Get all possible agent states:
```js
const states = agent.getAgentStates();
console.log("All agent states:", states);
```

## Change Agent State to OFFLINE
Set the agent state to OFFLINE:
```js
const offlineState = agent.getAgentStates().find(
  (state) => state.type === connect.AgentStateType.OFFLINE
);
agent.setState(offlineState, {
  success: () => console.log("Agent state set to OFFLINE"),
  failure: () => console.log("Failed to set agent state to OFFLINE""),
}, { enqueueNextState: true });
```

## Change Agent State to ROUTABLE
Set the agent state to ROUTABLE:
(The defalt routable state name is "Available" but you can edit it in the Admin Website)
```js
const routableState = agent.getAgentStates().find(
  (state) => state.type === connect.AgentStateType.ROUTABLE
);
agent.setState(routableState, {
  success: () => console.log(`Agent state set to ${routableState.name}`),
  failure: () => console.log("Failed to set agent state to ROUTABLE"),
}, { enqueueNextState: true });
```

## Change Agent State to a Custom State
Change the agent state to a custom state:
```js
const targetCustomStateName = "your-custom-state";
const customState = agent.getAgentStates().find(
  (state) => state.name === targetCustomStateName
);
agent.setState(customState, {
  success: () => console.log(`Agent state set to ${routableState.name}`),
  failure: () => console.log(`Failed to set agent state to ${targetCustomStateName}`),
}, { enqueueNextState: true });
```

## Detect a New Contact Routed to the Agent
Listen for a new contact being routed to the agent:
```js
connect.contact((contact) => {
  const contactId = contact.getContactId();
  const initialContactId = contact.getInitialContactId();
  const type = contact.getType();
  const subType = contact.getContactSubtype();
  console.log("New contact detected:", { contactId, initialContactId, type, subType });
});
```

## Show accept button for an incoming contact
Display an “Accept” button when an incoming contact arrives:
```js
connect.contact((contact) => {
  contact.onRefresh((_contact) => {
    if (shouldShowAcceptButton(_contact)) {
      showAcceptButton(); // Your custom function to display the button
    } else {
      hideAcceptButton(); // Your custom function to hide the button
    }

    function shouldShowAcceptButton(c) {
      const contactStateType = c.getState().type;
      const contactType = c.getType();
      const agentConnection = c.getAgentConnection();

      if (contactType === connect.ContactType.QUEUE_CALLBACK || contactType === connect.ContactType.VOICE || contactType === connect.ContactType.CHAT) {
        // Return false if this is a monitoring contact for supervisor.
        // Monitoring contact is not supported for task and email channel.
        const isMonitoringCall = agentConnection.getType() === connect.ConnectionType.MONITORING || Object.values(connect.MonitoringMode).includes(agentConnection.getMonitorStatus()?.toUpperCase());
        if (isMonitoringCall) return false;
      }

      if (contactType === connect.ContactType.QUEUE_CALLBACK) {
        // Queued callback contact comes in as "incoming" state.
        return contactStateType === connect.ContactStateType.INCOMING;
      } else if (contactType === connect.ContactType.VOICE) {
        // Voice contact comes in as "connecting" state. Return true only if the contact is inbound and the agent is configured to use softphone, not deskphone.
        return c.isSoftphoneCall() && c.isInbound() && contactStateType === connect.ContactStateType.CONNECTING;
      } else if (contactStateType === connect.ContactStateType.CONNECTING) {
        return true;
      }

      return false;
    }
  })
});
```

## Disconnect Agent from a Contact
Terminate the agent’s connection to a contact:
```js
const agentConnection = contact.getAgentConnection();
agentConnection.destroy({
  success: () => console.log("Disconnected from the contact"),
  failure: () => console.log("Failed to disconnect from the contact"),
});
```

## Disconnect Agent from a Contact and Clear the Contact
Disconnect and clear the contact when it ends:
```js
const agentConnection = contact.getAgentConnection();

contact.onEnded((_contact) => {
  _contact.clear({
    success: () => console.log("Contact cleared"),
    failure: () => console.log("Failed to clear contact"),
  });
});
// Don't call contact.clear in success callback as the backend would not be ready yet. Rather use contact.onEnded().
agentConnection.destroy({
  success: () => console.log("Disconnected from the contact"),
  failure: () => console.log("Failed to disconnect from the contact"),
});
```

## Get Quick Connect Endpoints of Default Outbound Queue
Fetch Quick Connect endpoints for all queues in the routing profile:
```js
const defaultOutboundQueueARN = agent.getRoutingProfile().defaultOutboundQueue.queueARN;
agent.getEndpoints(defaultOutboundQueueARN, {
  success: ({ endpoints }) => console.log("Retrieved Quick Connects", endpoints),
  failure: () => console.log("Failed to retrieve quick connects"),
});
```

## Get Quick Connect Endpoints of All Routing Profile Queues
Fetch Quick Connect endpoints for all queues in the routing profile:
```js
const routingProfileQueueARNs = agent.getAllQueueARNs();
agent.getEndpoints(routingProfileQueueARNs, {
  success: ({ endpoints }) => console.log("Retrieved Quick Connects", endpoints),
  failure: () => console.log("Failed to retrieve quick connects"),
});
```

## Get Quick Connect Endpoints of the Current Contact’s Queue
Fetch Quick Connect endpoints for the queue associated with the current contact:
```js
const currentContactQueueARN = contact.getQueue().queueARN;
agent.getEndpoints(currentContactQueueARN, {
  success: ({ endpoints }) => console.log("Retrieved Quick Connects", endpoints),
  failure: () => console.log("Failed to retrieve quick connects"),
});
```

## Get Combined Quick Connect Endpoints (Default Outbound Queue + Routing Profile Queues)
Fetch Quick Connect endpoints for the default outbound queue and all routing profile queues (Native CCP behavior):
```js
const defaultOutboundQueueARN = agent.getRoutingProfile().defaultOutboundQueue.queueARN;
const routingProfileQueueARNs = agent.getAllQueueARNs();
agent.getEndpoints(routingProfileQueueARNs.concat(defaultOutboundQueueARN), {
  success: ({ endpoints }) => console.log("Retrieved Quick Connects", endpoints),
  failure: () => console.log("Failed to retrieve quick connects"),
});
```

## Start an Outbound Call by Number
Initiate an outbound call using a phone number:
```js
const endpoint = connect.Endpoint.byPhoneNumber("+18005550100");
agent.connect(endpoint, {
  success: () => console.log("Started an outbound call"),
  failure: () => console.log("Failed to start an outbound call"),
});
```

## Filter External Quick Connect Endpoints and Start an Outbound Call
Filter external Quick Connect endpoints of the default outbound queue and start a call:
```js
const filteredEndpoints = endpoints.filter((endpoint) => endpoint.type === connect.AddressType.PHONE_NUMBER);

// Select an endpoint
const endpoint = filteredEndpoints[0];
agent.connect(endpoint, {
  success: () => console.log("Started an outbound call"),
  failure: () => console.log("Failed to start an outbound call"),
});
```

## Set Agent to Offline and Logout
Set the agent state to OFFLINE and log out:
```js
function handleLogoutButtonClick() {
  const agent = new connect.Agent();
  if (agent.getState().type === connect.AgentStatusType.OFFLINE) {
    logout();
  } else {
    setAgentOffline()
      .then(logout)
      .catch(console.error);
  }
}

function setAgentOffline() {
  return new Promise((resolve, reject) => {
    const agent = new connect.Agent();
    const offlineState = agent.getAgentStates().find(
      (state) => state.type === connect.AgentStateType.OFFLINE,
    );
    agent.setState(offlineState, {
      success: resolve,
      failure: reject,
    }, { enqueueNextState: true });
  });
}

function logout() {
  const logoutEndpoint = "https://<your-instance-domain>/logout";
  fetch(logoutEndpoint, { credentials: 'include', mode: 'no-cors'})
    .then(() => {
      // Notify all CCPs to terminate
      connect.core.getUpstream().sendUpstream(connect.EventType.TERMINATE);
    });
}
```
	
## Update Agent Configuration to Use Softphone
Enable softphone for the agent:
```js
const config = agent.getConfiguration();
const newConfig = {
  ...config,
  softphoneEnabled: true,
};

agent.setConfiguration(newConfig, {
  success: () => console.log("Updated agent configuration"),
  failure: () => console.log("Failed to update agent configuration"),
});
```

## Update Agent’s Extension Number
Change the agent’s extension number:
```js
const config = agent.getConfiguration();
const newConfig = {
  ...config,
  softphoneEnabled: false,
  extension: "+11234567890",
};

agent.setConfiguration(newConfig, {
  success: () => console.log("Updated agent configuration"),
  failure: () => console.log("Failed to update agent configuration"),
});
```

## Update Agent’s Language Preference
Set the agent’s preferred language:
```js
const config = agent.getConfiguration();
const newConfig = {
  ...config,
  agentPreferences: {
    locale: "en_US",
  },
};

agent.setConfiguration(newConfig, {
  success: () => console.log("Updated agent configuration"),
  failure: () => console.log("Failed to update agent configuration"),
});
```

## Change Audio Device Settings
Manage audio devices (microphone, speaker, ringer). The process varies based on the softphone configuration:

Device IDs are unique to their origin, so the method for obtaining microphone and speaker device IDs depends on where the WebRTC communication occurs. If you initialize the CCP with `allowFramedSoftphone: true`, use the `connect.core.getFrameMediaDevices()` API to retrieve device IDs from the embedded CCP context in the Connect domain. However, ringer device IDs should always be obtained from the embedded CCP context using the same API, as ringtones are played there regardless of the `allowFramedSoftphone` parameter.

### For Framed Softphone Users (`allowFramedSoftphone: true`)
For those who call initCCP with `allowFramedSoftphone: true`:
```js
const deviceList = await connect.core.getFrameMediaDevices();
const audioInputDevices = deviceList.filter(device => device.kind === 'audioinput');
const audioOutputDevices = deviceList.filter(device => device.kind === 'audiooutput');

// Agent-selected devices
const targetMicrophoneDeviceId = audioInputDevices[0].deviceId;
const targetSpeakerDeviceId = audioOutputDevices[0].deviceId;
const targetRingerDeviceId = audioOutputDevices[0].deviceId;

// Setting speaker and ringer devices can work anytime.
agent.setSpeakerDevice(targetSpeakerDeviceId);
agent.setRingerDevice(targetRingerDeviceId);

// The setMicrophoneDevice method can only be used when there is an active softphone contact, so it should be called within the onLocalMediaStreamCreated callback.
// If you need to call agent.onLocalMediaStreamCreated multiple times, ensure you unsubscribe from the previous callback before registering a new one to prevent setMicrophoneDevice from being called redundantly.
agent.onLocalMediaStreamCreated(() => {
  agent.setMicrophoneDevice(targetMicrophoneDeviceId);
});
```

### For Custom Softphone Users (`allowFramedSoftphone: false`)
For those who load RTCJS, call initCCP with `allowFramedSoftphone: false`, and call `connect.core.initSoftphoneManager()`:
```js
const deviceListFromConnectDomain = await connect.core.getFrameMediaDevices();
const audioInputDevicesFromConnectDomain = deviceListFromConnectDomain.filter(device => device.kind === 'audioinput');
const audioOutputDevicesFromConnectDomain = deviceListFromConnectDomain.filter(device => device.kind === 'audiooutput');

const deviceListFromMyDomain = await navigator.mediaDevices.enumerateDevices();
const audioOutputDevicesFromMyDomain = deviceListFromMyDomain.filter(device => device.kind === 'audiooutput');

// Agent-selected devices
const targetMicrophoneDeviceId = audioInputDevicesFromConnectDomain[0].deviceId;
const targetSpeakerDeviceId = audioOutputDevicesFromConnectDomain[0].deviceId;
const targetRingerDeviceId = audioOutputDevicesFromMyDomain[0].deviceId;

// Setting speaker and ringer devices can work anytime.
agent.setSpeakerDevice(targetSpeakerDeviceId);
agent.setRingerDevice(targetRingerDeviceId);

// The setMicrophoneDevice method can only be used when there is an active softphone contact, so it should be called within the onLocalMediaStreamCreated callback.
// If you need to call agent.onLocalMediaStreamCreated multiple times, ensure you unsubscribe from the previous callback before registering a new one to prevent setMicrophoneDevice from being called redundantly.
agent.onLocalMediaStreamCreated(() => {
  agent.setMicrophoneDevice(targetMicrophoneDeviceId);
});
```