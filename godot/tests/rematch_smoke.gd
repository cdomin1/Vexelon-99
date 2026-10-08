extends SceneTree
const Main=preload("res://scripts/main.gd")
var game
var failed=false
var starts: Array=[]
func _initialize() -> void: call_deferred("run")
func wait_for(predicate: Callable, detail: String) -> void:
	var deadline=Time.get_ticks_msec()+14000
	while not predicate.call() and Time.get_ticks_msec()<deadline: await process_frame
	if not predicate.call(): failed=true;push_error(detail)
func run() -> void:
	game=Main.new();game.settings_path="user://rematch-qa.cfg";root.add_child(game)
	game.network.received.connect(func(m):
		if m.get("type")=="start": starts.append(m))
	await wait_for(func(): return not game.network.player_id.is_empty(),"Handshake")
	if failed: quit(1);return
	game.network.send_message({"type":"create","mode":"battle","bots":1,"difficulty":"easy","ruleset":"classic","quick":true})
	for round_number in range(3):
		await wait_for(func(): return starts.size()==round_number+1 and game.screen_id=="arena" and game.snapshot.get("countdown",1)==0,"Rematch must reach active arena")
		if failed: quit(1);return
		assert(game.own_board.grid.size()==12);assert(game.rival_views.size()==1)
		assert(starts[round_number].mode=="battle");assert(starts[round_number].bots==1)
		if round_number>0: assert(starts[round_number].matchId!=starts[round_number-1].matchId)
		await wait_for(func(): return game.finished and is_instance_valid(game.modal),"Authoritative fixture must finish")
		if failed: quit(1);return
		if round_number<2:
			var buttons=game.modal.find_children("*","Button",true,false).filter(func(b): return b.text=="REMATCH")
			assert(buttons.size()==1);buttons[0].pressed.emit()
	game.network.send_message({"type":"leave"})
	await wait_for(func(): return game.screen_id=="title","Leave after repeated rematches")
	print("GODOT_REMATCH_OK: actual results REMATCH button twice, fresh match IDs, synchronized countdown, populated boards, CPU preserved, return to title")
	game.shutting_down=true;game.audio.shutdown();game.queue_free();await process_frame;await create_timer(.2).timeout;quit(1 if failed else 0)
