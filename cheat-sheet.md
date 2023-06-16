# Streams API - Cheat sheet

## Get agent config

```js
    connect.agent(function(agent) {
      var config = agent.getConfiguration();
      console.log("here is your configuration: " + JSON.stringify(config));
    });
```

## Get agent states

```js
    connect.agent(function(agent) {
      var states = agent.getAgentStates();
      console.log("here are your states: " + JSON.stringify(states));
    });
```

## Change agent state

```js
    connect.agent(function(agent) {
      var targetState = agent.getAgentStates()[0];
      agent.setState(targetState, {
        success: function () {
          console.log("Set agent status via Streams")
        },
        failure: function () {
          console.log("Failed to set agent status via Streams")
        }
        });
    });
```

## Change agent state to OFFLINE

```js
    connect.agent(function(agent) {	
      var offlineState = agent.getAgentStates().filter(function (state) { 
        return state.type === connect.AgentStateType.OFFLINE; })[0];
      agent.setState(offlineState, {
        success: function () {
          console.log("Set agent status to Offline via Streams")
        },
        failure: function () {
          console.log("Failed to set agent status to Offline via Streams")
        }
      });
    });
```

## Change agent state to AVAILABLE

```js
    connect.agent(function(agent) {	
      var avail = agent.getAgentStates().filter(function (state) {
                return state.type === connect.AgentStateType.ROUTABLE;
        })[0];
      agent.setState(avail, {
        success: function () {
          console.log("Set agent status to Available via Streams")
        },
        failure: function () {
          console.log("Failed to set agent status to Available via Streams")
        }
      });
    });
```

## Hang up call

```js
    var c;
    connect.contact(function (contact) {
      c = contact;
      connect.agent(async function(agent) {
        if (c) {
          var initialConnection = c.getInitialConnection();
          if (initialConnection) {
            initialConnection.destroy();
          }
        }
      });
    });
```

## Hang up second line

```js
    var c;
    connect.contact(function (contact) {
      c = contact;
      connect.agent(async function(agent) {
        if (c) {
          var thirdParty = c.getSingleActiveThirdPartyConnection();
          if (thirdParty) {
            thirdParty.destroy();
          }
        }
      });
    });
```		
			
## Hang up calls, set status to Offline and redirect to logout URL

```js
    var c;
    var ccpInstance = "yourInstanceAlias";
    connect.contact(function (contact) {
      c = contact;
      connect.agent( function(agent) {
        if (c) {
          var initialConnection = c.getInitialConnection();
          var thirdParty = c.getSingleActiveThirdPartyConnection();
          if (initialConnection) {
            initialConnection.destroy();
            await sleep(1000);
          }
          if (thirdParty) {
            thirdParty.destroy();
            await sleep(1000);
          }
        }
      });
      
      var offlineState = agent.getAgentStates().filter(function (state) { 
        return state.type === connect.AgentStateType.OFFLINE; })[0];
      agent.setState(offlineState, {
        success: function () {
          console.log("Set agent status to Offline via Streams")
        },
        failure: function () {
          console.log("Failed to set agent status to Offline via Streams")
        }
      });
      
      window.location.replace('https://<your-instance-domain>/connect/logout');
      // or fetch("https://<your-instance-domain>/connect/logout", { credentials: 'include'})
    });
```			

## Dial a number

```js
    var agent = new lily.Agent();
    agent.connect(connect.Endpoint.byPhoneNumber("14802021091"),{});
```

## Get quick connects

```js
    var agent = new lily.Agent();

    agent.getEndpoints(agent.getAllQueueARNs(), {
      success: function(data){ 
        console.log("valid_queue_phone_agent_endpoints", data.endpoints, "You can transfer the call to any of these endpoints");
      },
      failure:function(){
        console.log("failed")
      }
    });
```

## Transfer to a quick connect

```js
    var agent = new lily.Agent();

    agent.getEndpoints(agent.getAllQueueARNs(), {
      success: function(data){ 
        console.log("valid_queue_phone_agent_endpoints", data.endpoints, "You can transfer the call to any of these endpoints");
        agent.getContacts(lily.ContactType.VOICE)[0].addConnection(data.endpoints[6], {
          success: function(data) {
            alert("transfer success");
          },
          failure: function(data) {
            alert("transfer failed");
          }
        });
        
      },
      failure:function(){
        console.log("failed")
      }
    });
```

## Transfer to a phone number

