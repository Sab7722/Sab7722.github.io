# Lunar Ascent — KEEP HERE

Current frozen save / rollback: **2026-09-14 (stay).**

- GitHub freeze: **https://sab7722.github.io/stay.html**
- Console: `LA_BUILD 20260913_STAY`
- Bundles: `index-out-stay.js`, `lunar-game-stay.js`
- Do not overwrite `stay.html` / `*stay.js`.

## Latest play (tunnel enter/exit + alcove bag)

- GitHub: **https://sab7722.github.io/void.html**
- Console: `LA_BUILD 20260914_VOID`
- Bundles: `index-out-void.js`, `lunar-game-void.js`
- From md: mill-pad ghosts still gone; MD apron sat-load still works.
- Lava-tube only: mouth open `t<0.045` (north front enter/exit). Nearest-side shell blocks side glitch (no `footBlock` disk at `[46,-44,2.15]`). Width matches visual `r≈2.45`. Roof cap `floor+2.18` (no sky pop-to-mare). Joint overlap `s+1.85`. Alcove `useAct(sample)` bags void 3/3; false Pegasus skipped within 16 m of Sn. `tubeBlock` (habitat connectors) untouched.

Previous play (MD sat load): **https://sab7722.github.io/md.html** `LA_BUILD 20260914_MD`.

Helmet lamp still intentionally unfixed.

## Tonight’s diagnosis (tunnel)

Stay mouth `w=4.6` treated (50,-44) as inside and slid you onto the centerline (side glitch). Collision width 3.2–4.6 vs visual cylinder `r=2.45` = see-through. `lavaWall` was keep-in only (`d>width` no-op) so once outside you could walk through walls / could not reliably exit. No roof: shallow mouth/sky floor could pop to mare. Alcove bag code (`Ms(void)`) already worked; false Pegasus fired when `hypot>110 && !ua()` near Sn.

Fix: narrower `oa` widths, open mouth, nearest-side shell (keep-in inside / keep-out outside), roof clamp, seam overlap, Pegasus guard `hypot(Sn)>16`.

## Still open

1. Habitat walls / corridors (separate problem — not this pass)
2. Mass driver wait-to-charge on a live 60 fps client (headless rAF is starved; charge code unchanged)
3. ScoutBot Test 3
4. Lab 3/3
5. Rim-scar 3/3
6. Optimus voice
7. General audio
8. Helmet lamp (intentionally unfixed)

Older saves (do not overwrite):
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
