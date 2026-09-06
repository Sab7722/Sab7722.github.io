/**
 * Lunar Ascent — final systems + polish pass.
 * Completes remaining industrial / collision / LTV / job / MD abort work
 * on top of foothold + settlement. Does not steal Optimus / LEMS E.
 */
(function lunarFinish() {
  const OPT_KEEP = 2.55;
  const LEMS = { x: 13, z: -24 };
  const MILL = { x: 20.8, z: -17.6 };
  const SOLAR = [
    [12.5, 4.2], [13.2, -3.5], [14, 0.4], [-12.8, 3.8],
    [-13.4, -4.1], [-14.2, 0.2], [8.5, 11.2], [-8.8, 11.5],
  ];
  const PAD = { x: 2.4, z: -3.2 };
  const PED = { x: -16.2, z: 13.4 };
  const RAILS = { x: -18, z: 16 };

  let scene, Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, MeshStandardMaterial;
  let ltvG, ltvDone = false, dockG, wrapped = false, lastMdShots = 0, abortHold = 0;
  let lastJobLock = "";
  let nextDressAt = 0;
  let stoleOk = false;

  function api() { return window.__controlsTest || null; }
  function st() {
    const a = api();
    if (!a) return null;
    if (a.store && a.store.getState) return a.store.getState();
    return a.snap ? a.snap() : null;
  }
  function patch(p) { const a = api(); if (a && a.patch) a.patch(p); }
  function dist(ax, az, bx, bz) { return Math.hypot(ax - bx, az - bz); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function optNear(s) {
    const a = api();
    const o = a && a.getOpt ? a.getOpt() : null;
    return !!(o && s && dist(s.px, s.pz, o.x, o.z) < OPT_KEEP);
  }
  function lemsNear(s) { return s && dist(s.px, s.pz, LEMS.x, LEMS.z) < 3.4; }
  function foundHas(s, k) { return !!(s && Array.isArray(s.found) && s.found.includes(k)); }
  function fh() { return (window.__laFoothold && window.__laFoothold.extraState) || {}; }
  function SS() { return (window.__laSettle && window.__laSettle.state) || null; }

  function pickScene(v) {
    if (!v || typeof v !== "object") return null;
    if (v.isScene && v.traverse) return v;
    if (v.scene && v.scene.isScene) return v.scene;
    if (typeof v.getState === "function") {
      try { const g = v.getState(); if (g && g.scene && g.scene.isScene) return g.scene; } catch {}
    }
    return null;
  }
  function isStdCtor(C) {
    if (!C) return false;
    if (C.__laIsStd === true) return true;
    if (C.__laIsStd === false) return false;
    try {
      const m = new C({ color: 0xffffff });
      const ok = !!(m && m.type === "MeshStandardMaterial");
      if (m && typeof m.dispose === "function") m.dispose();
      C.__laIsStd = ok;
      return ok;
    } catch (e) {
      C.__laIsStd = false;
      return false;
    }
  }
  function stealTHREE() {
    if (MeshStandardMaterial && !isStdCtor(MeshStandardMaterial)) MeshStandardMaterial = null;
    if (stoleOk && scene && scene.traverse && Group && Mesh && BoxGeometry && isStdCtor(MeshStandardMaterial)) return true;
    const a = api();
    if (a && a.scene && a.scene.traverse) scene = a.scene;
    if (!scene) {
      const canvases = document.querySelectorAll("canvas");
      for (let ci = 0; ci < canvases.length && !scene; ci++) {
        try { scene = pickScene(canvases[ci].__r3f) || scene; } catch {}
      }
    }
    if (!scene || !scene.traverse) return false;
    if (!Group || !Mesh || !BoxGeometry || !isStdCtor(MeshStandardMaterial)) {
      try {
        scene.traverse((o) => {
          if (!Group && o.isGroup) Group = o.constructor;
          if (o.isMesh && o.geometry) {
            Mesh = Mesh || o.constructor;
            const typ = o.geometry.type || "";
            if (typ.indexOf("Box") >= 0) BoxGeometry = BoxGeometry || o.geometry.constructor;
            if (typ.indexOf("Cylinder") >= 0) CylinderGeometry = CylinderGeometry || o.geometry.constructor;
            if (typ.indexOf("Sphere") >= 0) SphereGeometry = SphereGeometry || o.geometry.constructor;
            const mat0 = Array.isArray(o.material) ? o.material[0] : o.material;
            if (mat0 && mat0.type === "MeshStandardMaterial") MeshStandardMaterial = MeshStandardMaterial || mat0.constructor;
          }
        });
      } catch {}
      if (!Group && scene.constructor) Group = scene.constructor;
    }
    stoleOk = !!(scene && Group && Mesh && BoxGeometry && isStdCtor(MeshStandardMaterial));
    return stoleOk;
  }
  function mat(color, extra) {
    const m = new MeshStandardMaterial({ color: color });
    if (!m || m.type !== "MeshStandardMaterial") return m;
    m.roughness = 0.72;
    m.metalness = 0.28;
    if (extra) {
      if (extra.transparent != null) m.transparent = extra.transparent;
      if (extra.opacity != null) m.opacity = extra.opacity;
      if (typeof extra.roughness === "number") m.roughness = extra.roughness;
      if (typeof extra.metalness === "number") m.metalness = extra.metalness;
      if (typeof extra.emissiveIntensity === "number") m.emissiveIntensity = extra.emissiveIntensity;
      if (extra.emissive != null && m.emissive && typeof m.emissive.setHex === "function") m.emissive.setHex(extra.emissive);
    }
    return m;
  }
  function box(w, h, d, color, y) {
    const m = new Mesh(new BoxGeometry(w, h, d), mat(color));
    m.castShadow = true;
    m.receiveShadow = true;
    m.position.y = y == null ? h / 2 : y;
    return m;
  }
  function cyl(rt, rb, h, color, y, seg) {
    const geo = CylinderGeometry ? new CylinderGeometry(rt, rb, h, seg || 10) : new BoxGeometry(rt * 2, h, rt * 2);
    const m = new Mesh(geo, mat(color));
    m.position.y = y == null ? h / 2 : y;
    m.castShadow = true;
    return m;
  }

  /* ---------- extra collision: rover, bot, solar legs, mill shoulders ---------- */
  function circPush(px, pz, cx, cz, r) {
    const dx = px - cx, dz = pz - cz, d = Math.hypot(dx, dz) || 1e-6;
    if (d >= r) return { x: px, z: pz };
    return { x: cx + dx / d * r, z: cz + dz / d * r };
  }
  function extraBlock(x, z) {
    let px = x, pz = z, R = 0.45;
    const a = api();
    const s = st();
    const L = [];
    if (s && s.vehicle !== "ltv" && s.ltv) L.push([s.ltv.x, s.ltv.z, 1.42]);
    if (a && a.bot && typeof a.bot.x === "number") L.push([a.bot.x, a.bot.z, 0.62]);
    L.push([MILL.x, MILL.z, 1.55]);
    L.push([MILL.x + 1.6, MILL.z - 0.8, 0.7]);
    SOLAR.forEach(([sx, sz]) => {
      L.push([sx, sz, 1.05]);
      L.push([sx + 1.1, sz, 0.38]);
      L.push([sx - 1.1, sz, 0.38]);
    });
    L.push([4.15, -6.35, 1.35]);
    L.push([PED.x, PED.z, 0.85]);
    for (let k = 0; k < 2; k++) {
      for (let i = 0; i < L.length; i++) {
        const P = circPush(px, pz, L[i][0], L[i][1], L[i][2] + R);
        px = P.x; pz = P.z;
      }
    }
    if (typeof window.__settleBlock === "function") {
      const V = window.__settleBlock(px, pz);
      px = V.x; pz = V.z;
    }
    return { x: px, z: pz };
  }
  function wrapMovement() {
    const a = api();
    if (!a || wrapped) return;
    if (typeof a.setPos === "function") {
      const orig = a.setPos.bind(a);
      a.setPos = function (x, z) {
        const s = st();
        if (s && s.outside && s.vehicle === "walk") {
          const P = extraBlock(x, z);
          x = P.x; z = P.z;
        }
        return orig(x, z);
      };
    }
    wrapped = true;
  }

  /* ---------- LTV visual quality: interior + body kit ---------- */
  function findLtvGroup() {
    if (!scene) return null;
    let hit = null;
    scene.traverse((o) => {
      if (hit) return;
      if (o.isMesh && o.userData && o.userData.act === "ltv" && o.parent) hit = o.parent;
    });
    return hit;
  }
  function dressLtv() {
    if (ltvDone || !stealTHREE()) return false;
    const g = findLtvGroup();
    if (!g) return false;
    ltvG = g;
    const kit = new Group();
    kit.name = "la-ltv-kit";
    // cabin floor + tunnel
    kit.add(box(1.55, 0.04, 2.35, 0x2a3036, 0.58));
    // seats
    const seatL = box(0.42, 0.16, 0.48, 0x3a4048, 0.78);
    seatL.position.set(-0.32, 0.78, 0.28);
    kit.add(seatL);
    const seatR = seatL.clone();
    seatR.position.x = 0.32;
    kit.add(seatR);
    const backL = box(0.42, 0.42, 0.1, 0x3a4048, 1.05);
    backL.position.set(-0.32, 1.05, 0.06);
    kit.add(backL);
    const backR = backL.clone();
    backR.position.x = 0.32;
    kit.add(backR);
    // dash + yoke
    const dash = box(1.42, 0.22, 0.38, 0x1e242c, 1.08);
    dash.position.set(0, 1.08, 1.12);
    kit.add(dash);
    const screen = box(0.55, 0.12, 0.04, 0x3dba6a, 1.18);
    screen.position.set(0, 1.18, 1.32);
    screen.material = mat(0x3dba6a, { emissive: 0x2a8a4a, emissiveIntensity: 0.55 });
    kit.add(screen);
    const yoke = cyl(0.16, 0.16, 0.04, 0x2a3038, 1.22, 12);
    yoke.position.set(0, 1.22, 1.22);
    yoke.rotation.x = Math.PI / 2;
    kit.add(yoke);
    // windshield
    const glass = box(1.48, 0.62, 0.05, 0x8ec8f4, 1.48);
    glass.position.set(0, 1.48, 1.42);
    glass.rotation.x = -0.32;
    glass.material = mat(0x8ec8f4, { transparent: true, opacity: 0.28, roughness: 0.12, metalness: 0.4, emissive: 0x1a3040, emissiveIntensity: 0.12 });
    kit.add(glass);
    // side windows
    for (const sx of [-0.96, 0.96]) {
      const w = box(0.05, 0.42, 1.15, 0x8ec8f4, 1.38);
      w.position.set(sx, 1.38, 0.25);
      w.material = mat(0x8ec8f4, { transparent: true, opacity: 0.22, roughness: 0.14 });
      kit.add(w);
    }
    // roll cage
    for (const sx of [-0.72, 0.72]) {
      const bar = cyl(0.03, 0.03, 1.15, 0xc5ccd2, 1.35);
      bar.position.set(sx, 1.35, -0.35);
      kit.add(bar);
    }
    const hoop = box(1.5, 0.05, 0.05, 0xc5ccd2, 1.95);
    hoop.position.set(0, 1.95, -0.35);
    kit.add(hoop);
    // fenders
    for (const [x, z] of [[-0.95, 1.2], [0.95, 1.2], [-0.95, -1.2], [0.95, -1.2]]) {
      const f = box(0.38, 0.12, 0.7, 0xb8c0c8, 0.72);
      f.position.set(x, 0.72, z);
      kit.add(f);
    }
    // mirrors
    for (const sx of [-1.02, 1.02]) {
      const arm = box(0.18, 0.04, 0.04, 0x8a9098, 1.28);
      arm.position.set(sx * 0.92, 1.28, 1.05);
      kit.add(arm);
      const mir = box(0.12, 0.08, 0.02, 0xc5ccd4, 1.3);
      mir.position.set(sx, 1.3, 1.05);
      kit.add(mir);
    }
    // rear rack
    const rack = box(1.35, 0.08, 0.55, 0x6a7278, 1.15);
    rack.position.set(0, 1.15, -1.72);
    kit.add(rack);
    const can = cyl(0.12, 0.12, 0.35, 0x4a5560, 1.38);
    can.position.set(0.45, 1.38, -1.72);
    kit.add(can);
    g.add(kit);
    ltvDone = true;
    return true;
  }

  /* ---------- scout charge dock + MD abort + coupling ---------- */
  function buildDock() {
    if (dockG || !stealTHREE()) return;
    dockG = new Group();
    dockG.name = "la-scout-dock";
    dockG.position.set(PAD.x + 3.4, 0, PAD.z - 1.6);
    dockG.add(box(1.15, 0.08, 0.85, 0x4a453c, 0.04));
    const post = cyl(0.06, 0.06, 0.85, 0x8a9098, 0.5);
    post.position.set(0.4, 0.5, 0);
    dockG.add(post);
    const tap = box(0.18, 0.12, 0.18, 0xe0c14a, 0.92);
    tap.position.set(0.4, 0.92, 0);
    dockG.add(tap);
    scene.add(dockG);
  }

  function abortMd() {
    const s = st();
    const a = api();
    if (!s || !a || !s.play || s.paused) return false;
    if (optNear(s) || lemsNear(s)) return false;
    if (dist(s.px, s.pz, PED.x, PED.z) > 5.5 && dist(s.px, s.pz, RAILS.x, RAILS.z) > 6) return false;
    const charging = (s.mdCharge || 0) > 0.05 && (s.mdCharge || 0) < 0.99;
    const loaded = !!s.mdLoaded;
    const fhMd = window.__laFoothold && window.__laFoothold.mdState;
    if (!charging && !loaded && fhMd !== "charging" && fhMd !== "armed" && fhMd !== "firing") return false;
    patch({ mdCharge: 0, mdLoaded: false, power: Math.min(100, (s.power || 0) + 4) });
    if (window.__laFoothold) {
      try { window.__laFoothold.extraState.mdFault = false; } catch {}
    }
    patch({ job: "abort. capacitors dumped. rail is cold.", why: "safety. you can load again.", jobPri: 7 });
    abortHold = 1.2;
    return true;
  }

  function coupleFire(s) {
    const extra = fh();
    const shots = extra.mdShots || 0;
    if (shots <= lastMdShots) return;
    lastMdShots = shots;
    const S = SS();
    if (S && S.prop > 0.4) {
      const take = Math.min(S.prop, 2.4);
      S.prop -= take;
      S.lh2 = Math.max(0, S.lh2 - take * 0.2);
      S.lox = Math.max(0, S.lox - take * 0.35);
      if (window.__laSettle && window.__laSettle.save) window.__laSettle.save();
      patch({ job: "shot used mixed propellant. tracking.", why: "ISRU feeds the rail. not a dry fire.", jobPri: 7 });
    }
    // wear the rail
    if (S) {
      S.wear = S.wear || {};
      S.wear.md = clamp((S.wear.md || 7) + 4, 0, 100);
    }
  }

  function tickScoutCharge(dt, s, a) {
    if (!a || !s || !s.play || missionBotBusy(s)) return;
    if (!foundHas(s, "lems-base")) return;
    const bot = a.bot || {};
    const dock = { x: PAD.x + 3.4, z: PAD.z - 1.6 };
    if (s.botPhase === "in" || s.botPhase === "out" || s.botPhase === "look") return;
    const n = (fh().scoutN || 0);
    if (n > 0 && n % 4 === 0 && !fh().scoutCharging) {
      fh().scoutCharging = true;
      if (a.setBot) a.setBot({ tx: dock.x, tz: dock.z, going: "the charge tap" });
      patch({ botPhase: "out", botLook: 0 });
    }
    if (fh().scoutCharging && dist(bot.x || 0, bot.z || 0, dock.x, dock.z) < 2.2) {
      fh().scoutCharging = false;
      patch({ botPhase: "idle", power: Math.max(6, (s.power || 40) - 1) });
    }
  }
  function missionBotBusy(s) {
    return (
      (foundHas(s, "run-bot") && !foundHas(s, "run-ping")) ||
      (foundHas(s, "sag-1") && !foundHas(s, "sag-fix") && foundHas(s, "bot-read")) ||
      (foundHas(s, "fin-go") && !foundHas(s, "fin-op")) ||
      (foundHas(s, "will-look") && foundHas(s, "will-1")) ||
      (foundHas(s, "xpd-walk") && !foundHas(s, "xpd-bot")) ||
      (foundHas(s, "ans-walk") && !foundHas(s, "ans-hold"))
    );
  }

  function tickFactory(dt, s) {
    const S = SS();
    const extra = fh();
    if (!S || !s || !s.play) return;
    if ((extra.hopper || 0) > 0 && (s.millFill || 0) < 0.95) {
      // mill drinks hopper physically
    }
    if ((extra.bricks || 0) > (S._lastBricks || 0)) {
      S.parts = (S.parts || 0) + (extra.bricks - (S._lastBricks || 0)) * 0.25;
      S._lastBricks = extra.bricks;
    }
    // crew eat harvest
    if ((extra.foodBin || 0) > 0) {
      Object.keys(S.crew || {}).forEach((k) => {
        S.crew[k].hung = clamp((S.crew[k].hung || 0) - 0.4 * dt, 0, 100);
      });
    }
  }

  function onKey(e) {
    if (e.repeat) return;
    if (e.code === "KeyX") {
      if (abortMd()) {
        e.stopPropagation();
        e.preventDefault();
      }
    }
  }

  let lastT = performance.now();
  function frame() {
    requestAnimationFrame(frame);
    try {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastT) / 1000);
      lastT = now;
      const a = api();
      const s = st();
      if (!a || !s) return;
      wrapMovement();
      if ((s.play || s.screen === "play") && now >= nextDressAt) {
        nextDressAt = now + 1000;
        if (!ltvDone) dressLtv();
        if (!dockG) buildDock();
      }
      if (s.play && !s.paused) {
        coupleFire(s);
        tickScoutCharge(dt, s, a);
        tickFactory(dt, s);
        if (abortHold > 0) abortHold -= dt;
      }
    } catch (err) {
      if (!window.__laFinishErr) window.__laFinishErr = String(err && err.message ? err.message : err);
    }
  }

  function boot() {
    document.addEventListener("keydown", onKey, true);
    requestAnimationFrame(frame);
    window.__laFinish = {
      extraBlock,
      abortMd,
      dressed() { return ltvDone; },
      wrapped() { return wrapped; },
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
