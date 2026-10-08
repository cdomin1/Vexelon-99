# Phase 2 / Phase 3 rules — decision draft

Status: **PHASE 2 APPROVED by the user on 2026-10-08 (P2-1 through P2-4 and their tutorial/acceptance requirements). Phase 3 remains PROPOSED and DISABLED.**
Prepared 2026-10-08. Inspected clean `feature/phase-1-verification` at `77258cd`. The new user request supersedes older Phase 2/3 exclusions only. Phase 4, automatic merges and deployment remain excluded. Push is still deferred. Subsequent WASD work is separately authorized and does not approve any rules below.

## A. Verified existing behavior

Code inspection, not a claim of fresh full acceptance:

- `engine.mjs`: 6×12 board; clears last .42s; initial fall .16s, post-clear fall .2s; ordinary chain grace .12s plus Overdrive modifier. These phases return before incoming/Danger/rise updates.
- `Board.receive(amount, delay=4)` appends packets. Every packet delay decreases only on idle ticks; only expired packets at the queue head land. Cancellation consumes FIFO, partially reducing the head before later packets. Packets currently contain amount/delay, without persistent source identity.
- Top-row occupancy advances Danger on idle ticks. Empty top resets Danger on idle processing. Critical presentation begins at >=1; elimination is strictly >2. Glitch placement that cannot fit can eliminate immediately, independently of this timer.
- Clear attack budget: `(count>3 ? count-1 : 0) + (chain>1 ? (chain-1)*6 : 0)`, multiplied/rounded by the active attack buff before own incoming cancellation. Any successful cancellation awards Counter +8 once per clear, generation-modified/capped; Pulse/raw cancellation has no Counter bonus. Server applies its existing KO adjustment and attack cap when sending excess. Preserve the complete pipeline, not just its first formula.
- Slab placement has a minimum width of three and existing grouping/rounding. Nominal packet units and occupied slab cells can differ, especially for 1–2 residual units. Do not silently rebalance this in Phase 2.
- Pulse costs 35, removes up to six queued units, self first; if self queue is empty in Teams, it chooses a living teammate with the largest incoming queue. Shift removes/translates the bottom row without a clear reward.
- Ability cooldowns, buffs and full-Flux hold advance through Board ticks, including clear/fall/grace; competitive countdown does not tick boards. Simulation uses .05s steps. New timer semantics must be explicit.
- Server is authoritative for both clients. Target selection, attack IDs and duplicate protection are already present. Resume preserves the Board object for the existing 15-second reconnect window while simulation continues; it is not a fresh match.
- CPUs use legal swaps and the same resources; difficulty step/think/mistake values are established. The current CPU only plans in idle, which matters for chain-grace actions.
- Tutorial/Practice reuse shared rules with isolated assistance. Existing curricula, SFX-only sound, empty music library, Kode Mono, accessibility and controller paths remain.
- Phase 1 graphical, full browser, physical-controller and listening acceptance gaps remain open. Historical test counts are not new evidence for this draft.

Sources inspected: AGENTS.md, Phase 1 verification, Neo-Vector style guide, music/import/status/audio docs; engine/config/abilities/match-rules/server/CPU; client rendering/input/HUD/audio; tutorial catalog/training and existing unit/native/browser fixtures.

## B. Established concepts, without approved numbers

Phase 2: make incoming threats understandable, reward deliberate counterplay through Reversal, distinguish chain tiers, and explain Cascade in relation to falling chains.

Phase 3: improve Danger/Critical communication and add skill-earned Last Stand and Hot Tile comeback opportunities. Being near elimination must not grant an automatic rescue.

The names and goals are established by the current request. None of the triggers, rewards, thresholds or numbers proposed below are established balance.

## C. Recommended rules and configurable starting values

### P2-1 — Incoming queue / Counter Window

