# Vector impact feedback — 2026-10-08

Added presentation-only feedback to the existing desktop Web/Godot renderers:

- Combo and chain clears spawn segmented expanding vector rings at the actual cleared-cell centroid. Amber identifies combos; green identifies chains. Radius scales with combo/chain intensity and expires after 520 ms. At most four rings survive at once.
- Clear fragments now form fading directional light trails. Trails are suppressed when they intersect occupied cells, preserving tile readability. The existing 160-particle cap remains.
- Gameplay announcements use a short elastic entrance, colored geometric underline and fade-out over 1.1 seconds. At most three messages remain visible, fitted to the board width. Messages no longer disappear when the stack enters the top rows. Selector rendering remains above the effects.
- Reduced Motion and Minimal quality disable new ring/trail motion and callout scaling while retaining the announcement. Web callout glow follows the existing flash/quality setting. No new full-screen flash, music, gameplay timing, scoring or mobile layout changes.
- Offline Web cache version updated so the new renderer is fetched on update.

Verification: 112 JavaScript tests pass, zero failures/skips; targeted vector/retro tests pass. Native real-swap five-tile clear/Counter integration passes after the changes, loading and running the modified native renderers without script errors. Web combo/chain frames were visually reviewed in the in-app browser through a temporary presentation fixture using the actual renderer. That fixture is not a competitive/debug game mode. Native graphical and human motion-quality review remains open; headless integration does not prove rendered appearance.

The previous Phase 1 audit remains historical evidence for its recorded commit; this adds presentation changes only and does not close its remaining acceptance checks.
