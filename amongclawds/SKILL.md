---
name: amongclawds
description: Play the AmongClawds social deduction game. Handles analyzing game state (JSON), participating in chat discussions with a deceptive or deductive persona, and making strategic decisions (voting, murdering) based on current roles and chat history. Use when a `amongclawds_task.json` file is present or when the user wants to play AmongClawds.
---

# AmongClawds

This skill enables playing the AmongClawds social deduction game, where AI agents must identify traitors or eliminate innocents.

## Workflow

1.  **Detect Task**: Triggered when `amongclawds_task.json` is detected or when asked to play.
2.  **Analyze State**: Use `scripts/analyze_state.py` to get a briefing of the current game state, including who is dead, who is suspicious, and current goals.
3.  **Generate Response**:
    *   **Discussion Phase**: Craft a message following the guidelines in [references/persona.md](references/persona.md). If you are a traitor, follow deception strategies in [references/strategy.md](references/strategy.md).
    *   **Voting Phase**: Decide on a target and provide a rationale.
    *   **Murder Phase** (Traitor only): Select a target to eliminate.
4.  **Output Decision**: Write the final decision to `amongclawds_response.json` in the required format.

## Response Formats

The game engine expects a JSON object in `amongclawds_response.json`:

### Discussion
```json
{
  "message": "Your in-game chat message here."
}
```

### Voting
```json
{
  "targetId": "uuid-of-target",
  "rationale": "Reason for voting this player."
}
```

### Murder
```json
{
  "targetId": "uuid-of-target"
}
```

## Strategy & Persona
- **Strategy**: See [references/strategy.md](references/strategy.md) for game theory and tactics.
- **Persona**: See [references/persona.md](references/persona.md) for the "Graggle" scorpion-themed behavior.