Recommendation: keep FIFO and the existing four idle-simulation-second delay as the entire counter window. Do not add another arrival timer. Clears, falls and grace continue to pause the incoming clock. Show ordered packets, remaining units, source seat when known, and a remaining-window bar; mark the last 1.0 idle second as urgent. Label tutorial timing as simulation time: clears pause it.

Partial counters reduce the oldest packet without resetting its delay. Exact expiry: an already-resolving clear finishes/cancels before the next idle landing pass; at an idle tick, decrement and land head packets whose delay is <=0. Preserve head-of-line ordering even when a later packet expires earlier. A landed slab cannot be queue-countered. Hide the warning when no positive queued threat remains.

Pulse and teammate rescue preserve their current eligibility/cost/FIFO behavior. Neither causes Reversal. Add packet IDs/source IDs/original amount and reflected flag as server metadata, preserving existing amount/delay fields.

Tradeoff: countdown bars pause during skillful clear sequences. Switching to real-time arrival would materially increase pressure; that is an alternative requiring separate approval.

### P2-2 — Reversal

Recommendation: a resolving chain x2+ that completely cancels an eligible individual incoming packet during its last 1.0 idle second can return part of it to that packet's source. Full cancellation refers to that packet, not the entire queue.

- Calculate from that packet's remaining amount immediately before this clear's cancellation: `min(6, floor(remaining * 0.5))`. If the result is below 3, no Reversal. This prevents a new sub-three packet from exploiting slab minimum width.
- At most one return per clear, oldest eligible packet first. Cooldown: 8 active Board-simulation seconds, advancing during clear/fall/grace, paused during pre-match countdown. Trigger only when cooldown is zero.
- Return joins the source's incoming tail with the ordinary 4-idle-second delay. Mark it reflected and non-reflectable. It can still be canceled or Pulsed; those defenses cannot reflect it again.
- No new Flux bonus; preserve the existing one Counter +8 award per clear. No KO bonus or Surge/Overdrive multiplication on the returned amount. Existing outgoing excess still follows the normal attack pipeline.
- Source must still be a living hostile participant in this room. If absent, dead or currently disconnected, consume the eligible reversal opportunity/cooldown but send nothing and show no false outgoing attack. Never retarget it. A later reconnect does not replay it.
- Reflection uses server-generated event IDs and packet IDs; client messages cannot request or forge a return. Track source for KO attribution consistently with ordinary attacks.

Tradeoff: this adds a capped attack reward for timed skilled defense. Safer alternative: Reversal presentation only, no returned attack. Approval must choose the mechanical version or explicitly choose the alternative.

### P2-3 — Chain attack personalities

Recommendation: presentation-only tiers initially: x2–3 rapid narrow traces, x4–5 heavier segmented traces, x6+ concentrated burst. Names/art/cues may be refined without balance effects.

Preserve attack budget, buff/KO arithmetic, one outgoing packet per resolving clear, delay, cancellation order and slab placement. Never split a packet solely for animation: splitting can increase occupied slab cells because of the existing minimum width. Trails and sounds do not control receipt or deadlines. Mechanical packet personalities are deferred unless separately specified and approved.

### P2-4 — Cascade

Recommendation: a contextual name/feedback milestone for the first **fall-created** chain link reaching x3 or higher in a chain sequence. Determine it from authoritative match provenance, not the client animation or an input-created grace match. Emit at most once per chain sequence; reset when that sequence ends.

No extra score, Flux, attack, timer extension or new packet. Normal chain rules provide the rewards. This avoids rewarding the same clear twice. A grace swap that creates a match is still a chain but is not itself the falling link needed for Cascade. A later fall-created x4 link can qualify if no earlier Cascade occurred.

### P3-1 — Enhanced Danger / Critical

Recommendation: preserve Danger >0, Critical >=1 and elimination >2 idle seconds. Improve contextual entry/exit cues and a readable ceiling gauge. No new slowdown, protection or Flash-driven game logic. Critical cue once per entry, recovery cue when Danger returns to zero; new entry can cue again. Cosmetic cue debounce .5 active-simulation second, never delaying authoritative state. Do not pulse warnings every frame.

