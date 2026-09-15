# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Bundles: `index-out-stay.js`, `lunar-game-stay.js`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (New Game intro)

- GitHub: **https://sab7722.github.io/intro.html**
- Console: `LA_BUILD 20260914_INTRO`
- Bundles: `index-out-intro.js`, `lunar-game-intro.js`, `lunar-boot-intro.js`
- New Game plays the cine every fresh start. Continue/Load still skips. Escape skip still works.
- From ride: LTV look, Earth sky, LEMS, hydro view, compass, audio, Optimus, Scout, tunnel, MD still present.
- Helmet lamp **unchanged**. stay.html **untouched**.

Previous play: **https://sab7722.github.io/ride.html** `LA_BUILD 20260914_RIDE`.

Helmet lamp still intentionally unfixed.

## Tonight’s diagnosis

LTV look yaw was glued to hull (`p += e.yaw-hy0`), so steer ate sideways look; `getYaw()` even reported hull yaw. Earth lived at 920 m with 37° elevation — walking gave parallax, so it read as a ball over the ground.

## Still open

1. Habitat walls / corridors
2. Mass driver wait-to-charge on a live 60 fps client
3. Lab 3/3
4. Rim-scar 3/3
5. Helmet lamp (intentionally unfixed)

Older saves (do not overwrite):
- https://sab7722.github.io/lens.html — `LA_BUILD 20260914_LENS`
- https://sab7722.github.io/hear.html — `LA_BUILD 20260914_HEAR`
- https://sab7722.github.io/prime.html — `LA_BUILD 20260914_PRIME`
- https://sab7722.github.io/stay.html — `LA_BUILD 20260913_STAY`
- grok.me original: https://reef-brook-charm-cinder.grok.me/

Do not delete this repo. “Save it” means a new unique HTML + isolated JS copies, then push.
