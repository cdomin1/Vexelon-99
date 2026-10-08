# Phase 1 verification — 2026-10-08

Overall: **PARTIAL**, not a declaration that every Phase 1 acceptance criterion has passed. Core authority, Flux transactions and native startup pass the checks below. Native graphical review, the full browser graphical/audio suite and physical controller acceptance remain unverified.

## Repository and scope

- Repository: `/Users/carlosdominguez/Developer/cascadia-99`.
- Initial checkout was clean `main` at `1b97587`, containing the older Cascadia implementation.
- Created `feature/phase-1-verification` from existing `origin/feature/external-music-only` at `bec9edc`. That descendant already contains VEXELON, Neo-Vector, Kode Mono, four Flux abilities, controller support and the retired generated soundtrack. Existing branches and `main` were preserved; no merge or historical cherry-pick was performed.
- `0379786` and its historical 63-test report were read as reference only. The current base independently passed **105/105** tests before changes.
- The complete specification supplied in this chat governs this audit. The linked prior chat only returned the earlier description exchange.
- The later reference image informed glow and action styling. Following the user's correction, new portrait/mobile layout and swipe work was removed. Existing responsive behavior remains; no mobile milestone or new onboarding expansion was delivered.

## Requirement-by-requirement status

COMPLETE means the stated scope has direct code/test or observed UI evidence. PARTIAL identifies implemented behavior with an outstanding acceptance check. UNVERIFIED identifies checks not performed. No historical result is treated as a fresh pass.

| # | Requirement | Status | Current evidence and limits |
|---|---|---|---|
| 1 | Core rising-stack gameplay | COMPLETE | Engine tests cover legal horizontal swaps, horizontal/vertical 3+ matches without duplicate cells, simultaneous combos, falling chains, gravity, rising rows, manual raising, slab coordinates and elimination. Both clients use this authoritative Node engine. Added a ceiling regression for natural/manual rise at its limit. |
| 2 | Glitch system | COMPLETE for authority; PARTIAL for presentation | Combo/chain generation, queues, cancellation, placement, connected breaking and gradual conversion pass engine/transport tests. Counter now earns +8 once per qualifying clear. Real native clear/Counter/HUD integration passes. Genuine incoming warnings and 98-board targeting were observed in desktop web; a fresh native graphical comparison remains pending. Internal garbage identifiers remain compatible. |
| 3 | Flux rewards and synchronization | COMPLETE | Existing 3/4/5/6+ rewards 2/4/7/10 and chain bonuses 8/14/22/30 retained. Added Counter 8. Tests cover one-time awards, cap 100, buff generation, insufficient energy, forged client balances, wire alias and real native Flux display. |
| 4 | Four abilities | COMPLETE for authority/native integration; PARTIAL for browser integration | See the ability matrix below. Native actual UI buttons, costs, timers and recovery pass. Current browser keyboard smoke cannot launch through Electron; shared authority tests do not replace that check. |
| 5 | Keyboard/controller controls | PARTIAL | Existing arrows, Space, Shift, X/C/V/B, Q/E and additional target strategy controls retained. Native menu/slider focus and input repeat/arbitration pass synthetic tests; actual START BATTLE, controller A swap, Pause and return pass. Desktop web navigation/Pause was exercised. Full controller-only results/ability traversal and physical devices remain unverified. Text entry still uses a keyboard. |
| 6 | CPU opponents | COMPLETE for shared rules; PARTIAL for long play acceptance | Real CPU matching/movement/scoring, difficulty behavior and legal defensive/offensive ability selection pass tests. Four modes and 98 CPUs plus one human seat pass native protocol/startup checks. CPU uses the same Board, Flux and ability transactions, with no resource grants. A new prolonged interactive CPU soak was not performed. |
| 7 | Neo-Vector Arcade identity | PARTIAL | Existing black/vector geometry, original four silhouettes, official logos and restrained effects retained. Added bounded phosphor halo/core strokes to both renderers with identical shared tokens; mini-boards avoid the extra passes and Minimal quality disables them. Desktop web screenshot was reviewed at 1440×900. Native visual appearance still needs graphical review. |
| 8 | Kode Mono typography | COMPLETE | Automated checks confirm identical local font assets and licenses, shared typography, HTTP route and offline cache. No font CDN added; official logo artwork unchanged. |
| 9 | Compact contextual HUD | PARTIAL | Score/remaining/KOs/time/Flux/availability/target/threat/danger retained. Removed permanent ability key labels in both clients, preserving instructions in Controls. Added Counter and buff-expiration feedback. Desktop duel/BR HUD observed; full native graphical acceptance remains open. |
| 10 | Opponent readability and target bounds | PARTIAL | Existing active/amber target/red attacker/extinguished hierarchy retained. On desktop web, all 98 canvases had exact 1:2 aspect and target selection left every rectangle unchanged. Shared/native renderer hierarchy is present, but native graphical comparison and broad display-size certification were not performed. |
| 11 | Mode-adaptive presentation | PARTIAL | Existing Tutorial, Practice, Duel, 4P, Teams and BR layouts preserved. Native four-mode protocol and actual 99-seat startup pass; web duel and 99-seat BR launches observed. Fresh complete graphical checks across both clients/modes remain open. |
| 12 | Direct web homepage | COMPLETE for inspected desktop flow | Two-zone identity/setup, Tutorial/Practice/Settings, direct name/mode/CPU/difficulty/rules/Play and Create/Join remain available. Desktop Play launched duel and 99-seat BR. No showcase or second toolbar restored. Primary action gained restrained cyan styling. |
| 13 | Single theme and accessibility | COMPLETE for code/settings tests | No alternate palette or light-mode selector restored. Existing motion/flash/quality settings retained. Native effects/settings and shared-token tests pass; new tile halos are suppressed at Minimal quality. |
| 14 | SFX-only audio | PARTIAL | Empty manifest and external-import infrastructure retained; no music generated or supplied. Native empty/missing library, all SFX events, independent mute, voice cap and buses pass. Native generated-mix capture peak 0.69852, RMS 0.11865, music players 0, starts 0. Web DSP/cache/migration tests pass, but current Electron audio graph/UI check and human listening were not performed successfully. |
| 15 | Web/Godot parity | COMPLETE for shared competitive authority; PARTIAL overall | Both clients use the same Node Board/CPU/Flux/ability rules; real native/browser-protocol cross-play passes. Costs/timers/Counter and recovery verified in native integration. Rendering/input/audio differences require graphical/browser completion; native offline standalone simulation/export is not claimed. |
| 16 | Automated/regression tests | PARTIAL | Final JavaScript suite **110 passed, 0 failed, 0 skipped**. Native import, protocol/cross-play, ability/recovery, Counter, startup, outdated-server guard, controller menus, input router and SFX/mix checks pass. Electron and directly spawned graphical apps abort in this execution environment; see test table. |
| 17 | Completion report and commits | COMPLETE for reporting; Phase 1 remains PARTIAL | This report identifies present features, implementation, defects, test evidence and unresolved checks. Implementation/report commits are listed in Git history; existing branches are retained. |
| 18 | Future-phase exclusions | COMPLETE | No Reversal, expanded counterplay, chain personalities, Last Stand, Hot Tile, Rival/Bounty, new BR phases or Flux Relay added. Existing onboarding/practice preserved without expansion. New mobile/portrait work removed following the user's instruction. |

