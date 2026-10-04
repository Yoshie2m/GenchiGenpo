# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is in the **requirements/planning phase**. The only content is `README.md` (in Japanese). There is no source code, package manifest, build system, linter, or test suite yet, so there are no build/lint/test commands. Update this file once a framework is scaffolded.

## What the app is

GenchiGenpo (現地現物) is a Japanese-themed, "on-site first" team walking app. Members' daily step counts are treated as "patrols" (巡回) toward destinations such as post towns (宿場町), overseas factories, and test courses, and teams compete on step totals.

## Decided / candidate technical direction (from README)

- **Frontend (candidate):** Next.js as a web app / PWA. iOS browsers cannot read step data directly, so step data must come from an external API (e.g. Google Fit, Fitbit) rather than the device. The target OS/device mix (iPhone vs Android, smartwatch support) is still undecided — check before choosing an ingestion approach.
- **Backend:** Supabase (PostgreSQL), chosen for relational modeling of users / teams / step history and because the free plan never auto-upgrades to paid and has built-in API rate limiting.

## Hard constraints

- **Must run entirely within free tiers.** Avoid designs that could incur charges from unexpected traffic spikes (パケ死).
- **Authentication is required in front of the backend** so bots/scripts cannot read or write data. Do not expose unauthenticated data access paths.

## Data model

The README's schema (`users`, `teams`, `steps` keyed by `uid_date`) is written in Firestore-collection terms and is **reference only** — the formal model is to be designed separately using DDD. Do not treat it as the authoritative schema.

## Language

Project documentation is written in Japanese; keep new docs consistent with that unless asked otherwise.
