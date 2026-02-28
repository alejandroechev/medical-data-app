# MedicalData App

## Description

An app to keep records of personal medical events from me and my family

## Code Implementation Flow

<important>Mandatory Development Loop (non-negotiable)</important>

### Architecture
- **Typescript** Use Typescript as default language, unless told otherwise
- **Tauri** For desktop apps use Tauri framework
- **PWA** For mobile apps, build them as Progressive WebApps
- **Domain Logic Separation** Separate domain logic from CLI/UI/WebAPI
- **CLI** Always implement a CLI with feature parity to WebAPI/UI layer. This is a tool for you as an agent to validate your work

### Git Workflow
- **Work directly on master** — solo developer, no branch overhead
- **Commit after every completed unit of work** — never leave working code uncommitted
- **Push after each work session** — remote backup is non-negotiable. Remote for this repo at https://github.com/alejandroechev/medical-data-app.git
- **Tag milestones**: `git tag v0.1.0-mvp` when deploying or reaching a checkpoint
- **Branch only for risky experiments** you might discard — delete after merge or abandon

### Coding
- **TDD** ALWAYS Work using TDD with red/green flow ALWAYS
- **E2E Tests** Include for every feature E2E tests. Use Playwright for WebApps E2E flows.
- **CLI Scenario Tests** Create descriptive scenarios for every feature that work as instruction for an AI agent to run them using the CLI

### Validation
After completing any feature:
- **Coverage Check** Run ALL unit tests, validate coverage is over 90%
- **E2E Tests** Run ALL e2e tests
- **CLI Scenario testing** Test ALL CLI scenarios
- **Visual validation** If its a UI impacting feature: do a visual validation using Playwright MCP, take screenshots as you tests and review the screenshots to verify visually all e2e flows and the new feature. Store this screenshots in the git ignored screenshots/ folder <important>If Playwright MCP is not available stop and let the user know</important>

<important>If any of the validations step fail, fix the underlying issue. NEVER delete pre-existing tests or scenarios unless specified</important>

### Documentation
- **README** Update readme file with any relevant public change to the app
- **System Diagram** Keep always up to date a mermaid system level diagram of the app architecture in docs/system-diagram.md
- **ADR** For every major design and architecture decision add an Architecture Decision Record in docs/adrs

