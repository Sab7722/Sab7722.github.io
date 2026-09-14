# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Bundles: `index-out-stay.js`, `lunar-game-stay.js`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (mill approach + E inspect)

- GitHub: **https://sab7722.github.io/glaze.html**
- Console: `LA_BUILD 20260914_GLAZE`
- Bundles: `index-out-glaze.js`, `lunar-game-glaze.js`
- `footBlock` only: removed 8 meshless mill-pad ghost circles that blocked mill approach. Mill body, kiln, hopper E, solar solids, habBlock untouched.

Previous play (pad collider): **https://sab7722.github.io/solid.html** `LA_BUILD 20260914_SOLID`.

Helmet lamp still intentionally unfixed.

## Tonight’s diagnosis (Mass Driver charge)

Charging **works**. It is passive proximity, not an E button.

- Variable: `mdCharge`
- Tick: `FI()` useFrame: within 7 m of `wI = (-18, 16)` → `mdCharge += min(dt, 0.05) * 0.22`
- Launch refuse: `launchMd()` if `mdCharge < 0.35` → `rails undercharged — stay at the driver`
- “Charge the rails” is the **undercharged fire label**. Pressing E launches (and fails). Stand still until it becomes `Launch — may fall short`.
- Live stand-still at the cab reached **0.354** with no injected charge (~67 s headless; ~2 s at 60 fps).

## Still open

1. Habitat walls / corridors (separate problem — not this pass)
2. Sample bag live 3/3 (code already in STAY; T4 + T32 confirmed; need one more valid run)
3. Mass driver end-to-end (wait in cab, do not E on “Charge the rails”)
4. ScoutBot Test 3
5. Lab 3/3
6. Rim-scar 3/3
7. Optimus voice
8. General audio
9. Helmet lamp (intentionally unfixed)

Older saves (do not overwrite):
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
