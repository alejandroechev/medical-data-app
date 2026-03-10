---
name: medical-query
description: Query the family medical records database. Use this skill when the user asks about medical history, treatments, medications, expenses, reimbursements, or health summaries for family members. Trigger phrases include "medical history", "tratamientos", "medicamentos", "resumen gastos", "reembolsos", "what medications", "health summary", "consultas de", "recetas de".
---

# Medical Data Query Skill

Query the family medical records database to answer questions about medical history, treatments, expenses, and reimbursements.

## When to Use

Invoke this skill when the user asks about:
- Medical event history for a family member
- Active treatments / medications
- Expense summaries or reimbursement status
- Documents linked to medical events
- Health summaries

## Available MCP Tools

Use the `medical-data` MCP server tools:

| Tool | Use For |
|------|---------|
| `list_family_members` | Get all family members (names and IDs) |
| `list_events` | Query medical events with filters |
| `get_event` | Get full detail of a specific event |
| `list_treatments` | Get patient drugs/medications |
| `get_expense_summary` | Cost totals and reimbursement breakdown |
| `get_reimbursement_status` | Pending/approved reembolso counts |
| `list_event_documents` | Documents linked to an event |

## Workflow

1. **Identify the patient** — If the user mentions a name, use it directly. If ambiguous, call `list_family_members` first to confirm.

2. **Query the data** — Use the appropriate tool(s) based on the question:
   - "What medications is Antonio taking?" → `list_treatments` with `patient_name: "Antonio"` and `status: "active"`
   - "How much have we spent this year?" → `get_expense_summary` with `from_date` set to Jan 1st
   - "Show me Alejandro's recent events" → `list_events` with `patient_name: "Alejandro"`
   - "Any pending reembolsos?" → `get_reimbursement_status`

3. **Present results** — Format the response in Spanish (the app's UI language), using clear summaries with totals and organized lists.

## Response Language

- All user-facing responses should be in **Spanish** (matching the app's language)
- Use Chilean peso formatting for costs: `$XX.XXX`

## Examples

**User**: "¿Qué medicamentos está tomando Gaspar?"
→ Call `list_treatments(patient_name: "Gaspar", status: "active")`
→ Respond with a formatted list of active medications, dosages, and schedules

**User**: "Resumen de gastos de este mes"
→ Call `get_expense_summary(from_date: "2026-03-01", to_date: "2026-03-31")`
→ Respond with total, reimbursed, pending, and out-of-pocket amounts

**User**: "¿Hay reembolsos pendientes?"
→ Call `get_reimbursement_status()`
→ Respond with pending counts for ISAPRE and Seguro Complementario