```js
    var agent = new lily.Agent();
    var endpoint = connect.Endpoint.byPhoneNumber("+14807081026");

    agent.getContacts(lily.ContactType.VOICE)[0].addConnection(endpoint, {
      success: function(data) {
          alert("transfer success");
      },
      failure: function(data) {
          alert("transfer failed");
      }
    });
```

## Update agent config to use softphone

```js
    connect.agent(async function(agent) {
      a = agent;
      var config = a.getConfiguration(); 
      
      //config.value = whatYouWant
      config.softphoneEnabled = true; 
      a.setConfiguration(config, { 
        success: function()	{ 
          console.log("set softphone successfully"); 
        }, 
        failure: function() {
          console.log("Could not set softphone...."); 
        }});
    });
```

## Get contact attributes

```js
    var c;
    connect.contact(function (contact) {
        c = contact;
        c.onConnecting(function (c) {
            var attr = c.getAttributes();
            var c1 = c.getConnections()[1];
            var c2 = c.getStatus();
            document.getElementById("contactID").value = c.contactId;
            document.getElementById("phoneNumber").value = c1.getAddress()['phoneNumber'];
            if (attr.firstName) {
                console.log (Here's your value for firstName " + attr.firstName.value);
            }
            if (attr.lastName) {
                console.log (Here's your value for lastName " + attr.lastName.value);
            }
        });
    });
```

## Add a log message to agent logs

```js
    connect.getLog().warn("yar, I'm a pirate")
```

## Download agent logs

```js
	connect.getLog().download()
```

## Media Controller API for chat - ***New,ChatJS Required***

```js
    connect.contact(function(contact){
    contact.getAgentConnections().forEach(function(connection){
      // chat users
      if(connection.getMediaType() === connect.MediaType.CHAT){
          contact.getConnection().getMediaController()
          .then(function(controller){
              controller.onMessage(function(response){
                  console.log("data", response)
              })

              controller.sendMessage({message: "so and so", contentType: "text/plain"})
                  .then(function(res, req){
                    console.log(res.status)
              });
              
              controller.onDisconnect(function(){
                  console.log("on disconnect");
              })
          });
      }
    });
```

## ViewContact API

```js
    connect.core.viewContact("contactID")
```

## onAuthFail Event Handler

```js
    connect.core.onAuthFail(function(){
      // agent logged out or session expired.  needs login
      // show button for login or popup a login screen. 
    });
```

## onSoftphoneSessionInit Event Handler

```js
    connect.core.onSoftphoneSessionInit(function({ connectionId }) {
        var softphoneManager = connect.core.getSoftphoneManager();
        if(softphoneManager){
          // access session
          var session = softphoneManager.getSession(connectionId);
          // YOu can use this rtc session for stats analysis 
        }
    });
```

## fetch API 

```js
    connect.fetch("endpoint", options, retryinterval, maxRetry); 
```

## Mute Agent
  		  
```js
  	function muteAgent(){
  		  const agent = new connect.Agent();
  		  const contact  = agent.getContacts(connect.ContactType.VOICE)?.[0]
  		  
  		  // Get all open active connections
  		  const activeConnections = contact?.getConnections().filter((conn) => conn.isActive()) || [];
  		  
  		  
  		  if (activeConnections.length === 0) {
  		      console.log("No Active Connections to mute");
  		      return;
  		  }
  		  
  		  // Check if we are using multiparty and see if there more than 2 active connections
  		  if (contact.isMultiPartyConferenceEnabled() && activeConnections.length > 2) {
  		      // if any of those are in connecting mode
  		      const connectingConnections =  contact?.getConnections().filter((conn) => conn.isConnecting()) || [];
  		      if (connectingConnections.length === 0) {
  		          console.log("Agent Connection is muted at the server side");
  		          contact.getAgentConnection().muteParticipant();
  		      } else {
  		          console.log("Agent Connection cannot be muted while multi party participant is connecting")
  		      }
  		  } else {
  		      console.log("Agent connection muted at the client side");
  		      agent.mute();
  		  }
  	}
```

## Check if connected contact has ScreenRecording Enabled
```js
    connect.contact(function (contact) {
        contact.onConnected(function (connectedContact) {
            const isScreenRecordingEnabled = connectedContact.getContactFeatures()?.screenRecordingConfig?.screenRecordingEnabled ?? false
            console.log(`contact isScreenRecordingEnabled: ${isScreenRecordingEnabled}`)
        });
    });
```
