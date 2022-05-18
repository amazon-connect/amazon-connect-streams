Streams API - Cheat sheet

Get agent config

    connect.agent(function(agent) {
      var config = agent.getConfiguration();
      console.log("here is your configuration: " + JSON.stringify(config));
    });

Get agent states

    connect.agent(function(agent) {
      var states = agent.getAgentStates();
      console.log("here are your states: " + JSON.stringify(states));
    });

Change agent state

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


Change agent state to OFFLINE

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
			
Change agent state to AVAILABLE

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


Hang up call

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

Hang up second line

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
			
			
Hang up calls, set status to Offline and redirect to logout URL

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
			

Dial a number

    var agent = new lily.Agent();
    agent.connect(connect.Endpoint.byPhoneNumber("14802021091"),{});


Get quick connects

    var agent = new lily.Agent();

    agent.getEndpoints(agent.getAllQueueARNs(), {
      success: function(data){ 
        console.log("valid_queue_phone_agent_endpoints", data.endpoints, "You can transfer the call to any of these endpoints");
      },
      failure:function(){
        console.log("failed")
      }
    });


Transfer to a quick connect

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


Transfer to a phone number

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
	
Update agent config to use softphone
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

Get contact attributes

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

Add a log message to agent logs

    connect.getLog().warn("yar, I'm a pirate")

Download agent logs

	connect.getLog().download()


Media Controller API for chat - ***New,ChatJS Required***

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


ViewContact API

    connect.core.viewContact("contactID")

onAuthFail Event Handler

    connect.core.onAuthFail(function(){
      // agent logged out or session expired.  needs login
      // show button for login or popup a login screen. 
    });


onSoftphoneSessionInit Event Handler

    connect.core.onSoftphoneSessionInit(function({ connectionId }) {
        var softphoneManager = connect.core.getSoftphoneManager();
        if(softphoneManager){
          // access session
          var session = softphoneManager.getSession(connectionId);
          // YOu can use this rtc session for stats analysis 
        }
    });

fetch API 

    connect.fetch("endpoint", options, retryinterval, maxRetry); 