## Ability matrix and preserved edge rules

| Ability | Verified rules | Evidence |
|---|---|---|
| Pulse | X; 35 Flux; cancels up to six queued cells; self first, otherwise living teammate; no charge on empty queue; no unrelated queue changes | Unit, real WebSocket and native UI/button checks |
| Shift | C; 60 Flux; stable idle board only; removes bottom row and translates surviving cells/slabs; crops/deletes bottom slabs; resets rise/danger/cursor consistently; no immediate score/Flux/attack/chain reward | Unit cases for slab sizes and unsafe clear/fall/grace/break states; native board check |
| Surge | V; 75 Flux; 8 seconds; attack ×1.35, generation ×1.20; expires during clears; excludes Overdrive | Unit, four-mode WebSocket and native timer/recovery checks |
| Overdrive | B; continuous full meter for 3 seconds, then activation intent; consumes 100; 10 seconds; attack ×1.50, generation ×1.25, natural rise ×1.15; additional .12s chain grace; manual raise unchanged | Unit hold/reset/expiry/stack exclusion/modifier tests and native UI/button check |

The established Overdrive rule is holding **full Flux**, not holding the B key. No new key-hold mechanic was substituted. Shift preserves the verified translation semantics; it does not introduce new automatic clear rewards.

Glitch Counter means a resolving combo/chain attack offsets at least one incoming cell. Award 8 once per resolving clear, including partial counters and cancellation across multiple packets. Generation buffs apply to that reward and the cap remains 100. Pulse is paid defense and does not refund its cost or generate the Counter bonus. Raw queue operations also do not grant rewards.

## Present, implemented and fixed

Already present on the selected newer base: core engine, Glitch slabs/conversion, four Flux abilities, shared balancing, CPU difficulties, four online modes, targeting, controller arbitration, native menus, Neo-Vector UI, Kode Mono, accessibility, training and SFX-only/external music infrastructure. These were reused rather than rewritten or restored from the old Flux commit.

Implemented missing Counter reward and feedback in both clients, with unit, forged-input/real-WebSocket and native integration regressions. Added short buff-expiration feedback and removed permanent ability key labels from the HUD. Added desktop neon styling and matching bounded tile phosphor rendering without changing silhouettes or logo art.

Fixed ceiling danger advancing twice in one tick when rise was saturated; this restores the established two-second limit rather than changing balance.

