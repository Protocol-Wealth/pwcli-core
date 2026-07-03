# Agent Interop

`pwcli-core` treats agent interoperability as useful but bounded.

## MCP

Use MCP-style contracts for exposing tools, resources, and prompts to models.
Hosts must still own consent, authorization, audit, and tool safety.

## A2A

Use A2A-style Agent Cards and task lifecycles when delegating to another agent.
Delegation should declare skills, security requirements, task state, artifacts,
and supported media types.

## Local Rule

An agent can advertise capabilities. It cannot grant itself permission.
