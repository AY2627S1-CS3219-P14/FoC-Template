<!--
AI Assistance Disclosure
Tool and date: OpenAI Codex (gpt-6.1-sol), 2026-11-11
Scope (AI-16): Compiled the attribution documentation.
Usage log: AI_USAGE_LOG.md
Author review: Pending confirmation by Elliot Yong.
-->

# AI usage log

This is a partial record of verified assistance for this contributor in the current checkout. Dates use Singapore time. File headers link to entries by ID. Prompt text is reproduced verbatim where available. Key responses are summarized. Author review is pending.

## AI-01 · Supplier card content

- **Source and mode** — OpenAI Codex (gpt-5.6-sol). Generate.
- **Date** — 2026-09-26
- **Key response** — Implemented the requested supplier card fields and populated the supplier page with a responsive card grid.

**Commit evidence** — `3ecfc52`

**Affected files**

- [`frontend/src/components/ui/SupplierCard.tsx`](frontend/src/components/ui/SupplierCard.tsx)
- [`frontend/src/pages/SuppliersPage.tsx`](frontend/src/pages/SuppliersPage.tsx)

**Exact prompt**

```text
help me created the components for the supplier cards and populate the supplier page with them. Each card should have the name of the supplier, the category, locaion/building, a space for a short description, and an immage.
```

## AI-02 · Style updates from the supplied Figma mockup

- **Source and mode** — OpenAI Codex (gpt-5.6-sol). Refactor.
- **Date** — 2026-10-03
- **Key response** — Updated the existing navigation, header, icons, filters, and supplier cards to match the supplied colors and styling.

**Commit evidence** — `d6e4a2e`

**Affected files**

- [`frontend/src/assets/credit-coin.svg`](frontend/src/assets/credit-coin.svg)
- [`frontend/src/assets/nav-clipboard.svg`](frontend/src/assets/nav-clipboard.svg)
- [`frontend/src/assets/nav-compass.svg`](frontend/src/assets/nav-compass.svg)
- [`frontend/src/assets/search.svg`](frontend/src/assets/search.svg)
- [`frontend/src/components/layout/AppHeader.tsx`](frontend/src/components/layout/AppHeader.tsx)
- [`frontend/src/components/layout/AppLayout.tsx`](frontend/src/components/layout/AppLayout.tsx)
- [`frontend/src/components/layout/MobileBottomNav.tsx`](frontend/src/components/layout/MobileBottomNav.tsx)
- [`frontend/src/components/layout/Sidebar.tsx`](frontend/src/components/layout/Sidebar.tsx)
- [`frontend/src/components/ui/SearchInput.tsx`](frontend/src/components/ui/SearchInput.tsx)
- [`frontend/src/components/ui/Select.tsx`](frontend/src/components/ui/Select.tsx)
- [`frontend/src/components/ui/SupplierCard.tsx`](frontend/src/components/ui/SupplierCard.tsx)
- [`frontend/src/pages/SuppliersPage.tsx`](frontend/src/pages/SuppliersPage.tsx)

**Exact prompt**

```text
help me edit the existing navbar tabs, supplier page and page header so it is more in line with the colors and style of the figma mockup.
```

## AI-03 · Isolate failed supplier lookups

- **Source and mode** — OpenAI Codex (gpt-5.6-sol). Debug and test.
- **Date** — 2026-10-21
- **Key response** — Applied the supplied `Promise.allSettled` change. Individual supplier failures leave other errands visible. Tests cover partial lookup failure and cancellation.

**Commit evidence** — `bca1969`

**Affected files**

- [`frontend/src/features/errands/errand.dashboard.test.ts`](frontend/src/features/errands/errand.dashboard.test.ts)
- [`frontend/src/features/errands/errand.dashboard.ts`](frontend/src/features/errands/errand.dashboard.ts)

**Exact prompts**

