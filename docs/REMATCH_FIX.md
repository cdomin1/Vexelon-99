# Rematch repair — 2026-10-08

The results REMATCH buttons sent a lobby-only request, so the match ended at the room screen and required a second START action. Web and Godot now request `rematch` with `quick: true`; the authoritative server reuses the existing room setup and invokes its normal fresh-board/synchronized-start path. Legacy lobby-only requests remain compatible; host/state/start validation remains in place.

Verified 114/114 JavaScript tests, including two consecutive quick rematches with new IDs, reset resources and preserved room/CPU/difficulty/rules. Native headless integration presses the actual results REMATCH button twice, reaches populated active arenas with new match IDs and a CPU, then leaves to title. Native import passes. Run `npm run smoke:rematch` with Godot on PATH. Native graphical verification remains open.

The local current server at 127.0.0.1:3080 was restarted with this fix. GitHub push and Render deployment are explicitly deferred by the user. The repository Render blueprint disables automatic deployment; live dashboard settings were not inspected. Fresh HTTP requests to local ports 3000/3079/3080 served the same current app.mjs at inspection, even though port 3000 retains an older in-memory server protocol. The hosted Web build does not contain these unpushed commits; do not treat it as the current checkout.
