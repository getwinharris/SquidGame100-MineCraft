# GitHub

## Purpose

GitHub Actions automation for PR verification and semantic-tag deployment.

## Ownership

- `workflows/ci.yml` owns pull-request and main-branch verification.
- `workflows/deploy.yml` owns tag-triggered image build and VPS deployment flow.

## Local Contracts

- CI must run typecheck and build for all workspaces.
- Deploy must only run from semantic version tags.
- VPS deployment secrets stay in GitHub Secrets, never in the repo.

## Work Guidance

- Keep workflows readable and stage-scoped.
- Prefer npm workspace scripts over package-specific one-off commands.

## Verification

- Workflow syntax is validated by GitHub Actions on push/PR.

## Child DOX Index

This scope has no child AGENTS.md files.
