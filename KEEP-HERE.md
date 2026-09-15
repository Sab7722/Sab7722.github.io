# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (sticky canvas after Start/Continue)

- GitHub: **https://sab7722.github.io/stick.html**
- Console: `LA_BUILD 20260915_STICK`
- Bundles: `index-out-stick.js` ↔ `lunar-game-stick.js`
- After play/intro, sticky `#app` `setSize` (~36 rAF) so R3F size-store cannot snap the buffer back to 300×150. Skip `setSize` w/h < 2. Title `#app-first` kept. stay untouched.
