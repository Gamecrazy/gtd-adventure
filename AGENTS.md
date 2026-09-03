# Project instructions

- Work on `main` unless the user explicitly requests a different branch.
- This repository contains a standalone UI workbench, not a production GTD application. Do not add production credentials, hosting configuration, private migration records, or real user data.
- Follow [GTD growth experience principles](docs/product-reference/growth-experience-principles.md). Keep approved visual direction separate from candidate terminology and mechanics.
- Preserve canonical GTD semantics from the [Chinese glossary](docs/product-reference/glossary.zh-CN.md). Do not invent purpose, growth scores, or project-completion claims.
- The assistant is phase two and is not implemented in this workbench.
- Keep the HTML workbench self-contained.
- Follow [responsive rules](docs/product-reference/responsive-rules.md). Desktop decision fields and primary actions must fit 1024×750 without scrolling the fixed form.
- Run `npm test` after interaction changes. DOM checks are not a substitute for browser screenshot, layout, or native-dialog accessibility verification.
- Describe local storage and failure states honestly. Never claim a production save or cloud synchronization.
