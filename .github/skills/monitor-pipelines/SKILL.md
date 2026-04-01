---
name: monitor-pipelines
description: Monitor GitHub Actions pipeline runs asynchronously using background agents. Use this after pushing code, when the user asks to "watch", "monitor", "check pipelines", "let me know when done", or "notify me when the build finishes".
---

# GitHub Actions Pipeline Monitor

Monitors GitHub Actions workflow runs asynchronously by launching a background agent that polls until all runs complete, then notifies the user.

## When to Use

- After pushing code to the repository
- User says "monitor the pipelines", "watch the build", "check if CI passes"
- User says "let me know when the build finishes"
- User says "monitor both pipelines"

## Repository Context

This repository (`alejandroechev/medical-data-app`) has these workflows:

| Workflow | File | Triggers |
|----------|------|----------|
| **CI/CD — Test & Deploy** | `ci-cd.yml` | Push to master |
| **Build Android APK** | `build-android.yml` | Push to master (src/src-tauri changes), manual dispatch |
| **Weekly DB Backup** | `backup.yml` | Schedule, manual |

## How It Works

Launch a **background general-purpose agent** that:
1. Lists recent workflow runs for the repository
2. Identifies in-progress runs from the latest push
3. Polls their status at the specified interval
4. When all runs complete, returns a summary with pass/fail status
5. For failed runs, fetches job logs to identify the error

When the background agent completes, you receive a system notification automatically. Use `read_agent` to get the result, then report to the user.

## Implementation

### Step 1: Gather parameters

Identify from context:
- **Owner**: `alejandroechev`
- **Repo**: `medical-data-app`
- **Commit SHA** (optional): the latest push SHA to filter runs
- **Polling interval**: how often to check, in seconds (default: 60)
- **Maximum monitoring time**: how long to poll before timing out (default: 30 minutes)

### Step 2: Launch background agent

Use the `task` tool with `mode: "background"` and `agent_type: "general-purpose"`:

```
task(
  agent_type: "general-purpose",
  mode: "background",
  description: "Monitor GitHub Actions pipelines",
  prompt: <see prompt template below>
)
```

### Prompt Template

Adapt this template, filling in the actual values:

```
Monitor GitHub Actions workflow runs for alejandroechev/medical-data-app until all in-progress runs complete.

Parameters:
- Owner: alejandroechev
- Repo: medical-data-app
- Polling interval: {intervalSeconds} seconds (default 60)
- Maximum monitoring time: {maxMinutes} minutes (default 30)

Instructions:
1. Use `github-mcp-server-actions_list` with method: "list_workflow_runs", owner: "alejandroechev", repo: "medical-data-app", per_page: 6 to get recent runs.
2. Parse the JSON response to find runs with status: "in_progress" or "queued".
3. For each in-progress run, note: run ID, workflow name, status, conclusion.
4. If any runs are still in_progress or queued:
   - Run `Start-Sleep -Seconds {intervalSeconds}` using the powershell tool
   - Go back to step 1
5. When ALL runs are completed, for each completed run:
   - Note the conclusion (success/failure/cancelled)
   - If conclusion is "failure", use `github-mcp-server-get_job_logs` with run_id, failed_only: true, return_content: true, tail_lines: 40 to get error details
6. Return a summary table:

   | Workflow | Status | Duration | Details |
   |----------|--------|----------|---------|
   | CI/CD    | ✅/❌  | Xm Ys   | (error if failed) |
   | Android  | ✅/❌  | Xm Ys   | (error if failed) |

CRITICAL rules — you MUST follow these:
- Do NOT use the `task` tool. Do NOT launch sub-agents. Do ALL work yourself sequentially.
- Use the `powershell` tool with `Start-Sleep -Seconds {intervalSeconds}` for waiting between checks.
- Use GitHub MCP tools directly to query workflow status.
- Keep polling until ALL in-progress runs complete or timeout is reached.
- Maximum monitoring time: {maxMinutes} minutes. If still running after that, return with a timeout message.
- The response from list_workflow_runs may be very large. Save it to a temp file and parse with PowerShell if needed.
```

### Step 3: Acknowledge to user

After launching the background agent, tell the user:

```
🔍 Monitoring GitHub Actions pipelines for medical-data-app.
   Checking every {interval} seconds. I'll notify you when all runs complete.
```

### Step 4: Handle completion notification

When you receive the system notification that the background agent completed:
1. Use `read_agent` to get the result
2. Report to the user with the summary table

For all success:
```
✅ All pipelines passed!

| Workflow | Status | Duration |
|----------|--------|----------|
| CI/CD — Test & Deploy | ✅ Success | 2m 30s |
| Build Android APK | ✅ Success | 8m 15s |
```

For failures:
```
❌ Pipeline failures detected:

| Workflow | Status | Duration | Error |
|----------|--------|----------|-------|
| CI/CD | ✅ Success | 2m 30s | — |
| Android APK | ❌ Failed | 5m 10s | Missing NDK version... |
```
