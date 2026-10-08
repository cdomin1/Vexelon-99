extends SceneTree
const Main = preload("res://scripts/main.gd")
var game
var messages: Array = []
var failed=false

func _initialize() -> void:
	call_deferred("run")

func wait_for(kind: String, predicate: Callable=Callable()) -> Dictionary:
	var deadline=Time.get_ticks_msec()+10000
	while Time.get_ticks_msec()<deadline:
		for i in range(messages.size()):
			var m=messages[i]
			if m.get("type")==kind and (not predicate.is_valid() or predicate.call(m)):
				messages.remove_at(i)
				return m
		await process_frame
	failed=true;push_error("Counter timed out: "+kind);quit(1);return {}

func run() -> void:
	game=Main.new();game.settings_path="user://counter-qa.cfg";root.add_child(game)
	game.network.received.connect(func(m): messages.append(m))
	await wait_for("hello")
	if failed: return
	game.network.send_message({"type":"create","mode":"duel","bots":1,"quick":true})
	await wait_for("start")
	await wait_for("state",func(s): return s.countdown==0)
	if failed: return
	for i in range(2): game.network.send_message({"type":"move","dx":0,"dy":1})
	game.network.send_message({"type":"swap"})
	var counter=await wait_for("counter")
	if failed: return
	var shown=game.own_board.effects.any(func(e): return e.text.contains("GLITCH COUNTER!"))
	var state=await wait_for("state",func(s): return s.self.flux==15)
	if failed: return
	var meter_deadline=Time.get_ticks_msec()+500
	while game.flux_meter.value!=15 and Time.get_ticks_msec()<meter_deadline: await process_frame
	if counter.reward!=8 or counter.cancelled!=4 or state.self.score!=50 or not shown or game.flux_meter.value!=15:
		push_error("Native counter reward/feedback mismatch: %s / score %s / shown %s / meter %s" % [counter,state.self.score,shown,game.flux_meter.value]);quit(1);return
	print("GODOT_COUNTER_OK: real native swap, authoritative five-tile clear, +8 Counter, Flux 15, HUD and feedback")
	game.audio.shutdown();game.queue_free();await process_frame;await create_timer(.2).timeout;quit(0)
