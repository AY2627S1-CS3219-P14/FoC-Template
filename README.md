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
├── <n2h-service>/
└── README.md
```

- Any **nice-to-have (N2H)** feature that warrants its own service should
  be added as an **additional folder** at the same level, following the
  same per-service structure.
- Files for agentic coding tools (e.g. agent configs, prompts, skills)
  may be added as needed, but must still **respect the
  one-service-per-folder skeleton** for core implementation.

---
