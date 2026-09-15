# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Bundles: `index-out-stay.js`, `lunar-game-stay.js`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (Optimus E + look + voice)

- GitHub: **https://sab7722.github.io/prime.html**
- Console: `LA_BUILD 20260914_PRIME`
- Bundles: `index-out-prime.js`, `lunar-game-prime.js`
- From rover: Scout E-send-to-mill, tunnel, MD apron still present.
- Optimus only: E at ~2.15 m (closer than mill/Scout) shows **Ask Optimus** and assigns a walk 3/3. TTS `speak()` after cancel (50 ms + resume). Visual: thicker torso, shoulders, chest plate, visor glow. Same invisible hitbox `.95×2.15×.72`.

Previous play (Scout): **https://sab7722.github.io/rover.html** `LA_BUILD 20260914_ROVER`.

Helmet lamp still intentionally unfixed.

## Tonight’s diagnosis (Optimus)

Oz parks on the mill pad. Mill’s invisible `3.6×3.6` interact box stole the HUD; E at 2.5 m still hit mill/Scout if the prompt won first. Chrome drops `speechSynthesis.cancel()` + `speak()` in the same tick → silent in play. Mesh was a thin stacked-cylinder stick.

Fix: closer-than-mill/Scout opt volume (2.8 m) for E + HUD; delayed TTS resume; `oX()` shoulders/chest/visor. Mill-S (closer to mill) unchanged. Scout send unchanged.

## Still open

1. Habitat walls / corridors (separate problem — not this pass)
2. Mass driver wait-to-charge on a live 60 fps client (headless rAF is starved; charge code unchanged)
3. Lab 3/3
4. Rim-scar 3/3
5. General audio
6. Helmet lamp (intentionally unfixed)

Older saves (do not overwrite):
- https://sab7722.github.io/rover.html — `LA_BUILD 20260914_ROVER` (Scout send)
- https://sab7722.github.io/void.html — `LA_BUILD 20260914_VOID` (tunnel enter/exit)
- https://sab7722.github.io/md.html — `LA_BUILD 20260914_MD` (MD apron sat load)
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
