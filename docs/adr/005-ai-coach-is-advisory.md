# ADR 005 - AI Coach is advisory

## Status
Accepted

## Context
SparkSuite benefits from AI-generated coaching, encouragement, and explanation, but AI output must never become the source of truth for scoring or progression.

## Decision
The AI coach is advisory only. It may explain, summarize, and suggest focus areas, but it may not directly mutate XP, mastery, unlocks, difficulty, scores, or saved profile state.

## Consequences
This keeps core progression deterministic while still allowing supportive coaching features. AI can add polish, but not authoritative gameplay decisions.

## Allowed
- Coaching notes.
- Practice focus suggestions.
- Encouragement and session summaries.
- Recommendation text that still routes through curriculum approval.

## Forbidden
- AI directly changing XP.
- AI directly changing mastery or unlocks.
- AI rewriting difficulty or hit windows.
- AI writing save data or overriding engine outcomes.

## Enforcement
- Advisory-only AI engine contract.
- Tests covering AI boundary behavior.
- Review of any AI integration that touches progress, scoring, or storage paths.
