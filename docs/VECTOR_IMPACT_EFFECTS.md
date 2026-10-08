# Vector impact feedback — 2026-10-08

Added presentation-only feedback to the existing desktop Web/Godot renderers:

- Combo and chain clears spawn segmented expanding vector rings at the actual cleared-cell centroid. Amber identifies combos; green identifies chains. Radius scales with combo/chain intensity and expires after 520 ms. At most four rings survive at once.
- Clear fragments now form fading directional light trails. Trails are suppressed when they intersect occupied cells, preserving tile readability. The existing 160-particle cap remains.
- Gameplay announcements use a short elastic entrance, colored geometric underline and fade-out over 1.1 seconds. At most three messages remain visible, fitted to the board width. Messages no longer disappear when the stack enters the top rows. Selector rendering remains above the effects.
- Reduced Motion and Minimal quality disable new ring/trail motion and callout scaling while retaining the announcement. Web callout glow follows the existing flash/quality setting. No new full-screen flash, music, gameplay timing, scoring or mobile layout changes.
- Offline Web cache version updated so the new renderer is fetched on update.

Verification: 112 JavaScript tests pass, zero failures/skips; targeted vector/retro tests pass. Native real-swap five-tile clear/Counter integration passes after the changes, loading and running the modified native renderers without script errors. Web combo/chain frames were visually reviewed in the in-app browser through a temporary presentation fixture using the actual renderer. That fixture is not a competitive/debug game mode. Native graphical and human motion-quality review remains open; headless integration does not prove rendered appearance.

The previous Phase 1 audit remains historical evidence for its recorded commit; this adds presentation changes only and does not close its remaining acceptance checks.

## Stronger neon pass

After feedback that the first pass still looked flat, strengthened the shared phosphor profile to four halo layers and a brighter white core. Web additionally uses a bounded Canvas shadow bloom. Native uses the same layered stroke profile. Full-flash combo/chain impacts now include three-layer cross flares; Reduced Flash retains rings without the cross flare. Callout entrances have a stronger elastic overshoot and Web text bloom. Original tile silhouettes and gameplay remain unchanged.

The temporary preview at port 3082 now loops the actual renderer instead of displaying a frozen frame. Verification: full suite 112/112 after rendering changes, then the additional flare accessibility regression passes (three impact tests total); native clear/Counter integration passes. Web bloom visually reviewed. Native graphical review remains open.

## Native GPU bloom and impact choreography

Added `godot/shaders/vector_bloom.gdshader`: a board-texture bloom compositor using three radii and eight directions (24 bounded samples per player-board fragment). It works with the existing Compatibility renderer, samples only the board SubViewport, and excludes miniature boards and Minimal quality. Reduced quality lowers bloom strength; Reduced Motion/Flash disables the impact bloom boost. This is a different native rendering path from Web Canvas shadow bloom, with consistent gameplay events rather than identical APIs.

Both clients now render rotating vector shards, a short cross flare reaching outward from the actual clear, and rising score text for combo/chain impacts using the established `count × 10 × chain` award. Strong chains use red impact emphasis. Swaps and falls interpolate continuously over their existing durations instead of quantizing to a few visual steps. Gameplay simulation, input authority and timings remain unchanged. The selector is still drawn last.

Fresh verification: 114/114 JavaScript tests pass, zero failures/skips. Native real-swap/clear/Counter integration passes with no shader/script errors after fixing shader built-in scoping. Headless shader parsing is not GPU performance or visual certification. Attempts to launch through the already-open editor produced no running preview; native graphical appearance and measured GPU frame times remain UNVERIFIED. No integrated-GPU performance claim is made from these checks. The looped Web comparison preview was refreshed to the current renderer. GitHub push/Render deployment remain deferred.

## Breathing halo / clarity correction

Reduced the constant phosphor spread, opacity and white core that made the shapes look muddy. Stable colored outlines now stay crisp while the halo breathes on a shared 2.8-second cosine envelope. Web blur applies only to halo passes, not to the core strokes. Native idle GPU bloom is substantially lower; the existing event-driven impact boost remains separate. Reduced Motion/Reduced Flash use the low, steady halo; mini-boards and Minimal quality retain their cheaper rendering paths.

Native real-clear/Counter integration passes without shader errors. The Web preview was refreshed and visually checked for sharper outlines. Native final appearance still requires an on-screen review after relaunch; headless verification alone cannot establish it.
