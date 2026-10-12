6ixPlanet basement: texturing kit
================================

basement_room.blend   Open it in Blender (scene "6ixPlanet Basement"). It holds the 12x12-tile room: Floor, WallRight, WallLeft,
                      the game camera (orthographic, 2:1 isometric, exactly the game's angle) and a Guides collection (wire boxes
                      for the bed, the bag of clothes and the door; they never render).
                      The surfaces use flat "emission" materials, so colours show exactly as painted, with no lighting.
                      Each surface has its own full-picture UV (0..1), so you can paint in 3D (Texture Paint) or open
                      the PNGs below in any 2D painting program.

Images (128 pixels per tile):
  floor_paint.png       1536 x 1536   blank grey canvas = what you paint on (also packed into the .blend)
  wall_right_paint.png  1536 x  392   the wall on the right, with the door
  wall_left_paint.png   1536 x  392   the wall on the left
  *_template.png        the same sizes with a tile grid and coloured guides. Look only; do not send these back.
  game_view_preview.png what the game camera sees (grid templates applied)

How the pictures sit on the room
  floor      top-left of the picture = the back corner (where the two walls meet). Left edge runs along the left wall,
             top edge runs along the right wall. Picture is shown rotated 45 degrees and squashed, like the game.
             Blue strip = left wall side, orange strip = right wall side.
  right wall left edge = the back corner (red), right edge = the right-hand corner (orange).
             The door is on tile 2 from the left: x 128..256 px, from the bottom up to about 256 px (green).
  left wall  left edge = the left-hand corner (blue), right edge = the back corner (red).
  Things standing in the room are drawn on top and not part of these pictures: the door itself, bed (blue box on the floor,
  3 tiles along the right wall from tile 4), bag of clothes (orange, tile 8), the avatars. The game's dark flickering light is also
  laid over the top, so don't paint a spotlight or shadows you want to stay fixed.

Sending it back
  Save each painted image as PNG with the SAME size and the SAME name: floor_paint.png, wall_right_paint.png, wall_left_paint.png
  (or just send the .blend / tell me where they are). Keep the files small (under about 1.5 MB each if you can).
  If you paint in 3D in Blender: Image > Save All Images, or bake to these images.