Fixed the reported local Godot startup mismatch: the running server on port 3000 was the older implementation (hello contained neither Flux config nor recovery token). The current server is running on **127.0.0.1:3080**, and the user's native settings were backed up and updated to that address. The old process was not terminated because shell escalation was rejected. It remains incompatible; it is not the active verification backend.

Added `hello.startProtocol = 1` to the current server. Native and web now reject incompatible greetings before creating rooms, with an actionable update message. Native tests reproduce both the old-server rejection and the actual START BATTLE → populated arena path. This preserves existing fields and the authoritative countdown protocol; no fallback client simulation was added.

Settings backup: `~/Library/Application Support/Godot/app_userdata/VEXELON 99/settings.cfg.phase1-backup`. No game records, audio settings or unrelated preferences were discarded. The server on 3080 is a local development process, not a deployment.

## Fresh test results

Runtime: Apple Silicon macOS, bundled Node v24.19.0, Godot 4.7.2. Node/npm were not on the shell PATH; the bundled Node executable was used. Electron 44.5.1 was installed for checks, but aborts even for `--version` in this environment. Existing package version pins were retained.

| Check | Result |
|---|---|
| Base `node --test` | PASS: 105/105 before changes |
| Final `node --test` | PASS: 110/110; zero failures/skips |
| Native editor import | PASS: successful import, no script errors |
| `node scripts/godot-smoke.mjs` | PASS: duel, quad, teams, 99 seats, input/swap/target/raise/leave, browser-host/native cross-play |
| `node scripts/phase1-smoke.mjs --native-only` | PASS: actual native buttons, four costs, Shift, timers, effects preferences, automatic recovery |
| `node scripts/phase1-counter-smoke.mjs` | PASS: native five-tile clear, four cells countered, +8 reward, total Flux 15, HUD/feedback |
| Native `startup_smoke.gd` against 3080 | PASS: actual START BATTLE UI, 99 seats, populated board, synthetic controller A swap, Pause, return |
| Native `startup_smoke.gd --expect-outdated` against old 3000 | PASS: incompatible greeting rejected before lobby; START BATTLE explains the problem |
| Native `controller_navigation_smoke.gd` | PASS: setup/join/tutorial/practice/settings focus containment and volume slider |
| Native `input_router_smoke.gd` | PASS: dead zone, dominant axis and time-based repeat |
| Native `audio_smoke.gd` | PASS: empty/missing music library, SFX, independent mute, voice cap, buses, shutdown |
| Native `audio_mix_smoke.gd` | PASS: generated mix peak 0.69852; no music players/starts; this is not a physical output/listening test |
| Combined `node scripts/phase1-smoke.mjs` | INCOMPLETE: native portion passed; Electron terminated SIGABRT before browser checks |
| Full Electron web/UI/opponent/audio suite | UNVERIFIED: runner cannot launch; not counted as product passes |
| Directly spawned graphical Godot/Chrome | BLOCKED by environment/app startup; not counted as visual passes |
| Connected in-app browser desktop checks | PASS for observed subset: 1440×900 duel/99-seat BR starts, Pause/leave, no horizontal overflow, 734px duel board height, 98 boards at 1:2 with no target reflow; screenshot visually reviewed |
| `git diff --check` | PASS |

Ignored raw logs are in `.web-smoke/phase1-audit/`. Existing failed/intermediate attempts were repaired and rerun; the browser launch limitation remains open.

Reproduce native checks with Node/Godot on PATH. Start the current server using `PORT=3080 HOST=127.0.0.1 node server.mjs`, then run `godot --headless --path godot --script res://tests/startup_smoke.gd -- --server http://127.0.0.1:3080`. Counter/ability/protocol runners create isolated temporary servers; they do not seed resources in the public game.

## Remaining acceptance work

1. Run the full current browser keyboard/ability, UI, opponent and audio suites where Electron launches. The connected-browser checks above cover only their stated subset.
2. Review native rendered desktop layouts, glow/effects, all modes and results after relaunching the editor against the updated server. Headless UI state and imported scripts do not prove rendered appearance.
3. Verify complete controller-only ability/target/results traversal and physical controllers; synthetic input is not hardware certification.
4. Perform longer interactive CPU/99-seat performance and latency/packet-loss testing as appropriate. No 99-human Internet scalability claim follows from CPU/protocol tests.
5. Listen to SFX on actual output devices. Generated mix measurements do not establish perceived loudness or speaker/headphone parity.

No missing reward or known failing JavaScript regression remains in the verified scope. These open checks prevent an unconditional Phase 1 completion claim.

## Relevant commits

- Base: `bec9edc` (`feature/external-music-only`).
- Implementation and regressions: `495efdb` — Phase 1 Counter/danger fixes, compatibility guard, native startup checks and desktop vector feedback.
- This report is committed separately immediately afterward; use `git log -2 --oneline feature/phase-1-verification` for both commits.
- Historical reference only: `0379786`; not merged or replayed.