````text
```javascript
const supplierResults = await Promise.allSettled(
  supplierIds.map((supplierId) => getSupplier(supplierId, signal)),
)

const abortedRequest = supplierResults.find(
  (result) =>
    result.status === 'rejected' &&
    result.reason instanceof DOMException &&
    result.reason.name === 'AbortError',
)

if (abortedRequest?.status === 'rejected') {
  throw abortedRequest.reason
}

const suppliers = supplierResults.flatMap((result) =>
  result.status === 'fulfilled' ? [result.value] : [],
)

explain what this does and how it is different from the current
```
````

```text
implement this change (dont commit yet
```

## AI-04 · Credit balance refresh cleanup

- **Source and mode** — OpenAI Codex (gpt-5.6-sol) and GitHub Copilot code review (model unrecorded). Refactor, debug, and test.
- **Date** — 2026-10-23
- **Key response** — Applied the Copilot review suggestion. Initial load delegates to the existing refresh function, and unmount aborts the active request. Added an unmount regression test.

**Commit evidence** — `bb22a94`

**Affected files**

- [`frontend/src/features/credits/CreditProvider.test.tsx`](frontend/src/features/credits/CreditProvider.test.tsx)
- [`frontend/src/features/credits/CreditProvider.tsx`](frontend/src/features/credits/CreditProvider.tsx)

**Exact prompt**

```text
The initial-load effect duplicates almost all of `refreshBalance`'s fetch-and-set logic (loading/ready/error transitions, abort guards, error-message fallback). This duplication is a maintenance hazard since the two paths can drift. It also has a subtle lifecycle gap: this effect's cleanup only aborts its own local `controller`, so if a later `refreshBalance()` (e.g. the post-create refresh or a retry) is still in flight when the provider unmounts, that request is never aborted and can call `setState` after unmount. Delegating the initial load to `refreshBalance` removes the duplication and aborts whichever request is current on unmount. &#x20;

this is the comment by copilot
```

## AI-05 · Notification API reference

- **Source and mode** — OpenAI Codex (gpt-6.1-sol). Generate documentation.
- **Date** — 2026-11-06
- **Key response** — Documented five existing endpoints with authentication, parameters, response examples, and SSE reconnect behavior.

**Commit evidence** — `b53907e`

**Affected files**

- [`notification-service/README.md`](notification-service/README.md)

**Exact prompt**

```text
make a reference for the endpoints
```

## AI-06 · Account initials menu

- **Source and mode** — OpenAI Codex (gpt-6.1-sol). Generate and test.
- **Date** — 2026-11-08
- **Key response** — Implemented the requested account initials menu and its Log out action. Used the existing profile endpoint to read the name, added an icon fallback, and tested the menu.

**Commit evidence** — `9689591`

**Affected files**

- [`frontend/src/components/layout/AccountMenu.tsx`](frontend/src/components/layout/AccountMenu.tsx)
- [`frontend/src/components/layout/AppHeader.test.tsx`](frontend/src/components/layout/AppHeader.test.tsx)
- [`frontend/src/components/layout/AppHeader.tsx`](frontend/src/components/layout/AppHeader.tsx)
- [`frontend/src/features/auth/auth.api.ts`](frontend/src/features/auth/auth.api.ts)
- [`frontend/src/features/auth/profile.api.ts`](frontend/src/features/auth/profile.api.ts)

**Exact prompt**

```text
undo the change. Maybe instead replace the log out button with a circle with the person's initials on it, and they can click and press log out?
```

## AI-07 · Mark clicked alerts as read

- **Source and mode** — OpenAI Codex (gpt-6.1-sol). Generate and test.
- **Date** — 2026-11-08
- **Key response** — Updated the bell to open the errand and mark the clicked alert as read in the background. Added frontend coverage for read behavior on grouped cards.

**Commit evidence** — `5310144`

**Affected files**

- [`frontend/src/features/notifications/NotificationBell.tsx`](frontend/src/features/notifications/NotificationBell.tsx)
- [`frontend/src/features/notifications/NotificationProvider.test.tsx`](frontend/src/features/notifications/NotificationProvider.test.tsx)
- [`frontend/src/features/notifications/NotificationProvider.tsx`](frontend/src/features/notifications/NotificationProvider.tsx)

**Exact prompts**

```text
should clicking on the notification link mark it as read
```

```text
help me implement that
```

## AI-08 · Notification punctuation

