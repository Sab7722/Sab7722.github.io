# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Bundles: `index-out-stay.js`, `lunar-game-stay.js`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (audio + readable lighting)

- GitHub: **https://sab7722.github.io/hear.html**
- Console: `LA_BUILD 20260914_HEAR`
- Bundles: `index-out-hear.js`, `lunar-game-hear.js`
- From prime: Optimus E, Scout send, tunnel, MD apron still present.
- Audio: click-unlock now starts the pending bed (title was racing a null AudioContext). EVA bed 0.14 (was 0.02). Hab/work, EVA, rover/explore beds follow hatch/vehicle. Storm on foot. Helmet lamp **unchanged**.
- Lighting: night ambient floor 0.34, hemi 0.42, sun floor 0.28, hab fill 0.2, exposure 1.32. Not the lamp.

Previous play (Optimus): **https://sab7722.github.io/prime.html** `LA_BUILD 20260914_PRIME`.

Helmet lamp still intentionally unfixed.

## Tonight’s diagnosis (audio + dark)

Title `Me(title)` ran before `AudioContext` existed and locked the bed name, so unlock never started music. EVA wind gain was **0.02** (inaudible outside — the main play state). `Ce()` no-op’d if `x` was null and was never retried. Night sun was **0.014** with ambient ~0.16; hab interior fill **0.025** with lights off. SoftGL preview used a bright 0.55 branch so tests hid the darkness.

## Still open

1. Habitat walls / corridors (separate problem — not this pass)
2. Mass driver wait-to-charge on a live 60 fps client
3. Lab 3/3
4. Rim-scar 3/3
5. Helmet lamp (intentionally unfixed)

Older saves (do not overwrite):
- https://sab7722.github.io/prime.html — `LA_BUILD 20260914_PRIME` (Optimus E)
- https://sab7722.github.io/rover.html — `LA_BUILD 20260914_ROVER` (Scout send)
- https://sab7722.github.io/void.html — `LA_BUILD 20260914_VOID` (tunnel)
- https://sab7722.github.io/md.html — `LA_BUILD 20260914_MD`
- https://sab7722.github.io/glaze.html — `LA_BUILD 20260914_GLAZE`
- https://sab7722.github.io/stay.html — `LA_BUILD 20260913_STAY`
- grok.me original: https://reef-brook-charm-cinder.grok.me/

Do not delete this repo. “Save it” means a new unique HTML + isolated JS copies, then push.
