# Powerlytics Documentation

This documentation set is aligned to the current codebase and is designed for onboarding engineers quickly.

## Start Here

1. [New Developer Guide](onboarding/new-developer-guide.md)
2. [Runbook: Run and Verify Locally](operations/runbook.md)
3. [API Contract](api/api-contract.md)

## Documentation Structure

- [Onboarding](onboarding/new-developer-guide.md)
  - End-to-end orientation for new developers
  - Technology map (why each technology exists, how it works, where code lives)
  - Ports, URLs, services, and startup flow
- [Architecture](architecture/system-overview.md)
  - System context and runtime boundaries
  - Request and event flows
  - Data model and entity relationships
- [API](api/api-contract.md)
  - REST endpoint map with permissions
  - Legacy compatibility routes
  - Payload examples
- [Operations](operations/runbook.md)
  - Local setup, environment variables, command cheatsheet
  - Smoke checks and troubleshooting
  - Deployment guidance
- [Migration](migration/compatibility-checklist.md)
  - Compatibility and cutover checklist

## Accuracy Policy

- These docs describe behavior in the current repository state.
- If implementation changes, update these docs in the same PR.
