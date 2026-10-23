# Credit Service

Order Service integration and setup are documented in
[Order/Credit integration](../order-service/CREDIT_INTEGRATION.md).

`GET /api/wallets/availableBalance` uses the authenticated user's JWT subject.
All `/api/reservations` mutations additionally require the backend-only
`X-Order-Service-Key`, configured using `ORDER_CREDIT_SERVICE_KEY` in both services.
No browser client should receive this secret. Reservation ownership is checked
against the authenticated subject, and completion validates its orderId.

The service consumes `user.registered` to provision wallets. Configure
`KAFKA_BOOTSTRAP_SERVERS` (Compose supplies kafka:19092). Existing accounts may need
wallet backfill; a successful login alone does not prove a wallet exists.

Run focused Java contract tests without a local Java/Maven installation:

```powershell
docker build --target contract-tests -t foc-order-credit-test-contracts:local ./credit-service
```