- **Source and mode** — OpenAI Codex (gpt-6.1-sol). Refactor and test.
- **Date** — 2026-11-08
- **Key response** — Removed trailing full stops from the accepted, delivered, completed, failed, and credits-received messages. Updated examples and test expectations.

**Commit evidence** — `fbbcabe`

**Affected files**

- [`frontend/src/features/notifications/NotificationProvider.test.tsx`](frontend/src/features/notifications/NotificationProvider.test.tsx)
- [`notification-service/README.md`](notification-service/README.md)
- [`notification-service/src/main/java/com/campuscouriers/notification_service/event/CreditEventListener.java`](notification-service/src/main/java/com/campuscouriers/notification_service/event/CreditEventListener.java)
- [`notification-service/src/main/java/com/campuscouriers/notification_service/event/ErrandEventListener.java`](notification-service/src/main/java/com/campuscouriers/notification_service/event/ErrandEventListener.java)
- [`notification-service/src/test/java/com/campuscouriers/notification_service/NotificationServiceApplicationTests.java`](notification-service/src/test/java/com/campuscouriers/notification_service/NotificationServiceApplicationTests.java)
- [`notification-service/src/test/java/com/campuscouriers/notification_service/event/NotificationEventListenersTest.java`](notification-service/src/test/java/com/campuscouriers/notification_service/event/NotificationEventListenersTest.java)

**Exact prompt**

```text
please remove all the fullstops from the messages. Tell me which messages you changed
```

## AI-09 · Supplier image alternative text

- **Source and mode** — GitHub Copilot Autofix (model unrecorded). Refactor.
- **Date** — 2026-09-24
- **Key response** — The co-authored commit sets the supplier image alternative text to the supplier name.

**Commit evidence** — `de7ce3b`

**Affected files**

- [`frontend/src/components/ui/SupplierCard.tsx`](frontend/src/components/ui/SupplierCard.tsx)

**Prompt availability** — The original prompt and response were unavailable. The summary describes the committed edit.

## AI-10 · Node.js version metadata

- **Source and mode** — GitHub Copilot Autofix (model unrecorded). Generate configuration.
- **Date** — 2026-09-24
- **Key response** — The co-authored commit records `>=22.22.0` as the Node.js engine requirement in the frontend package metadata.

**Commit evidence** — `6fe40fc`

**Affected files**

- [`frontend/package.json`](frontend/package.json) (attribution recorded here because strict JSON has no comment syntax)

**Prompt availability** — The original prompt and response were unavailable. The summary describes the committed edit.

## AI-11 · Escape key during errand submission

- **Source and mode** — GitHub Copilot Autofix (model unrecorded). Debug.
- **Date** — 2026-10-22
- **Key response** — The co-authored commit guards the Escape handler so it cannot close the dialog while submission is in progress.

**Commit evidence** — `e9ca616`

**Affected files**

- [`frontend/src/components/errands/AcceptErrandDialog.tsx`](frontend/src/components/errands/AcceptErrandDialog.tsx)

**Prompt availability** — The original prompt and response were unavailable. The summary describes the committed edit.

## AI-12 · Spring Boot version consistency

- **Source and mode** — GitHub Copilot Autofix (model unrecorded). Debug.
- **Date** — 2026-11-07
- **Key response** — The co-authored commit aligns the notification module’s Spring Boot parent with the version already used by the other services.

**Commit evidence** — `c8ab060`

**Affected files**

- [`notification-service/pom.xml`](notification-service/pom.xml)

**Prompt availability** — The original prompt and response were unavailable. The summary describes the committed edit.

## AI-13 · Kafka Connect startup messages

- **Source and mode** — OpenAI Codex (gpt-6.1-sol). Debug.
- **Date** — 2026-11-07
- **Key response** — Explained the existing connector registration retry loops and how to inspect connector and task status. This was a read-only diagnosis.

**Files inspected**

- [`debezium/register-connectors.sh`](debezium/register-connectors.sh)

**Exact prompt**

```text
wheh i docker compose up i get spammed with kafka connect messages every few seconds is this normal
```

## AI-14 · Registration password validation

