<!--
AI Assistance Disclosure
Tool and date: OpenAI Codex (gpt-6.1-sol), 2026-11-11
Scope (AI-16): Compiled the attribution documentation.
Usage log: AI_USAGE_LOG.md
Author review: Changes validated and confirmed.
AI Assistance Disclosure:
Tool: OpenAI Codex (GPT-5), date: 2026-11-11
Scope: Added only the project-level AI disclosure section and usage-log link at the end.
-->

# CS3219 — Software Design and Architecture (AY2627 Sem 1)

## CampusCouriers

**CampusCouriers** is a peer-to-peer campus errand platform where
students can request items to be collected from stores or facilities on
campus, and other students can fulfil (and deliver) those requests. The
platform runs on a closed credit economy — credits cannot be bought,
withdrawn, or exchanged for money, and only circulate within the platform.

---

## Team Members

| Name | Role |
| ----- | ----- |
| MELODI JOY HALIM ([@meloppeitreet](https://github.com/meloppeitreet)) | User Service |
| LIN YU XIN ([@watermelonisred](https://github.com/watermelonisred)) | Supplier Service |
| TAN YE XIN ([@yx-tzzz](https://github.com/yx-tzzz)) | Credit Service |
| YEO YONG XUAN ([@yoyongxuan](https://github.com/yoyongxuan)) | Order Service |
| YONG YI-TZE ELLIOT ([@yytelliot](https://github.com/yytelliot)) | Frontend React App |

---

## Repository Structure

This repository follows a **one-service-per-folder** structure: each
microservice (`user-service/`, `supplier-service/`, `order-service/`,
`credit-service/`) lives in its own top-level folder.

```text
.
├── user-service/
├── supplier-service/
├── order-service/
├── credit-service/
├── RAG-service/       # RAG knowledge chunks and indexing job
├── <n2h-service>/
├── debezium/          # Kafka Connect connectors that relay each service's outbox to Kafka
└── README.md
```

Services publish events through a **transactional outbox** relayed to Kafka by Debezium; see
[`debezium/README.md`](debezium/README.md) for the pipeline and the event catalogue.

- Any **nice-to-have (N2H)** feature that warrants its own service should
  be added as an **additional folder** at the same level, following the
  same per-service structure.
- Files for agentic coding tools (e.g. agent configs, prompts, skills)
  may be added as needed, but must still **respect the
  one-service-per-folder skeleton** for core implementation.

---

## AI assistance disclosure

We used OpenAI Codex for frontend and notification implementation, debugging, refactoring, tests, and documentation. GitHub Copilot code review and Autofix contributed to specific fixes and configuration changes.

The [AI usage log](AI_USAGE_LOG.md) is a partial record of verified assistance. It lists the tools, dates, exact available prompts, key responses, and file locations. File headers identify the edits recorded for each file. The log records the attribution for `frontend/package.json` because strict JSON has no comment syntax.
## AI Use Summary

Tool recorded here: OpenAI Codex (GPT-5).

The recorded assistance is detailed in [`ai/usage-log.md`](ai/usage-log.md). The tool was used
for Supplier, Chat, and chat-notification implementation and debugging; frontend chat and admin
integration; deployment fixes; tests; explanations; and disclosure documentation. Generated
changes remain subject to author and team review; verification results are listed in the log. It
also records supplier seed-data cleanup and local database reset, seeding, and startup guidance.

Important compliance note: the initial `supplier-service/CONTEXT.md` was generated with AI
assistance that included requirements interpretation and architecture/design proposals. That
use overlaps phases prohibited by Appendix 2 and is disclosed rather than omitted. The team
should independently replace or validate those decisions and consult course staff before
submission. This summary must be extended with every other team member's AI use before final
submission.