### P3-2 — Last Stand

Recommendation: once per match, successfully resolve a 4+ clear while Critical (Danger >=1, alive, unused) to earn **one additional idle second of ceiling tolerance for this Danger episode**. No new button or free trigger on Critical entry.

- Normal limit remains >2. Once earned, this player's limit becomes >3 for the current episode. Current Danger is not reset or reduced. The qualifying clear receives its normal rewards only.
- Success: top row becomes empty and idle processing resets Danger to zero; retire the extended limit. The use remains spent for the match.
- Failure: Danger exceeds 3 before recovery, or a Glitch slab cannot fit. It does not rescue slab-placement deaths or revive an eliminated player.
- Duration is bounded by the remaining 3-second idle budget, not an additional wall-clock timer. Existing clear/fall/grace pauses remain exactly as before; Last Stand adds no separate pause. On rematch reset to unused; reconnect retains used/active state and elapsed Danger.
- Shift may end the episode through its existing Danger reset, but does not earn Last Stand. Pulse can protect the queue but cannot activate it. Ordinary chain/ability rewards remain unchanged.

Tradeoff: strong clears earn a small survival opportunity without an automatic rescue. Alternative would be a dedicated timed challenge; that requires additional input/eligibility/failure rules and is not assumed here.

### P3-3 — Hot Tile

Recommendation: on a Critical entry, mark one existing normal colored tile if no Hot Tile exists and its 30-active-simulation-second spawn cooldown is ready. No new tile color. Choose deterministically: highest occupied row containing a normal tile, nearest the center, left column wins ties. If there is no eligible normal tile, skip this entry without consuming cooldown.

- Mark has a server-assigned identity/generation; limit one per board. Lifetime 8 active Board-simulation seconds (including clear/fall/grace); cooldown starts on successful spawn and advances on the same clock. Neither clock resets on Critical re-entry or disconnect.
- It follows its actual tile through swaps, gravity and stack rise. Do not infer identity from color or reuse a vanished tile's ID. State snapshots carry current identity, position and remaining lifetime.
- Resolve a normal match containing it before expiry to earn +10 Flux, with existing generation buffs and max-100 cap. No extra score/attack. One award per identity; then remove the mark.
- Expiry <=0 is processed before that tick's clear resolution, so a match finishing exactly at expiry earns nothing. A tile being removed without a qualifying clear earns nothing.
- Shift: translate surviving marks; delete a mark removed with the bottom row, no reward. Rising off the board, death or reset removes it. Glitch conversion creates ordinary unmarked tiles, never duplicates a marker. If future replacement removes the marked tile, delete the marker rather than transferring it.
- Last Stand and Hot Tile may be earned on the same resolving clear, each exactly once. Ordinary clear/Counter rewards still run once. Hot Tile alone does not activate Last Stand unless the clear also meets its 4+ Critical condition.

Tradeoff: marking a tile is automatic, but earning the reward always requires a real match. Approval must explicitly accept the +10 generation-buffed reward and the two simulation-time clocks.

## Cross-cutting behavior for every mechanic

| Mechanic | CPU / teams / network | Tutorial / Practice |
|---|---|---|
| Queue | Same FIFO and clock for CPUs; current Pulse teammate selection; snapshot actual authoritative packets on reconnect | Guided partial/full counter and paused-clock exercise; deterministic incoming fixture |
| Reversal | Same triggers/cooldown/resources for CPUs; score eligible legal defense more highly without changing difficulty rates; source must be hostile; server dedupe; no replay after reconnect | Timed x2 defense lesson plus non-reflectable return example; isolated attack fixture with stable source |
| Personalities | Same tiers for everyone, no different budgets; authoritative chain value; transient SFX never replay on resume | Tier comparison and attack-budget explanation |
| Cascade | Same provenance/one-per-chain rule for CPUs; no extra team pool or network reward; retain chain milestone on resume | Build a falling x3 chain, distinguish from grace swaps; exact success event required |
| Danger | Same thresholds/clocks across players/teams; warning state restored on resume without replay spam | Show paused timer during clear, recovery and elimination; training reset isolated |
| Last Stand | Same once-per-match condition for CPUs; legal defensive swap preference only; no teammate sharing; reconnect cannot restore a use | Complete 4+ in Critical, then actually recover; retry failure in isolated lesson |
| Hot Tile | Same selection/lifetime/reward for CPUs; legal matching priority only; no transfer to teammate, no client-selected spawn; identity persists through resume | Follow mark through swap/fall; match it for reward; demonstrate that expiry/Shift removal does not pay |