- **Source and mode** — OpenAI Codex (gpt-6.1-sol). Explain.
- **Date** — 2026-11-07
- **Key response** — Located the existing 16-character minimum and 128-character maximum in both frontend signup and User Service signup validation. This was a read-only explanation.

**Files inspected**

- [`frontend/src/pages/RegisterPage.tsx`](frontend/src/pages/RegisterPage.tsx)
- [`user-service/src/main/java/com/campuscouriers/user/auth/dto/RegisterRequest.java`](user-service/src/main/java/com/campuscouriers/user/auth/dto/RegisterRequest.java)

**Exact prompt**

```text
is the 16 character restriction envorecd by the frontend or user service for password\
```

## AI-15 · Create-account UI

- **Source and mode** — OpenAI Codex (gpt-5.6-sol). Generate and test.
- **Date** — 2026-10-14
- **Key response** — Implemented the create-account page and entry point from login, connected the form to the existing registration endpoint, and added tests.

**Commit evidence** — `767702b`, `dcae952`

**Affected files**

- [`frontend/src/App.tsx`](frontend/src/App.tsx)
- [`frontend/src/components/auth/AuthShell.tsx`](frontend/src/components/auth/AuthShell.tsx)
- [`frontend/src/features/auth/auth.api.ts`](frontend/src/features/auth/auth.api.ts)
- [`frontend/src/features/auth/auth.types.ts`](frontend/src/features/auth/auth.types.ts)
- [`frontend/src/pages/LoginPage.tsx`](frontend/src/pages/LoginPage.tsx)
- [`frontend/src/pages/RegisterPage.tsx`](frontend/src/pages/RegisterPage.tsx)
- [`frontend/src/features/auth/auth.api.test.ts`](frontend/src/features/auth/auth.api.test.ts)
- [`frontend/src/pages/LoginPage.test.tsx`](frontend/src/pages/LoginPage.test.tsx)
- [`frontend/src/pages/RegisterPage.test.tsx`](frontend/src/pages/RegisterPage.test.tsx)

**Exact prompts**

```text
create a create account button and create account page. Look at the figma for an idea of what it can look like
```

```text
proceed
```

## AI-16 · Attribution documentation

- **Source and mode** — OpenAI Codex (gpt-6.1-sol). Generate documentation.
- **Date** — 2026-11-11
- **Key response** — Added file comments, this usage log, and a consolidated README section for the verified entries. Confirmed that the deck’s Links slide contains the Project README hyperlink.

**Affected files**

- [`README.md`](README.md)
- [`AI_USAGE_LOG.md`](AI_USAGE_LOG.md)

