# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Bundles: `index-out-stay.js`, `lunar-game-stay.js`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (Rook next-step hints)

- GitHub: **https://sab7722.github.io/hint.html**
- Console: `LA_BUILD 20260914_HINT`
- Bundles: `index-out-hint.js`, `lunar-game-hint.js`, `lunar-boot-hint.js`, `lunar-talk-hint.js`
- E on Rook (and “what next / stuck”) uses progress-aware `rookHint` so stuck states get a clear next step. Story lines in `Ji` are not rewritten.
- From intro: New Game cine, LTV look, Earth sky, LEMS, hydro view, compass, audio, Optimus, Scout, tunnel, MD still present.
- Helmet lamp **unchanged**. stay.html **untouched**.

Previous play: **https://sab7722.github.io/intro.html** `LA_BUILD 20260914_INTRO`.

Helmet lamp still intentionally unfixed.

## Tonight’s diagnosis

E-talk used `Ji(found, solar, outside)` — flavor keyed off `found`, so the same sentence looped. Progress-aware `rookHint(state, "stuck")` already existed but never ran on E, and `lunar-talk.js` intercepted typed “what next” before `Cu`.

## Still open

1. Habitat walls / corridors
2. Mass driver wait-to-charge on a live 60 fps client
3. Lab 3/3
4. Rim-scar 3/3
5. Helmet lamp (intentionally unfixed)

Older saves (do not overwrite):
- https://sab7722.github.io/intro.html — `LA_BUILD 20260914_INTRO`
- https://sab7722.github.io/ride.html — `LA_BUILD 20260914_RIDE`
- https://sab7722.github.io/lens.html — `LA_BUILD 20260914_LENS`
- https://sab7722.github.io/hear.html — `LA_BUILD 20260914_HEAR`
- https://sab7722.github.io/prime.html — `LA_BUILD 20260914_PRIME`
- https://sab7722.github.io/stay.html — `LA_BUILD 20260913_STAY`
- grok.me original: https://reef-brook-charm-cinder.grok.me/

Do not delete this repo. “Save it” means a new unique HTML + isolated JS copies, then push.
