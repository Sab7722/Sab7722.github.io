# Lunar Ascent — KEEP HERE

Current frozen save: **2026-09-14 evening (until tomorrow).**

- GitHub (use this): **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Bundles: `index-out-stay.js`, `lunar-game-stay.js`
- Do not overwrite `stay.html` / `*stay.js`.

Game unchanged tonight. Helmet lamp still intentionally unfixed.

## Tonight’s diagnosis (Mass Driver charge)

Charging **works**. It is passive proximity, not an E button.

- Variable: `mdCharge`
- Tick: `FI()` useFrame: within 7 m of `wI = (-18, 16)` → `mdCharge += min(dt, 0.05) * 0.22`
- Launch refuse: `launchMd()` if `mdCharge < 0.35` → `rails undercharged — stay at the driver`
- “Charge the rails” is the **undercharged fire label**. Pressing E launches (and fails). Stand still until it becomes `Launch — may fall short`.
- Live stand-still at the cab reached **0.354** with no injected charge (~67 s headless; ~2 s at 60 fps).

## Still open tomorrow

1. Sample bag live 3/3 (code already in STAY; T4 + T32 confirmed; need one more valid run)
2. Mass driver end-to-end (now: wait in cab, do not E on “Charge the rails”)
3. ScoutBot Test 3
4. Lab 3/3
5. Rim-scar 3/3
6. Optimus voice
7. General audio
8. Helmet lamp (intentionally unfixed)

Older saves (do not overwrite):
- https://sab7722.github.io/bag.html — `LA_BUILD 20260913_BAG` (same game as STAY)
- https://sab7722.github.io/mouth.html — `LA_BUILD 20260912_WIRE`
- https://sab7722.github.io/eve.html — `LA_BUILD 20260911_EVE`
- https://sab7722.github.io/jump.html — `LA_BUILD 20260911_JUMP`
- https://sab7722.github.io/sleeper.html — `LA_BUILD 20260911_SLEEPER`
- https://sab7722.github.io/keep.html — `LA_BUILD 20260907_KEEP`
- https://sab7722.github.io/saved.html — `LA_BUILD 20260906_SAVED`
- grok.me original: https://reef-brook-charm-cinder.grok.me/

Do not delete this repo. “Save it” means a new unique HTML + isolated JS copies, then push.