[Links slide](https://docs.google.com/presentation/d/1YfuhkpEC25hvwEcsLNlRBlbBBJp_gJZA4IKRnOFL4H8/edit#slide=id.h575d402474dc8f7d_1_94)

**Exact request excerpt**

```text
Help me add attributions to the relevant files that I worked on
```

## AI-17 · Courier pickup and requester receipt controls

- **Source and mode** — OpenAI Codex (gpt-6.1-sol). Generate and test.
- **Date** — 2026-11-07
- **Key response** — Wired the assigned courier’s pickup action and the requester’s receipt and problem-report actions to the existing Order Service flow. Added frontend tests for those actions.

**Commit evidence** — `8775e70`

**Affected files**

- [`frontend/src/components/errands/ErrandActionDialog.tsx`](frontend/src/components/errands/ErrandActionDialog.tsx)
- [`frontend/src/features/errands/errand.api.ts`](frontend/src/features/errands/errand.api.ts)
- [`frontend/src/features/errands/errand.api.test.ts`](frontend/src/features/errands/errand.api.test.ts)
- [`frontend/src/pages/ErrandDetailsPage.tsx`](frontend/src/pages/ErrandDetailsPage.tsx)
- [`frontend/src/pages/ErrandDetailsPage.test.tsx`](frontend/src/pages/ErrandDetailsPage.test.tsx)

**Exact prompts**

```json
"In the frontend there should be a way for the requester to cancel an errand if a courier has not accepted it. You should also implement the new flow of the courier confirming the item is ready for pickup. so order flow will look like this\n\nRequester makers an errand\nrequester can cancel the errand\nCourier accepts the errand \nrequester can no longer cancel the errand\nCourier indicates the item is ready for pickup\nRequester confirms that item has arrives and credits transfer, or requester reports problem\n\n\n Implement this for the frontend with the given contracts and API endpoints\n"
```

```text
The frontend will have to accept from DELIVERED
```

```text
ok make the commits
```

## AI-18 · Standalone errand creation preview

- **Source and mode** — OpenAI Codex (gpt-5.6-sol). Generate and test.
- **Date** — 2026-10-17
- **Key response** — Implemented the requested frontend form preview, removed the supplier-page step label, redirected the sidebar button to the form, and added UI tests.

**Commit evidence** — `0f426f1`, `09f9da8`, `b7c366c`

**Affected files**

- [`frontend/src/App.tsx`](frontend/src/App.tsx)
- [`frontend/src/components/errands/CreditOfferCard.tsx`](frontend/src/components/errands/CreditOfferCard.tsx)
- [`frontend/src/components/ui/FormField.tsx`](frontend/src/components/ui/FormField.tsx)
- [`frontend/src/components/layout/MobileBottomNav.tsx`](frontend/src/components/layout/MobileBottomNav.tsx)
- [`frontend/src/components/layout/Sidebar.tsx`](frontend/src/components/layout/Sidebar.tsx)
- [`frontend/src/components/ui/SupplierCard.tsx`](frontend/src/components/ui/SupplierCard.tsx)
- [`frontend/src/pages/SuppliersPage.tsx`](frontend/src/pages/SuppliersPage.tsx)
- [`frontend/src/pages/CreateErrandPage.tsx`](frontend/src/pages/CreateErrandPage.tsx)
- [`frontend/src/pages/CreateErrandPage.test.tsx`](frontend/src/pages/CreateErrandPage.test.tsx)
- [`frontend/src/index.css`](frontend/src/index.css)

**Exact prompts**

```text
[https://www.figma.com/design/VhEDwbUypQ52Dj2agGpkXJ/CS3219-Mockup?node-id=7-2&p=f&t=bEFh4l5lSF6cTKX0-0](https://www.figma.com/design/VhEDwbUypQ52Dj2agGpkXJ/CS3219-Mockup?node-id=7-2\&p=f\&t=bEFh4l5lSF6cTKX0-0)

create a plan for creating the errand creation page inspired by the existing style and the figma. Do not connect any back end services yet, these commits should be to create the frontend appearance first
```

```text
also include in your plan to remove the 1 of 3 from the supplier page, since now people can go directly to errand creation
```

```text
finally include in your plan to change the lime choose a supplier button to redirect straight to the errand creation page
```

```text
ok execute the plan
```

## AI-19 · Browse Errands dashboard preview

- **Source and mode** — OpenAI Codex (gpt-5.6-sol). Generate and test.
- **Date** — 2026-10-20
- **Key response** — Rendered the requested frontend dashboard preview with space for active errands and added tests for the dashboard UI.

**Commit evidence** — `7d7f0fe`, `839a4f2`

**Affected files**

- [`frontend/src/pages/DashboardPage.tsx`](frontend/src/pages/DashboardPage.tsx)
- [`frontend/src/pages/DashboardPage.test.tsx`](frontend/src/pages/DashboardPage.test.tsx)

**Exact prompts**

```text
[https://www.figma.com/design/VhEDwbUypQ52Dj2agGpkXJ/CS3219-Mockup?node-id=7-2&p=f&t=bEFh4l5lSF6cTKX0-0](https://www.figma.com/design/VhEDwbUypQ52Dj2agGpkXJ/CS3219-Mockup?node-id=7-2&p=f&t=bEFh4l5lSF6cTKX0-0)
create a plan for creating the errand dashboard page inspired by the existing style and the figma. Do not connect any back end services yet, these commits should be to create the frontend appearance first
```

```text
try again but only have the elements the current backlog features and current apis can support. There should not be a weekly impact summary. There should be a space for the active errands panel as active errands will eventually be displayed.
```

```text
execute your proposed commits
```

## AI-20 · Errand details preview

- **Source and mode** — OpenAI Codex (gpt-5.6-sol). Generate and test.
- **Date** — 2026-10-22
- **Key response** — Rendered the frontend errand details preview with manual refresh and added tests for preview states.

**Commit evidence** — `0c0d1ce`, `9175de5`, `c232c9a`

**Affected files**

- [`frontend/src/pages/ErrandDetailsPage.tsx`](frontend/src/pages/ErrandDetailsPage.tsx)
- [`frontend/src/pages/ErrandDetailsPage.test.tsx`](frontend/src/pages/ErrandDetailsPage.test.tsx)

The chat also contained the existing Order Service Endpoint Guide as reference. The preview used local mock data.

**Exact prompts**

```text
create a plan for creating the errand details page inspired by the existing style and the figma. Do not connect any back end services yet, these commits should be to create the frontend appearance first
```

```text
Do not poll the API as we are adding SSE later. For now we will manually refresh.
```

```text
plan the errand details page commits
```

```text
execute
```

## AI-21 · Display the existing credit balance

- **Source and mode** — OpenAI Codex (gpt-5.6-sol). Generate and test.
- **Date** — 2026-10-23
- **Key response** — Replaced placeholder credit amounts in the header and errand form with the existing Credit Service balance and added display tests.

**Commit evidence** — `12bad48`, `b4aa90e`

**Affected files**

- [`frontend/src/components/errands/CreditOfferCard.tsx`](frontend/src/components/errands/CreditOfferCard.tsx)
- [`frontend/src/components/layout/AppHeader.tsx`](frontend/src/components/layout/AppHeader.tsx)
- [`frontend/src/components/layout/AppHeader.test.tsx`](frontend/src/components/layout/AppHeader.test.tsx)
- [`frontend/src/pages/CreateErrandPage.tsx`](frontend/src/pages/CreateErrandPage.tsx)
- [`frontend/src/pages/CreateErrandPage.test.tsx`](frontend/src/pages/CreateErrandPage.test.tsx)

**Exact prompts**

```text
come up with a plan to update the UI's current placeholder credit amount with the user's real credit amount using the newly added credit api
```

```text
plan the commits
```

```text
execute
```

## AI-22 · Requester delivery notification

- **Source and mode** — OpenAI Codex (gpt-6.1-sol). Generate and test.
- **Date** — 2026-11-07
- **Key response** — Added the requested requester alert when the courier marks an errand delivered. Used the existing errand.delivered event and added coverage for the alert.

**Commit evidence** — `1684b0d`

**Affected files**

- [`notification-service/README.md`](notification-service/README.md)
- [`notification-service/src/main/java/com/campuscouriers/notification_service/event/ErrandEventListener.java`](notification-service/src/main/java/com/campuscouriers/notification_service/event/ErrandEventListener.java)
- [`notification-service/src/test/java/com/campuscouriers/notification_service/NotificationServiceApplicationTests.java`](notification-service/src/test/java/com/campuscouriers/notification_service/NotificationServiceApplicationTests.java)

**Exact prompts**

```text
errand completed should also notify requester. Also when courier indicates that the item is ready for collection, there should be a notification for the requester. Make use of the existing order service events described in the even list.
```
## AI-23 · Docker Compose port conflict

- **Source and mode** — OpenAI Codex. Debug.
- **Date** — 2026-11-11
- **Key response** — Identified the duplicate host-port mapping and changed the RAG service from port 8005 to 8006.

**Affected files**

- [`compose.yaml`](compose.yaml)

**Exact prompt**

```text
Error response from daemon: failed to set up container networking on endpoint foc-template-ai-errand-assistant-service-1: Bind for 0.0.0.0:8005 failed: port is already allocated

Help me fix this error
```

## AI-24 · Cloud RAG API debugging

- **Source and mode** — OpenAI Codex. Debug and explain.
- **Date** — 2026-11-11
- **Key response** — Traced the deployed RAG request path and diagnosed possible uncaught database or Anthropic SDK failures behind the HTTP 500 response. A temporary change to `RAG-service/app/main.py` was later undone.

**Files inspected**

- [`RAG-service/app/main.py`](RAG-service/app/main.py)
- [`RAG-service/app/config.py`](RAG-service/app/config.py)
- [`RAG-service/app/retrieval.py`](RAG-service/app/retrieval.py)
- [`RAG-service/app/claude.py`](RAG-service/app/claude.py)
- [`RAG-service/app/auth.py`](RAG-service/app/auth.py)
- [`k8s/app/rag-service.yaml`](k8s/app/rag-service.yaml)

**Exact prompts**

```text
The RAG service encounters a 500 internal server error when trying to make an API call to it when deployed to cloud
```

```text
What models can my API key access
```

```text
Dont make any changes to the file. Undo any changes you have made
```

## AI-25 · RAG ingestion chunk generation

- **Source and mode** — OpenAI Codex. Generate.
- **Date** — 2026-11-10
- **Key response** — Generated and validated a replacement RAG chunk CSV from the project’s implemented user-facing workflows.

**Affected files**

- [`RAG-service/ingestion/chunks.csv`](RAG-service/ingestion/chunks.csv)

**Exact prompt**

```text
Generate a file to replace RAG-service.ingstion.chunks.csv
```

## AI-26 · Frontend Order Service testing

- **Source and mode** — OpenAI Codex. Explain.
- **Date** — 2026-10-22
- **Key response** — Explained how to start the services and test errand creation and credit reservation through the frontend.

**Exact prompt**

```text
Run me through the steps of how to test this on the front end
```

## AI-27 · Missing wallet during errand creation

- **Source and mode** — OpenAI Codex. Debug.
- **Date** — 2026-10-22
- **Key response** — Inspected the wallet-provisioning and Kafka event flow and identified that the Credit Service wallet listener was not starting.

**Exact prompt**

```text
When I try to create an errand, it says no wallet found
```

## AI-28 · Courier wallet missing during delivery confirmation

- **Source and mode** — OpenAI Codex. Debug and explain.
- **Date** — 2026-10-22
- **Key response** — Explained the likely wallet-provisioning issue and advised checking the existing courier’s wallet instead of deleting accounts or database volumes.

**Exact prompt**

```text
Now when I try to confirm a delivery it says courier wallet not found

It could be because the courier account I was using was created before the order service was integrated. Would deleting all accounts and creating new ones help?
```

## AI-29 · Credit Service build error

- **Source and mode** — OpenAI Codex. Debug.
- **Date** — 2026-10-22
- **Key response** — Explained that the Kafka dependency used the wrong Maven group ID and provided the corrected dependency declaration.

**Affected files**

- [`credit-service/pom.xml`](credit-service/pom.xml)

**Exact prompt**

```text
I got the following error running docker compose up -d --build:

target credit-service: failed to solve: process "/bin/sh -c mvn -B -q dependency:go-offline" did not complete successfully: exit code: 1
```

## AI-32 · Supplier building-ID validation

- **Source and mode** — OpenAI Codex. Explain and debug.
- **Date** — 2026-10-08
- **Key response** — Examined the Supplier Service implementation and explained how building IDs are currently validated.

**Exact prompt**

```text
Is there a way for the supplier service to verify if a building id is valid?
```

## AI-35 · Order Service tutorial

- **Source and mode** — OpenAI Codex. Explain and generate test examples.
- **Date** — 2026-10-02
- **Key response** — Explained FastAPI microservice concepts and provided endpoint test examples.

**Affected files**

- [`order-service/README.md`](order-service/README.md)
- [`order-service/main/order_service.py`](order-service/main/order_service.py)
- [`order-service/test/test_hello_service.py`](order-service/test/test_hello_service.py)
- [`order-service/test/test_echo_service.py`](order-service/test/test_echo_service.py)

**Exact prompt**

```text
I'm planning to set up the microservices for the order-service for this project.
But I am unfamiliar with microservices and HTTP requests to endpoints.

I am planning to use FastAPI to handle the API connections.

Please give me a tutorial to guide me on how to make a microservice. This tutorial should include testcases so I can check that I have made my microservice correctly.
```


