extends SceneTree
const Main=preload("res://scripts/main.gd")
const Network=preload("res://scripts/network.gd")
var game
var failed=false

func _initialize() -> void: call_deferred("run")

func wait_for(predicate: Callable, detail: String) -> void:
	var deadline=Time.get_ticks_msec()+12000
	while not predicate.call() and Time.get_ticks_msec()<deadline: await process_frame
	if not predicate.call(): failed=true;push_error(detail)

func run() -> void:
	assert(not Network.supports_phase1({"type":"hello","id":"old-main"}))
	assert(not Network.supports_phase1({"type":"hello","fluxConfig":{"overdrive":{}}}))
	assert(Network.supports_phase1({"type":"hello","startProtocol":1,"fluxConfig":{"overdrive":{}}}))
	var cfg=ConfigFile.new();cfg.set_value("onboarding","choice","skip");cfg.save("user://startup-qa.cfg")
	game=Main.new();game.settings_path="user://startup-qa.cfg";root.add_child(game)
	if OS.get_cmdline_user_args().has("--expect-outdated"):
		await wait_for(func(): return not game.network.compatibility_error.is_empty(),"Outdated server must fail before room creation")
		assert(game.network.player_id.is_empty());assert(game.screen_id=="title")
		game.show_setup(true);await process_frame
		var blocked=game.modal.find_children("*","Button",true,false).filter(func(b): return b.text=="START BATTLE")
		blocked[0].pressed.emit()
		await wait_for(func(): return game.message_label.text.contains("Outdated game server"),"START BATTLE must explain the incompatible server")
		print("GODOT_OUTDATED_SERVER_OK: incompatible connection rejected before lobby, actionable START BATTLE error")
		game.shutting_down=true;game.audio.shutdown();game.queue_free();await process_frame;await create_timer(.2).timeout;quit(1 if failed else 0);return
	await wait_for(func(): return not game.network.player_id.is_empty(),"Current server handshake")
	if failed: quit(1);return
	game.show_setup(true)
	game.mode_picker.select(0);game.cpu_picker.select(4)
	await process_frame
	var starts=game.modal.find_children("*","Button",true,false).filter(func(b): return b.text=="START BATTLE")
	assert(starts.size()==1);starts[0].pressed.emit()
	await wait_for(func(): return game.screen_id=="arena" and game.snapshot.get("countdown",1)==0,"START BATTLE must reach gameplay, not remain in lobby")
	if failed: quit(1);return
	assert(game.rival_views.size()==98)
	assert(game.own_board.grid.size()==12)
	assert(game.own_board.grid.any(func(row): return row.any(func(v): return v!=0)))
	root.gui_release_focus()
	var event=InputEventJoypadButton.new();event.device=0;event.button_index=JOY_BUTTON_A;event.pressed=true
	Input.parse_input_event(event);await process_frame;event.pressed=false;Input.parse_input_event(event)
	await wait_for(func(): return game.qa_gamepad_swap,"Controller swap must reach the authoritative game")
	if failed: quit(1);return
	game.show_pause();await process_frame;assert(is_instance_valid(game.modal));game.close_modal()
	game.network.send_message({"type":"leave"})
	await wait_for(func(): return game.screen_id=="title","Leave returns to title")
	print("GODOT_STARTUP_OK: outdated-server guard, actual START BATTLE UI, 99 seats, populated board, synthetic controller swap, pause and return")
	game.shutting_down=true;game.audio.shutdown();game.queue_free();await process_frame;await create_timer(.2).timeout;quit(1 if failed else 0)
