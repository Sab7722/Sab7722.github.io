# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Bundles: `index-out-stay.js`, `lunar-game-stay.js`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (LEMS + hydro view + compass)

- GitHub: **https://sab7722.github.io/lens.html**
- Console: `LA_BUILD 20260914_LENS`
- Bundles: `index-out-lens.js`, `lunar-game-lens.js`
- From hear: audio beds, Optimus E, Scout send, tunnel, MD apron still present.
- LEMS: E at the SE peg (red bead) works 3/3 — hypot before rock-steal, wider look cone, prompt stays after baseline.
- Hydro: first-person body hidden inside so the suit doesn’t fill the plants room. EVA/third-person body unchanged.
- Compass stays top-center; job line drops below the tape. Helmet lamp **unchanged**.

Previous play (audio): **https://sab7722.github.io/hear.html** `LA_BUILD 20260914_HEAR`.

Helmet lamp still intentionally unfixed.

## Tonight’s diagnosis

LEMS look cone was **0.08** (with pickup rocks) and E ran prompt-first, so nearby “Pick up” stole the peg. After `lems-base` the HUD wiped Use LEMS. FP player body stayed visible indoors (`visible=not-vehicle`, `tp` flag unused) and blocked hydro. Job HUD `z-70` at ~5 rem overlapped the unused-`drop` compass at 0.85 rem.

## Still open

1. Habitat walls / corridors
2. Mass driver wait-to-charge on a live 60 fps client
3. Lab 3/3
4. Rim-scar 3/3
5. Helmet lamp (intentionally unfixed)

Older saves (do not overwrite):
- https://sab7722.github.io/hear.html — `LA_BUILD 20260914_HEAR`
- https://sab7722.github.io/prime.html — `LA_BUILD 20260914_PRIME`
- https://sab7722.github.io/rover.html — `LA_BUILD 20260914_ROVER`
- https://sab7722.github.io/void.html — `LA_BUILD 20260914_VOID`
- https://sab7722.github.io/stay.html — `LA_BUILD 20260913_STAY`
- grok.me original: https://reef-brook-charm-cinder.grok.me/

Do not delete this repo. “Save it” means a new unique HTML + isolated JS copies, then push.
