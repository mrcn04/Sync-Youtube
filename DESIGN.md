# Sync YouTube interface

An app surface for friends: one video, shared controls, then conversation.
The workflow is connect → watch/load → choose a chat name → talk.
No workspace brand was supplied; these are local app design choices, not a company identity.

## Direction and references

Considered: airy light cinema, playful saturated lounge, restrained dark screening room.
Chosen: dark screening room, keeping imagery in the YouTube player and expression in
the compact play mark and pale leaf controls.
YouTube's theater view informs video-first hierarchy; Discord's channel layout informs
the persistent chat beside the activity. Deliberate deviation: no channel sidebar,
no cluttered engagement metrics, and a warm leaf accent instead of either brand's color.

## Tokens

Ground #161b20, video #0c1014, surface #20272e, elevated #2a333c,
text #edf1f3, muted #a7b3bc, action #c9e893.
DM Sans with system sans fallback; sizes 12 / 14 / 18 / 32 / 40px;
body line height 1.5, display 1.1. Spacing 4px base, 8/12/16/24/32/48px steps.
Control radius 8px, surface radius 12px. Filled surfaces, no outlined rounded cards.
Player/chat desktop split 1fr/340px; stack at 900px. Controls min height 44px.
Focus 2px leaf outline, 3px offset; muted disabled controls; no decorative animation.
Chat username hash/palette intentionally preserved from the original app; chips choose a light or dark ground for legibility.
