# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Bundles: `index-out-stay.js`, `lunar-game-stay.js`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (Start / New Game boot)

- GitHub: **https://sab7722.github.io/boot.html**
- Console: `LA_BUILD 20260915_BOOT`
- Bundles: `index-out-boot.js`, `lunar-game-boot.js` (matched pair, one React, one THREE)
- Stay freeze imported `index-out-bag.js` while the page loaded `index-out-stay.js` — two Reacts, `useCallback` of null, Start soft-lock.
- Boot is a unique copy of the void pair with the same stamp and **no `?v=` on ESM modules** (query on the entry script was a second React vs the bare `from"./index-out-*.js"` import). Unique filenames cache-bust. No bag leftovers.
- Start / New Game enter play. Walls, MD, tunnel, mill, eat, audio, helmet untouched.
- stay.html **untouched**.

Previous play: **https://sab7722.github.io/void.html** `LA_BUILD 20260914_VOID`.

Helmet lamp still intentionally unfixed.

## Tonight’s diagnosis

`lunar-game-stay.js` is a byte copy of `lunar-game-bag.js` and still `import`s `./index-out-bag.js`. stay.html also loads `index-out-stay.js`. Two vendor graphs = two Reacts. Cache-bust `?v=` on the module script made the same split even on later matched filenames.

## Still open

1. Habitat walls / corridors
2. Mass driver wait-to-charge on a live 60 fps client
3. Lab 3/3
4. Rim-scar 3/3 (directions clearer; find still hardware-vs-rock)
5. Helmet lamp (intentionally unfixed)

Older saves (do not overwrite):
- https://sab7722.github.io/void.html — `LA_BUILD 20260914_VOID`
- https://sab7722.github.io/guide.html — `LA_BUILD 20260914_GUIDE`
- https://sab7722.github.io/hint.html — `LA_BUILD 20260914_HINT`
- https://sab7722.github.io/intro.html — `LA_BUILD 20260914_INTRO`
- https://sab7722.github.io/ride.html — `LA_BUILD 20260914_RIDE`
- https://sab7722.github.io/lens.html — `LA_BUILD 20260914_LENS`
- https://sab7722.github.io/hear.html — `LA_BUILD 20260914_HEAR`
- https://sab7722.github.io/prime.html — `LA_BUILD 20260914_PRIME`
- https://sab7722.github.io/stay.html — `LA_BUILD 20260913_STAY`
- grok.me original: https://reef-brook-charm-cinder.grok.me/

Do not delete this repo. “Save it” means a new unique HTML + isolated JS copies, then push.
