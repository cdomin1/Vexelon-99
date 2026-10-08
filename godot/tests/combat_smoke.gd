extends SceneTree
const Main = preload("res://scripts/main.gd")
var game
var messages: Array = []
var failed=false
func _initialize() -> void: call_deferred("run")
func wait_for(kind: String, predicate: Callable=Callable()) -> Dictionary:
 var deadline=Time.get_ticks_msec()+7000
 while Time.get_ticks_msec()<deadline:
  for i in range(messages.size()):
   var m=messages[i]
   if m.get("type")==kind and (not predicate.is_valid() or predicate.call(m)):
    messages.remove_at(i)
    return m
  await process_frame
 failed=true;push_error("Phase 2 timed out: "+kind);quit(1);return {}
func swap() -> void:
 var event=InputEventKey.new();event.physical_keycode=KEY_SPACE;event.pressed=true
 game._input(event)
func run() -> void:
 game=Main.new();game.settings_path="user://combat-qa.cfg";root.add_child(game)
 game.network.received.connect(func(m): messages.append(m))
 await wait_for("hello")
 if failed: return
 for lesson in [7,8,9]:
  messages.clear()
  game.network.send_message({"type":"trainingStart","mode":"tutorial","lesson":lesson})
  await wait_for("trainingStatus",func(m): return m.lesson==lesson and not m.done)
  await wait_for("state")
  if failed: return
  game.close_modal()
  if lesson<9:
   assert(game.snapshot.self.incoming.size()==1)
   game.show_incoming_queue();await process_frame
   assert(is_instance_valid(game.modal));game.close_modal()
  swap()
  if lesson==7:
   await wait_for("counter")
   await wait_for("state",func(m): return m.self.incoming.size()==1 and m.self.incoming[0].amount==3)
   if failed: return
   swap()
  if lesson==8:
   var reversal=await wait_for("reversal")
   if failed: return
   assert(reversal.amount==3)
   assert(game.own_board.effects.any(func(e): return e.text.contains("REVERSAL")))
  if lesson==9:
   var cascade=await wait_for("cascade")
   if failed: return
   assert(cascade.chain==3)
   assert(game.own_board.effects.any(func(e): return e.text.contains("CASCADE")))
  await wait_for("trainingStatus",func(m): return m.lesson==lesson and m.done)
  if failed: return
  await process_frame
  assert(game.tutorial_next.visible==(lesson<9))
 print("GODOT_COMBAT_OK: authoritative lessons 8–10, keyboard swaps, FIFO partial counter, Reversal, Cascade, queue modal and final navigation")
 game.shutting_down=true;game.audio.shutdown();game.queue_free();await process_frame;await create_timer(.2).timeout;quit(0)
