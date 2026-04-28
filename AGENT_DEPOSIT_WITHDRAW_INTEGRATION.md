# Agent Deposit / Withdraw Integration

This frontend includes the integrated Agent Admin panel and main website Deposit/Withdraw flow.

## User pages

```txt
/deposit
/withdraw
/wallet
```

Deposit page now loads active agent payment methods from the backend. User deposit requests go to the Agent Admin Panel.

Withdraw page now creates an agent withdraw request. Balance is deducted only when the agent confirms.

## Agent pages

```txt
/agent/login
/agent/dashboard
/agent/payment-methods
/agent/requests/deposits
/agent/requests/withdrawals
```

Agent can update payment methods and confirm/reject user deposit/withdraw requests.

## Main Admin pages

```txt
/admin/agents
/admin/agent-payments
/admin/agent-requests
```

Main Admin can create/top-up agents and monitor all agent requests.

## Render settings

Frontend Static Site:

```txt
Build Command: npm install && npm run build
Publish Directory: dist
```

Add SPA rewrite:

```txt
Source: /*
Destination: /index.html
Action: Rewrite
```
