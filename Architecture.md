# Architecture
Amazon Connect Streams uses a multi-layered approach to provide a consistent level of
control and customizability for CRM integrations, allowing you to build as sophisticated
or as limited of an integration as is necessary for your business needs.

Connect Streams uses the concept of *Streams* to represent the connection points between
each browser-side layer of the integration.  Multiple *Streams* are connected together
to create a bi-directional *Conduit* through which events and requests flow.  There are
three browser-side layers, starting with the CRM:

* **CRM Integration**: This is the CRM client code itself which initializes Connect Streams.
  The client initialization code builds an `<iframe/>` into which the CCP is loaded.  This
  may be visible or hidden based on your preferences, and provides a default call-control
  user interface contained in the frame.
* **Contact Control Panel (CCP)** The CCP is the built-in agent call-control experience in
  Amazon Connect.  It provides directory authentication for the currently logged in agent.
  It also plays the role of a middle-man for requests between the CRM integration and the
  *Connect Shared Worker* which makes AJAX requests to the *Amazon Connect CTI Service*
  which handles them.
* **Connect Shared Worker**: This is an HTML5 SharedWorker that, in addition to handling
  API requests from downstream, performs long-polling of agent state data and incremental
  polling of agent configuration data.  Whenever the agent state or configuration data
  changes, these changes are synchronized across all open CCP tabs, iframes, and connected
  CRM integration pages.

## High Level
![High Level Architecture](/images/high_level.png?raw=true)

## CRM Integration
![CRM Integration Architecture](/images/crm.png?raw=true)

## Contact Control Panel (CCP)
![Contact Control Panel (CCP) Architecture](/images/ccp.png?raw=true)

## Connect Shared Worker 
![Connect Shared Worker](/images/shared_worker.png?raw=true)
