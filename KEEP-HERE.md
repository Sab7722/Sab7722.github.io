# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Bundles: `index-out-stay.js`, `lunar-game-stay.js`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (mass-driver sat load + second fire)

- GitHub: **https://sab7722.github.io/md.html**
- Console: `LA_BUILD 20260914_MD`
- Bundles: `index-out-md.js`, `lunar-game-md.js`
- From glaze: mill-pad ghosts still gone.
- `se()` only, plus `oe()` sat-hide while holding sat/slug or `mdLoaded`: sat crates on the breech apron no longer steal E. Load on apron ~2–4 m from Qn=(-18,16). After launch, pick up another sat → load → wait (do not E “Charge the rails”) → fire again. Abort bead still unloads. Cab carve, charge threshold 0.35, `launchMd` reset, mill/kiln/solar untouched.

Previous play (mill approach): **https://sab7722.github.io/glaze.html** `LA_BUILD 20260914_GLAZE`.

Helmet lamp still intentionally unfixed.

## Tonight’s diagnosis (Mass Driver load + second fire)

Not a `launchMd` reset bug. `launchMd` already sets `fireTick++`, `mdLoaded=false`, `mdCharge=0`.

Load fail + “second fire does nothing” were the same steal: sat crates at ~1.3 m from the apron stand win `oe()` (cone 0.08, hypot −2.1) so E re-picks a sat. Holding sat then E on fire **re-loads** instead of launching.

Fix: on the apron (`hypot(Qn)<6`), E loads if holding sat/slug and fires if `mdLoaded`; sat/slug targets are hidden in `oe()` while holding or loaded. Charge is still passive 7 m. Do not E “Charge the rails”.

## Still open

1. Habitat walls / corridors (separate problem — not this pass)
2. Sample bag live 3/3 (code already in STAY; T4 + T32 confirmed; need one more valid run)
3. Mass driver wait-to-charge on a live 60 fps client (headless rAF is starved; charge code unchanged)
4. ScoutBot Test 3
5. Lab 3/3
6. Rim-scar 3/3
7. Optimus voice
8. General audio
9. Helmet lamp (intentionally unfixed)

Older saves (do not overwrite):
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