All mechanics use shared Node authority in Web/Godot, including native training bridge. Phase capability/configuration must be announced by the server. Unsupported clients must not silently enter a room with hidden rules. Avoid new player messages when an existing swap/clear can drive the authoritative transaction.

Practice assistance stays in isolated TrainingSession state and never affects competitive rewards, records or packet authority. Recommended Practice adds explicit scenario presets for approved mechanics, with existing tools behind Pause. Default free Practice remains relaxed; Phase 3 survival lessons explicitly enable danger/game-over simulation. No competitive resource grants. Tutorial retries may reset fixture state only in training.

## Tutorials, Controls and discoverability (explicit user requirement)

Each phase ships playable lessons, shared help/catalog text, native metadata and input-aware prompts together with its mechanics. Preserve Phase 1 lessons and completion preferences. Add a clearly grouped advanced section without locking existing modes behind it.

Phase 2 lessons: (1) read queue/urgency and partial counter, (2) deliberately earn Reversal, (3) form falling Cascade and compare chain tiers. Phase 3 lessons: (1) understand Critical timing and recover, (2) earn and complete Last Stand, (3) track and match Hot Tile, (4) combined survival exercise. One goal at a time; Next only after real authoritative success. Failure permits retry; Pause provides Controls/exit/restart. Explain timing with simple language and demonstrations, not a wall of numbers.

Update Pause > Controls/help, glossary, tutorial chooser and contextual hints in both clients. Match the selected keyboard/gamepad input; WASD and arrows remain alternatives. Review wrapping and focus navigation in Godot. Update or clearly retire recordings that contradict approved rules; never advertise stale Phase 1 footage as a new mechanic demonstration. No permanent gameplay keyboard legend. SFX-only cues and static reduced-motion/flash alternatives must explain the same events.

## D. Decisions still needed — no silence-as-approval

Approve or amend each ID: P2-1 existing idle-clock window; P2-2 mechanical timed full-packet Reversal; P2-3 presentation-only personalities; P2-4 feedback-only Cascade; P3-1 unchanged thresholds; P3-2 once-per-match skill-earned +1 idle second; P3-3 marked-tile +10 Flux rules. Every number in C is a proposed configurable starting value, except the explicitly identified existing behavior in A.

Recommended rollout: Phase 2 branch from the verified work after this gate, with Phase 3 disabled. Phase 3 follows as a separate branch/change set only after Phase 2's agreed checks pass. Do not start Phase 3 just because its rules are approved.

Proposed Phase 2 gate: fresh full JS suite, deterministic queue/reversal/provenance/budget tests, all-mode/team/CPU/reconnect/duplicate-message checks, actual Web and Godot input-to-state fixtures, and playable lesson success/failure/controller-focus checks. Graphical/SFX review in both clients is part of acceptance; blocked checks remain open and require an explicit decision before proceeding to Phase 3. Synthetic checks do not imply physical-controller or 99-human scalability certification.

Phase 3 adds transformation-by-transformation Hot Tile identity tests, exact expiry ordering, Last Stand success/failure/reset tests, combined Phase 2 interactions, authoritative reconnect, and isolated tutorial/Practice exercises. Report every pass/failure/block with branch/commits. Maintain Phase 1 test expectations unless an approved new rule explicitly changes a named expectation. No Phase 4 mechanics.
