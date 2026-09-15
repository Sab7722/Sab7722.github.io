# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (one soft WebGL create)

- GitHub: **https://sab7722.github.io/lite.html**
- Console: `LA_BUILD 20260915_LITE`
- Bundles: `index-out-lite.js` ↔ `lunar-game-lite.js`
- First (and only) WebGL create is soft: dpr=1, no AA, no shadows, `powerPreference:default`. Context-lost: preventDefault, dispose, remount once — never loop. Sticky `#app` setSize kept. stay untouched.
