# GTD Adventure

English | [简体中文](./README.zh-CN.md)

Connect everyday actions to the life you want to build, through a bright fantasy-adventure GTD interface.

GTD Adventure is an evolving interface prototype exploring **purpose, personal growth, and trust** without changing the meaning of GTD. Its visual direction combines ivory, gold, and royal blue with shields, scrolls, mountains, trails, and a place to return to camp.

**Current interactive version: v8.2 — English by default, with a Chinese language switch.** The filename remains [`gtd-adventure-workbench-v8.html`](./docs/prototypes/gtd-adventure-workbench-v8.html) to preserve continuity with existing local prototype records.

> This is a standalone design prototype, not a production GTD application. Built-in items are examples. Anything you enter stays in the local prototype; there is no connection to a live GTD system or cloud sync.

## Try it

1. Download [the current workbench HTML file](./docs/prototypes/gtd-adventure-workbench-v8.html). Use **Download raw file** on GitHub; the source-code preview does not run the interface.
2. Open it in a modern browser with JavaScript and native `dialog` support.
3. Look for **“v8.2 · Bilingual workbench”** at the top. It opens in English unless you previously selected Chinese. If you see an older version, check that you opened the latest file from this repository.

All styles and interaction code are included in that one HTML file. No build step, online fonts, external images, or dependency installation is needed to try the interface.

A useful first journey:

**Capture one thing → add it to Inbox → clarify it into a next action → find it in Engage → complete it → inspect the record or undo.**

## Languages

- **English is the default** on a first visit, regardless of browser language.
- Use **中文** or **English** in the top-right corner to switch. Your choice is remembered when browser storage is available.
- Navigation, buttons, instructions, empty states, feedback, completion receipts, displayed dates, and bundled examples are available in both languages.
- **Your own words remain your own.** Task titles, notes, and review entries are never automatically translated, even if they match an interface label.
- Switching languages preserves the active workspace, selected action, context filter, drafts, and completion records.
- Language preferences are stored separately from task data. Existing item IDs and saved records remain compatible.
- Detailed design-reference documents remain in Chinese. This bilingual release covers the current workbench and project README.

## What works today

| Adventure workspace | GTD step | Prototype behavior |
| --- | --- | --- |
| Gather Clues | Capture | Record an item and notes in Inbox; retain capture drafts. |
| Read the Clues | Clarify | Choose Next Actions, Waiting For, Someday/Maybe, or Reference. |
| Pack Your Gear | Organize | Browse lists, open actions or Inbox items, and return captured non-action items to Inbox. |
| Camp Review | Reflect | Inspect current commitments and completed actions; write and save review notes. |
| Take the Trail | Engage | Choose an action by context, see its linked direction, and complete, undo, or restore it. |

The five workspaces share the same records. An item is not duplicated into a separate game-task system.

- Tabs support clicking, arrow keys, Home, and End.
- Narrow screens retain the five-step navigation. Engage also has action, quest-log, and trail-journal panels.
- Completing an action **does not automatically complete its project**.
- Saving review notes **does not count as completing a Weekly Review**.
- Missing purpose, goal, or project links are shown honestly; the prototype does not invent a life direction for you.
- The **GTD terms** button shows or hides canonical labels alongside the adventure language.

The overall visual feeling is confirmed, but individual adventure names and interactions are still design candidates.

## Design principles

### Purpose

Help people understand why an action matters and connect it to a direction they choose for themselves. A sense of mission is an experience goal, not an extra GTD horizon.

### Personal growth

The person using the system is the one who grows. Growth comes from real actions, choices, and reflection—not from caring for a virtual character or equating task counts with personal worth.

### Trust

Build confidence through inspectable records, clear states, and recoverable actions. Fictional scores and rewards cannot substitute for reliability.

There are no points, XP, levels, streak penalties, or virtual assets in this prototype. The future assistant is envisioned as a **long-term companion and private advisor**, reserved for phase two. Conversation, long-term memory, proactive advice, and agentic execution are not implemented.

### Keep the GTD meaning intact

Adventure language adds atmosphere, not a different method:

| Adventure expression | Underlying concept |
| --- | --- |
| Your Oath | Purpose |
| Milestone | Goal |
| Main Quest | Project |
| One Step | Next Action |
| Clue Pouch | Inbox |
| Camp Review | Reflection and review |

An appointment remains an appointment; the theme must not invent a new travel task. A standalone action does not need an extra project just to fit the story.

See the detailed [growth experience principles](./docs/product-reference/growth-experience-principles.md), [GTD Chinese terminology](./docs/product-reference/glossary.zh-CN.md), and [responsive design rules](./docs/product-reference/responsive-rules.md). These reference documents are currently in Chinese.

## Local data and privacy

- Items, completion history, capture drafts, and review notes use the current browser’s `localStorage`.
- Unconfirmed Clarify edits stay in memory while navigating tabs or the queue. Those unconfirmed edits do **not** survive a refresh.
- Records are not guaranteed to be shared across browsers, file locations, or addresses. If storage is unavailable, the interface reports that changes last only for the current page session.
- Unreadable existing records are not automatically overwritten.
- There are no accounts, cloud backups, cross-device sync, import/export, or collaboration features.
- Local storage is not an encrypted vault. Use demonstration content, not sensitive information or the only copy of an important commitment.
- Browser input is not written back into the HTML file. Publishing source code does not publish the records in your browser.
- Moving from an older copy of the HTML file to a different folder may use a different storage area. This release does not migrate data between locations.

## Development and tests

The interface uses plain HTML, CSS, and JavaScript. Automated checks use Node.js’s test runner and jsdom.

From the repository root:

```sh
npm ci
npm test
```

Tests require **Node.js 22.13.0 or later**. Node.js is not needed just to open the HTML interface.

The **37 DOM and interaction checks** cover navigation, keyboard behavior, item flow, draft retention, completion and restore, legacy records, storage failures, English defaults, language switching, translation coverage, and literal, safe rendering of user text.

These are not screenshot or real-browser layout tests. Desktop fit at 1024×750, mobile screenshots, and native-dialog focus trapping still need browser acceptance testing. The project does not claim production readiness.

For localization changes, keep item IDs and stored context values stable. Translate only authored interface copy and bundled examples, never user content. Run the full tests after interaction or language changes.

## What comes next

- Verify desktop and mobile layouts in real browsers, in both languages.
- Refine each workspace’s density, adventure wording, and GTD terminology.
- Develop deeper decisions and editing incrementally. Scheduling, project linking, the two-minute rule, attachments, and full list editors are not implemented yet.
- Keep the assistant in phase two.

For feedback, include the version, language, browser, screen size, steps, expected behavior, and actual result. Please do not include real private tasks or sensitive records.

## Repository scope

This repository publishes only the current standalone hero-adventure workbench, design principles, and tests. Earlier prototype files have been removed from the current branch; they remain recoverable through Git history. It excludes the original GTD application’s backend, deployment configuration, private migration records, and Git history.

**No online demo hosting is configured.** A public GitHub repository is not a deployed website.

- `README.md`: English project guide, the default repository homepage.
- `README.zh-CN.md`: Chinese project guide.
- `docs/prototypes/`: the current bilingual hero-adventure workbench.
- `docs/prototypes/tests/`: interaction and localization regression checks.
- `docs/product-reference/`: experience principles, GTD terminology, and responsive boundaries.
- `package.json` and `package-lock.json`: test dependencies only.

## License

The author has not selected a license. No open-source license is attached to this release.
