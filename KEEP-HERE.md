# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Bundles: `index-out-stay.js`, `lunar-game-stay.js`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (ScoutBot send + readable rover)

- GitHub: **https://sab7722.github.io/rover.html**
- Console: `LA_BUILD 20260914_ROVER`
- Bundles: `index-out-rover.js`, `lunar-game-rover.js`
- From void: tunnel mouth/roof/alcove bag and MD apron sat-load still present.
- Scout only: E at the dock sends to mill (no Chart dest required). HUD `Send scout to mill`. Optional Chart in pause (M) still picks another mark. Rover visual: chassis, solar wing, dish, mast cam, 6 wheels. Same invisible hitbox `1.2×1.35×1.25`.

Previous play (tunnel): **https://sab7722.github.io/void.html** `LA_BUILD 20260914_VOID`.

Helmet lamp still intentionally unfixed.

## Tonight’s diagnosis (ScoutBot)

Stay: looking at Scout showed **Read scout log**. E without a Chart dest did **not** send — job `Open the Map. Tap a place…`. Chart lives in pause (M), so the advertised Map step was buried. Model was a low silver crate on 4 wheels.

Fix: `sendScoutFromAct` defaults to mill; CI `use`/`send` labels `Send scout to mill` / `Send scout`; `bM()` visual only.

## Still open

1. Habitat walls / corridors (separate problem — not this pass)
2. Mass driver wait-to-charge on a live 60 fps client (headless rAF is starved; charge code unchanged)
3. Lab 3/3
4. Rim-scar 3/3
5. Optimus voice
6. General audio
7. Helmet lamp (intentionally unfixed)

Older saves (do not overwrite):
- https://sab7722.github.io/void.html — `LA_BUILD 20260914_VOID` (tunnel enter/exit)
- https://sab7722.github.io/md.html — `LA_BUILD 20260914_MD` (MD apron sat load)
- https://sab7722.github.io/glaze.html — `LA_BUILD 20260914_GLAZE` (mill-pad ghosts)
- https://sab7722.github.io/solid.html — `LA_BUILD 20260914_SOLID` (solar/prop colliders)
- https://sab7722.github.io/bag.html — `LA_BUILD 20260913_BAG` (same game as STAY)
- https://sab7722.github.io/mouth.html — `LA_BUILD 20260912_WIRE`
- https://sab7722.github.io/eve.html — `LA_BUILD 20260911_EVE`
- https://sab7722.github.io/jump.html — `LA_BUILD 20260911_JUMP`
- https://sab7722.github.io/sleeper.html — `LA_BUILD 20260911_SLEEPER`
- https://sab7722.github.io/keep.html — `LA_BUILD 20260907_KEEP`
- https://sab7722.github.io/saved.html — `LA_BUILD 20260906_SAVED`
- grok.me original: https://reef-brook-charm-cinder.grok.me/

Do not delete this repo. “Save it” means a new unique HTML + isolated JS copies, then push.
