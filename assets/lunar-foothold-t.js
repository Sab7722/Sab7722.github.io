/**
 * Lunar Ascent — complete foothold systems.
 * Industry, hydro, mass-driver, scout, life, score, jobs — persistent, physical.
 * Never steals Optimus E (< 2.55 m). Does not replace existing mill / LEMS / habitat.
 */
(function lunarFoothold() {
  const MINE = { x: 34.2, z: -28.4 };
  const HOPPER = { x: 29.4, z: -22.8 };
  const PRESS = { x: 24.6, z: -14.2 };
  const YARD = { x: 22.2, z: -10.6 };
  const FARM = { x: 13.2, z: 0.4 };
  const RAILS = { x: -18, z: 16 };
  const PED = { x: -16.2, z: 13.4 };
  const ICE_CRATER = { x: 20, z: -30 };
  const LITH = { x: 27.0, z: -22.7 };
  const MILL = { x: 20.8, z: -17.6 };
  const OPT_KEEP = 2.55;
  const TASKS = [
    { id: "arrays", x: 13.2, z: 0.4, label: "the arrays" },
    { id: "mill", x: 20.8, z: -17.6, label: "the mill" },
    { id: "pit", x: 34.2, z: -28.4, label: "the glaze pit" },
    { id: "ice", x: 20, z: -30, label: "the mapped crater" },
    { id: "rails", x: -18, z: 16, label: "the rails" },
    { id: "farm", x: 13.2, z: 0.4, label: "hydro" },
    { id: "mast", x: -8.2, z: -11, label: "the mast" },
    { id: "pad", x: 2.4, z: -3.2, label: "the pad" },
  ];

  let scene, Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, MeshStandardMaterial;
  let root, mineG, pressG, farmG, railG, yardG, hopperG, critters = [], padPrints, padPrints2, carrier, panelDown, hatchScuff;
  let plants = [], oreBits = [], bricks = [], caps = [], waterMesh, nuteMesh, lampMesh, pumpMesh, ramMesh, hopperFill, drillMesh, scoopMesh;
  let scoutBeam, scanRing, beltBits = [];
  let lastVoice = "", lastMusic = "", musicName = "";
  let scoutT = 0, scoutTask = 0, mdWatch = "", mdFault = false, mdState = "idle";
  let creditsOn = false, earHold = 0, hydroAcc = 0, mdChargeHold = 0;
  let audio, mix, beds = {}, gains = {}, sfxBus, musBus;
  let lastSpeakAt = 0, lastStep = 0, lastPhrase = 0, phraseNodes = [];
  let lastAirlock = "";
  let extra = loadExtra();
  let stoleOk = false;
  let nextStealAt = 0;

  function loadExtra() {
    try {
      return Object.assign(
        { ore: 0, hopper: 0, bricks: 0, mdShots: 0, nute: 40, grow: 0, foodBin: 0, scoutN: 0, escalation: 0, mdOk: true, belt: 0 },
        JSON.parse(localStorage.getItem("la-foothold") || "{}")
      );
    } catch {
      return { ore: 0, hopper: 0, bricks: 0, mdShots: 0, nute: 40, grow: 0, foodBin: 0, scoutN: 0, escalation: 0, mdOk: true, belt: 0 };
    }
  }
  function saveExtra() {
    try {
      extra.mdFault = mdFault;
      extra.mdState = mdState;
      localStorage.setItem("la-foothold", JSON.stringify(extra));
    } catch {}
  }

  function api() {
    return window.__controlsTest || null;
  }
  function st() {
    const a = api();
    if (!a) return null;
    if (a.store && a.store.getState) return a.store.getState();
    return a.snap ? a.snap() : null;
  }
  function patch(p) {
    const a = api();
    if (a && a.patch) a.patch(p);
  }
  function foundHas(s, k) {
    return !!(s && Array.isArray(s.found) && s.found.includes(k));
  }
  function addFound(k) {
    const s = st();
    if (!s || foundHas(s, k)) return;
    const found = Array.isArray(s.found) ? s.found.slice() : [];
    found.push(k);
    patch({ found });
  }
  function dist(ax, az, bx, bz) {
    return Math.hypot(ax - bx, az - bz);
  }
  function optNear(s) {
    const a = api();
    const o = a && a.getOpt ? a.getOpt() : a && a.opt;
    if (!o || !s) return false;
    return dist(s.px, s.pz, o.x, o.z) < OPT_KEEP;
  }
  function narrativeHold(s) {
    const j = (s && s.job) || "";
    return /ear pushed|tale|lights are on|Moon doesn't close|hopper still hasn't|rails still haven't/.test(j);
  }
  function sayJob(job, why, pri) {
    const s = st();
    const p = pri == null ? 6 : pri;
    if (s && (s.jobPri | 0) > p && s.job && narrativeHold(s) && p < 9) return;
    extra.lastJob = job;
    extra.lastWhy = why;
    saveExtra();
    patch({ job, why, jobPri: p });
  }

  function pickScene(v) {
    if (!v || typeof v !== "object") return null;
    if (v.isScene && v.traverse) return v;
    if (v.scene && v.scene.isScene) return v.scene;
    if (typeof v.getState === "function") {
      try {
        const st = v.getState();
        if (st && st.scene && st.scene.isScene) return st.scene;
      } catch {}
    }
    if (v.root && typeof v.root.getState === "function") {
      try {
        const st = v.root.getState();
        if (st && st.scene && st.scene.isScene) return st.scene;
      } catch {}
    }
    if (v.store && typeof v.store.getState === "function") {
      try {
        const st = v.store.getState();
        if (st && st.scene && st.scene.isScene) return st.scene;
      } catch {}
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
    const now = performance.now();
    if (now < nextStealAt) return false;
    nextStealAt = now + 250;
    const a = api();
    if (a && a.scene && a.scene.traverse) scene = a.scene;
    if (!scene) {
      const canvases = document.querySelectorAll("canvas");
      for (let ci = 0; ci < canvases.length && !scene; ci++) {
        try { scene = pickScene(canvases[ci].__r3f) || scene; } catch {}
      }
    }
    if (!scene || !scene.traverse) {
      window.__laSteal = { scene: false, canvases: document.querySelectorAll("canvas").length };
      return false;
    }
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
    window.__laSteal = { scene: !!scene, Mesh: !!Mesh, Box: !!BoxGeometry, Mat: isStdCtor(MeshStandardMaterial), Group: !!Group, stoleOk, guard: "20260906t" };
    return stoleOk;
  }
  function mat(color, extraM) {
    const m = new MeshStandardMaterial({ color: color });
    if (!m || m.type !== "MeshStandardMaterial") return m;
    m.roughness = 0.78;
    m.metalness = 0.22;
    if (extraM) {
      if (extraM.transparent != null) m.transparent = extraM.transparent;
      if (extraM.opacity != null) m.opacity = extraM.opacity;
      if (typeof extraM.roughness === "number") m.roughness = extraM.roughness;
      if (typeof extraM.metalness === "number") m.metalness = extraM.metalness;
      if (typeof extraM.emissiveIntensity === "number") m.emissiveIntensity = extraM.emissiveIntensity;
      if (extraM.emissive != null && m.emissive && typeof m.emissive.setHex === "function") m.emissive.setHex(extraM.emissive);
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
    const geo = CylinderGeometry ? new CylinderGeometry(rt, rb, h, seg || 12) : new BoxGeometry(rt * 2, h, rt * 2);
    const m = new Mesh(geo, mat(color));
    m.castShadow = true;
    m.position.y = y == null ? h / 2 : y;
    return m;
  }
  function sph(r, color, y) {
    const geo = SphereGeometry ? new SphereGeometry(r, 12, 10) : new BoxGeometry(r * 2, r * 2, r * 2);
    const m = new Mesh(geo, mat(color));
    m.position.y = y == null ? r : y;
    m.castShadow = true;
    return m;
  }

  function buildWorld() {
    if (root || !stealTHREE()) return false;
    root = new Group();
    root.name = "la-foothold";
    scene.add(root);

    mineG = new Group();
    mineG.position.set(MINE.x, 0, MINE.z);
    mineG.add(cyl(4.4, 5.2, 0.32, 0x3a3329, 0.02, 16));
    mineG.add(cyl(2.5, 3.2, 0.85, 0x241e18, 0.08, 14));
    const boom = box(0.16, 0.16, 3.6, 0x8a9088, 1.25);
    boom.position.set(0.8, 1.25, 1.2);
    boom.rotation.y = 0.35;
    mineG.add(boom);
    scoopMesh = box(0.75, 0.48, 0.95, 0x9aa390, 0.55);
    scoopMesh.position.set(1.95, 0.55, 0.15);
    scoopMesh.name = "scoop";
    mineG.add(scoopMesh);
    drillMesh = cyl(0.13, 0.07, 1.55, 0x6a7068, 0.72);
    drillMesh.position.set(-0.45, 0.72, -0.15);
    mineG.add(drillMesh);
    const cab = box(1.1, 0.85, 0.9, 0x4a5248, 1.55);
    cab.position.set(-0.2, 1.55, 1.6);
    mineG.add(cab);
    const tracks = box(2.4, 0.18, 1.1, 0x3a3e38, 0.12);
    tracks.position.set(-0.2, 0.12, 1.6);
    mineG.add(tracks);
    for (let i = 0; i < 6; i++) {
      const o = sph(0.18 + i * 0.03, 0x6b5a3a, 0.2);
      o.position.set(-1.4 + i * 0.32, 0.2, 0.95 - i * 0.12);
      o.userData.ore = true;
      oreBits.push(o);
      mineG.add(o);
    }
    const beacon = box(0.12, 1.05, 0.5, 0xc45c48, 1.3);
    beacon.position.set(2.7, 1.3, -0.85);
    mineG.add(beacon);
    root.add(mineG);

    hopperG = new Group();
    hopperG.position.set(HOPPER.x, 0, HOPPER.z);
    hopperG.add(box(2.05, 1.55, 2.05, 0x5a6168, 0.78));
    hopperG.add(cyl(0.58, 0.92, 0.78, 0x6a7278, 1.62));
    hopperFill = cyl(0.48, 0.48, 0.7, 0x8a7048, 1.35);
    hopperFill.scale.y = 0.15;
    hopperG.add(hopperFill);
    const chute = box(0.45, 0.22, 3.4, 0x6a7278, 0.85);
    chute.position.set(-1.6, 0.85, 0.9);
    chute.rotation.y = 0.55;
    chute.rotation.z = -0.18;
    hopperG.add(chute);
    const belt = box(5.2, 0.14, 0.62, 0x3a3e42, 0.38);
    belt.position.set(-2.15, 0.38, 0.15);
    belt.rotation.y = 0.48;
    hopperG.add(belt);
    for (let i = 0; i < 5; i++) {
      const bit = sph(0.11, 0x7a6848, 0.52);
      bit.userData.belt = i / 5;
      beltBits.push(bit);
      hopperG.add(bit);
    }
    const millTap = box(0.35, 0.55, 0.35, 0x7a828a, 0.4);
    millTap.position.set(-3.4, 0.4, 1.8);
    hopperG.add(millTap);
    root.add(hopperG);

    pressG = new Group();
    pressG.position.set(PRESS.x, 0, PRESS.z);
    pressG.add(box(2.05, 0.42, 1.55, 0x5c6168, 0.22));
    pressG.add(box(0.7, 1.45, 0.7, 0x8a9098, 1.05));
    ramMesh = box(1.05, 0.28, 0.85, 0xb0b6bc, 1.62);
    pressG.add(ramMesh);
    pressG.add(cyl(0.2, 0.2, 0.55, 0x4a90c8, 0.48));
    const die = box(0.85, 0.12, 0.55, 0x3a3e42, 0.48);
    die.position.set(0, 0.48, 0);
    pressG.add(die);
    root.add(pressG);

    yardG = new Group();
    yardG.position.set(YARD.x, 0, YARD.z);
    yardG.add(box(2.6, 0.12, 2.0, 0x4a453c, 0.06));
    yardG.add(box(0.12, 0.85, 2.0, 0x5a5548, 0.42)).position.x = -1.3;
    for (let i = 0; i < 9; i++) {
      const b = box(0.42, 0.18, 0.28, 0x8a7a62, 0.18);
      b.position.set(-0.85 + (i % 3) * 0.72, 0.18 + Math.floor(i / 6) * 0.2, -0.55 + Math.floor((i % 6) / 3) * 0.55);
      b.visible = false;
      b.userData.brick = true;
      bricks.push(b);
      yardG.add(b);
    }
    root.add(yardG);

    farmG = new Group();
    farmG.position.set(FARM.x, 0, FARM.z);
    farmG.add(box(4.2, 0.14, 2.55, 0x3a4a40, 0.07));
    for (let i = 0; i < 3; i++) {
      const bed = box(1.15, 0.24, 2.05, 0x2c382e, 0.24);
      bed.position.set(-1.25 + i * 1.25, 0.24, 0);
      farmG.add(bed);
      const chan = box(0.85, 0.06, 1.85, 0x1a2830, 0.38);
      chan.position.set(-1.25 + i * 1.25, 0.38, 0);
      farmG.add(chan);
      for (let p = 0; p < 6; p++) {
        const stem = cyl(0.035, 0.025, 0.32, 0x3d6a3a, 0.55);
        stem.position.set(-1.25 + i * 1.25 + (p % 2) * 0.28 - 0.14, 0.55, -0.7 + Math.floor(p / 2) * 0.55);
        const leaf = sph(0.1, 0x5a9a48, 0.74);
        leaf.position.copy(stem.position);
        leaf.position.y = 0.74;
        leaf.userData.plant = true;
        stem.userData.plant = true;
        plants.push(leaf, stem);
        farmG.add(stem);
        farmG.add(leaf);
      }
    }
    const tank = cyl(0.7, 0.7, 1.15, 0x6a8aa0, 0.58, 16);
    tank.position.set(-2.55, 0.58, 1.45);
    farmG.add(tank);
    waterMesh = cyl(0.58, 0.58, 0.9, 0x4a88b0, 0.5, 12);
    waterMesh.position.set(-2.55, 0.5, 1.45);
    waterMesh.material = mat(0x4a88b0, { transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0.1 });
    farmG.add(waterMesh);
    const pipe1 = box(3.15, 0.07, 0.07, 0x7a8894, 0.5);
    pipe1.position.set(-1.0, 0.5, 1.45);
    farmG.add(pipe1);
    const pipe2 = box(0.07, 0.07, 1.55, 0x7a8894, 0.5);
    pipe2.position.set(0.55, 0.5, 0.7);
    farmG.add(pipe2);
    const pipe3 = box(0.07, 0.45, 0.07, 0x7a8894, 0.72);
    pipe3.position.set(-1.25, 0.72, 1.45);
    farmG.add(pipe3);
    pumpMesh = cyl(0.3, 0.3, 0.5, 0x4a5560, 0.34);
    pumpMesh.position.set(-2.55, 0.34, 0.42);
    farmG.add(pumpMesh);
    lampMesh = box(3.5, 0.08, 0.5, 0xe8f0c8, 1.62);
    lampMesh.position.set(0, 1.62, 0);
    lampMesh.material = mat(0xe8f0c8, { emissive: 0x889966, emissiveIntensity: 0.55, roughness: 0.4 });
    farmG.add(lampMesh);
    const mastL = box(0.08, 1.55, 0.08, 0x8a9098, 0.85);
    mastL.position.set(-1.7, 0.85, -1.15);
    farmG.add(mastL);
    const mastR = mastL.clone();
    mastR.position.set(1.7, 0.85, -1.15);
    farmG.add(mastR);
    nuteMesh = cyl(0.24, 0.24, 0.55, 0x6a5a3a, 0.32);
    nuteMesh.position.set(-2.05, 0.32, 0.42);
    farmG.add(nuteMesh);
    const crate = box(0.7, 0.45, 0.55, 0x5a5040, 0.28);
    crate.position.set(2.15, 0.28, 1.2);
    crate.userData.foodCrate = true;
    farmG.add(crate);
    root.add(farmG);

    railG = new Group();
    railG.position.set(RAILS.x, 0, RAILS.z);
    railG.add(box(1.7, 2.35, 0.4, 0x6a7078, 1.18));
    railG.add(box(2.6, 0.32, 1.35, 0x4a5058, 0.2));
    const capBank = box(1.25, 1.05, 0.95, 0x3a6080, 0.58);
    capBank.position.set(1.7, 0.58, 0.85);
    railG.add(capBank);
    for (let i = 0; i < 4; i++) {
      const c = cyl(0.12, 0.12, 0.7, 0x8ec8f4, 0.55);
      c.position.set(1.35 + (i % 2) * 0.45, 1.15, 0.55 + Math.floor(i / 2) * 0.45);
      c.material = mat(0x8ec8f4, { emissive: 0x4aa3e0, emissiveIntensity: 0.15 });
      caps.push(c);
      railG.add(c);
    }
    const ped = box(0.78, 1.2, 0.6, 0x8a9098, 0.62);
    ped.position.set(PED.x - RAILS.x, 0.62, PED.z - RAILS.z);
    railG.add(ped);
    const panel = box(0.5, 0.38, 0.08, 0x1a2830, 1.35);
    panel.position.set(PED.x - RAILS.x, 1.35, PED.z - RAILS.z + 0.28);
    panel.material = mat(0x1a2830, { emissive: 0x3dba6a, emissiveIntensity: 0.2 });
    railG.add(panel);
    const dish = cyl(0.5, 0.5, 0.08, 0xc0c8d0, 2.45);
    dish.position.set(-0.15, 2.45, 0);
    railG.add(dish);
    const gantry = box(0.2, 2.85, 0.2, 0x9aa3aa, 1.42);
    gantry.position.set(-1.15, 1.42, 1.15);
    railG.add(gantry);
    const arm = box(2.4, 0.12, 0.12, 0x9aa3aa, 2.8);
    arm.position.set(0.05, 2.8, 1.15);
    railG.add(arm);
    const fence = box(0.08, 0.85, 3.2, 0xc45c48, 0.45);
    fence.position.set(-2.1, 0.45, 0.4);
    railG.add(fence);
    carrier = new Group();
    carrier.add(box(0.9, 0.3, 0.58, 0xb8c0c6, 0.22));
    carrier.add(box(0.52, 0.2, 0.42, 0x6a90b0, 0.42));
    carrier.position.set(0.4, 0.15, 0.2);
    railG.add(carrier);
    root.add(railG);

    scoutBeam = cyl(0.04, 0.35, 1.8, 0x8ec8f4, 1.4, 8);
    scoutBeam.material = mat(0x8ec8f4, { emissive: 0x4aa3e0, emissiveIntensity: 0.8, transparent: true, opacity: 0.45 });
    scoutBeam.visible = false;
    root.add(scoutBeam);
    scanRing = cyl(0.9, 0.9, 0.05, 0x8ec8f4, 0.08, 16);
    scanRing.material = mat(0x8ec8f4, { emissive: 0x4aa3e0, emissiveIntensity: 0.5, transparent: true, opacity: 0.35 });
    scanRing.visible = false;
    root.add(scanRing);

    for (let i = 0; i < 3; i++) {
      const g = makeLitho(i);
      g.userData.homeX = i === 0 ? LITH.x : i === 1 ? 42 : -10;
      g.userData.homeZ = i === 0 ? LITH.z : i === 1 ? -38 : 22;
      g.userData.phase = i * 2.1;
      g.userData.kind = i;
      g.position.set(g.userData.homeX, 0, g.userData.homeZ);
      critters.push(g);
      root.add(g);
    }

    padPrints = makePrints(2.4, -3.2);
    padPrints2 = makePrints(5.1, -1.4);
    root.add(padPrints);
    root.add(padPrints2);

    panelDown = box(2.35, 0.08, 0.95, 0x1a2830, 0.55);
    panelDown.position.set(12.5, 0.55, 4.2);
    panelDown.visible = false;
    root.add(panelDown);

    hatchScuff = cyl(1.15, 1.15, 0.06, 0x2c281f, 0.03, 12);
    hatchScuff.position.set(4.15, 0.03, -6.35);
    hatchScuff.visible = false;
    root.add(hatchScuff);

    opsHud();
    return true;
  }

  function makePrints(x, z) {
    const g = new Group();
    g.visible = false;
    g.position.set(x, 0.03, z);
    g.add(cyl(1.15, 1.15, 0.05, 0x2c281f, 0.02, 10));
    const scuff = box(1.45, 0.06, 0.38, 0x4a4034, 0.05);
    scuff.rotation.y = 0.45;
    g.add(scuff);
    const toe = sph(0.22, 0x3a342c, 0.06);
    toe.scale.set(1.6, 0.4, 2.2);
    toe.position.set(0.55, 0.06, 0.2);
    g.add(toe);
    return g;
  }

  function makeLitho(kind) {
    const g = new Group();
    const col = kind === 2 ? 0x4a4038 : kind === 1 ? 0x6a5c4e : 0x5c5044;
    const scale = kind === 1 ? 1.18 : kind === 2 ? 0.82 : 1;
    const thorax = sph(0.42 * scale, col, 0.55 * scale);
    thorax.scale.set(1.35, 0.78, 1.55);
    g.add(thorax);
    const abdomen = sph(0.38 * scale, col, 0.48 * scale);
    abdomen.scale.set(1.2, 0.7, 1.8);
    abdomen.position.set(0, 0.48 * scale, -0.55 * scale);
    g.add(abdomen);
    const head = sph(0.22 * scale, 0x6a5e50, 0.62 * scale);
    head.position.set(0, 0.62 * scale, 0.72 * scale);
    g.add(head);
    const ridge = box(0.1 * scale, 0.32 * scale, 1.25 * scale, 0x2e2822, 0.88 * scale);
    g.add(ridge);
    for (let p = 0; p < 3; p++) {
      const plate = box(0.28 * scale, 0.08 * scale, 0.32 * scale, 0x3a342c, 0.92 * scale);
      plate.position.set(0, 0.92 * scale, -0.15 + p * 0.35);
      plate.rotation.x = -0.25;
      g.add(plate);
    }
    for (let e = 0; e < 2; e++) {
      const eye = sph(0.055 * scale, 0xe8d2a0, 0.7 * scale);
      eye.position.set((e ? 1 : -1) * 0.12 * scale, 0.7 * scale, 0.88 * scale);
      eye.material = mat(0xe8d2a0, { emissive: 0xaa8844, emissiveIntensity: 0.7 });
      g.add(eye);
    }
    const mand = box(0.16 * scale, 0.06 * scale, 0.22 * scale, 0x2a2420, 0.52 * scale);
    mand.position.set(0, 0.52 * scale, 0.92 * scale);
    g.add(mand);
    g.userData.legs = [];
    for (let l = 0; l < 6; l++) {
      const leg = box(0.055 * scale, 0.58 * scale, 0.055 * scale, 0x3a342c, 0.28 * scale);
      const side = l < 3 ? 1 : -1;
      const z = (l % 3) * 0.38 - 0.38;
      leg.position.set(side * 0.42 * scale, 0.28 * scale, z * scale);
      leg.userData.side = side;
      leg.userData.idx = l;
      g.userData.legs.push(leg);
      g.add(leg);
    }
    return g;
  }

  function opsHud() {
    if (document.getElementById("la-ops")) return;
    const el = document.createElement("div");
    el.id = "la-ops";
    el.style.cssText =
      "position:fixed;left:50%;transform:translateX(-50%);bottom:18%;z-index:40;max-width:38rem;padding:.35rem .85rem;font:500 12px IBM Plex Mono,monospace;color:#d8e0d4;background:rgba(8,10,12,.5);border:1px solid rgba(214,196,160,.18);border-radius:4px;letter-spacing:.04em;pointer-events:none;text-align:center;opacity:0;transition:opacity .3s";
    document.body.appendChild(el);
  }
  function setOps(text) {
    const el = document.getElementById("la-ops");
    if (!el) return;
    el.textContent = text || "";
    el.style.opacity = text ? "1" : "0";
  }

  function unlockAudio() {
    if (audio) {
      if (audio.state === "suspended") audio.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC({ latencyHint: "interactive" });
    mix = audio.createGain();
    mix.gain.value = 0.7;
    mix.connect(audio.destination);
    musBus = audio.createGain();
    musBus.gain.value = 0.9;
    musBus.connect(mix);
    sfxBus = audio.createGain();
    sfxBus.gain.value = 1;
    sfxBus.connect(mix);
    ["storm", "rover", "hab", "litho", "mill", "eva", "pump", "fan", "alarm", "charge"].forEach((k) => {
      const g = audio.createGain();
      g.gain.value = 0;
      g.connect(sfxBus);
      gains[k] = g;
    });
    function noise(dest, type, freq, q) {
      const buf = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = audio.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = audio.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      if (q) f.Q.value = q;
      src.connect(f);
      f.connect(dest);
      src.start();
    }
    noise(gains.storm, "lowpass", 340, 0.55);
    noise(gains.rover, "bandpass", 82, 1.7);
    noise(gains.hab, "lowpass", 110, 0.35);
    noise(gains.fan, "bandpass", 220, 0.8);
    noise(gains.litho, "highpass", 190, 0.65);
    noise(gains.mill, "bandpass", 68, 2.4);
    noise(gains.eva, "highpass", 880, 0.28);
    noise(gains.pump, "bandpass", 46, 3.4);
    noise(gains.alarm, "bandpass", 880, 8);
    noise(gains.charge, "bandpass", 420, 6);
  }
  function blip(freq, dur, type, vol, dest) {
    if (!audio) return;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.value = vol || 0.05;
    o.connect(g);
    g.connect(dest || sfxBus || mix);
    const t = audio.currentTime;
    o.start(t);
    g.gain.setTargetAtTime(0, t + (dur || 0.08), 0.045);
    o.stop(t + (dur || 0.08) + 0.22);
  }
  function thud() {
    blip(58, 0.16, "sine", 0.06);
    blip(110, 0.08, "triangle", 0.03);
  }
  function playBed(name) {
    if (!name || name === musicName) return;
    musicName = name;
    const mapped =
      { eva: "eva", explore: "explore", storm: "storm", danger: "litho", title: "title", arrival: "arrival", discover: "discover", litho: "litho", work: "work", end: "end" }[name] || name;
    const a = api();
    if (a && typeof a.music === "function") {
      try {
        if (lastMusic && lastMusic.stop) lastMusic.stop();
      } catch {}
      try {
        lastMusic = a.music(mapped) || "";
      } catch {}
    }
    if (!audio) return;
    const spec = {
      title: [110, 165, 247, 330],
      arrival: [98, 147, 196, 294],
      eva: [87, 130, 196, 261],
      explore: [98, 147, 220, 329],
      discover: [131, 196, 262, 392],
      litho: [55, 82, 110, 165],
      work: [87, 130, 174, 220],
      storm: [49, 73, 98, 147],
      end: [98, 147, 196, 294, 392],
    }[name] || [110, 165, 247];
    Object.values(beds).forEach((b) => {
      try {
        b.g.gain.setTargetAtTime(0, audio.currentTime, 0.85);
      } catch {}
    });
    if (beds[name]) {
      beds[name].g.gain.setTargetAtTime(0.03, audio.currentTime, 1.15);
      return;
    }
    const g = audio.createGain();
    g.gain.value = 0;
    g.connect(musBus || mix);
    spec.forEach((f, i) => {
      const o = audio.createOscillator();
      o.type = i % 2 ? "sine" : "triangle";
      o.frequency.value = f;
      const lg = audio.createGain();
      lg.gain.value = 0.32 / spec.length;
      o.connect(lg);
      lg.connect(g);
      o.start();
    });
    g.gain.setTargetAtTime(0.03, audio.currentTime, 1.15);
    beds[name] = { g };
  }
  function tickPhrases(s) {
    if (!audio || !s || !s.play || s.mute) return;
    const now = audio.currentTime;
    if (now - lastPhrase < (musicName === "end" ? 5.5 : 4.2)) return;
    lastPhrase = now;
    const phrases = {
      title: [110, 165, 196, 247],
      arrival: [98, 147, 196, 147],
      eva: [87, 130, 174, 130],
      explore: [98, 147, 220, 165],
      discover: [131, 196, 262, 196],
      litho: [73, 55, 82, 110],
      work: [87, 110, 130, 174],
      storm: [49, 73, 55, 49],
      end: [98, 147, 196, 294],
    };
    const notes = phrases[musicName] || phrases.arrival;
    notes.forEach((f, i) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.value = 0;
      o.connect(g);
      g.connect(musBus || mix);
      const t0 = now + i * 0.55;
      o.start(t0);
      g.gain.setTargetAtTime(0.018, t0, 0.05);
      g.gain.setTargetAtTime(0, t0 + 0.42, 0.12);
      o.stop(t0 + 0.7);
    });
  }
  function speak(who, text) {
    const s = st();
    if (!s || s.mute || !text) return;
    const a = api();
    const now = performance.now();
    if (now - lastSpeakAt < 2000) return;
    lastSpeakAt = now;
    if (a && typeof a.speak === "function") {
      try {
        a.speak(who, text, false, undefined, true);
        return;
      } catch {}
    }
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.pitch = who === "Hale" ? 0.84 : 1.02;
    u.volume = 0.85;
    synth.speak(u);
  }

  function markStory(keys) {
    keys.forEach(addFound);
  }

  function tryUse(kind) {
    const s = st();
    const a = api();
    if (!s || !a) return false;
    if (s.paused) return false;
    if (s.cine >= 0 && s.cine != null) return false;
    if (!s.play) return false;
    if (optNear(s)) return false;
    const px = s.px, pz = s.pz;

    if (kind === "mine" && s.outside && dist(px, pz, MINE.x, MINE.z) < 5.4) {
      extra.ore = (extra.ore || 0) + 1;
      extra.pitT = (extra.pitT || 0) + 1;
      extra.belt = 1;
      saveExtra();
      const fill = Math.min(1, (s.millFill || 0) + 0.1);
      markStory(["mine-1", "mine-scoop"]);
      patch({ millFill: fill, held: s.held === "none" || !s.held ? "feed" : s.held });
      sayJob("glaze cut. hopper and mill can take this.", "physical pit. ore on the belt.", 7);
      speak("Rook", "Feedstock. Belt it to the mill.");
      playBed("work");
      thud();
      blip(180, 0.12, "square", 0.04);
      return true;
    }
    if (kind === "hopper" && s.outside && dist(px, pz, HOPPER.x, HOPPER.z) < 3.6) {
      if (s.held === "feed" || extra.ore > 0) {
        extra.ore = Math.max(0, (extra.ore || 0) - 1);
        extra.hopper = Math.min(10, (extra.hopper || 0) + 1);
        saveExtra();
        patch({
          held: s.held === "feed" ? "none" : s.held,
          millFill: Math.min(1, (s.millFill || 0) + 0.22),
        });
        markStory(["hopper-1"]);
        sayJob("hopper took the cut. mill's drinking.", "belt to mill. that's the chain.", 6);
        thud();
        return true;
      }
      sayJob("hopper wants glaze from the pit.", "scoop first.", 4);
      return true;
    }
    if (kind === "press" && s.outside && dist(px, pz, PRESS.x, PRESS.z) < 3.5) {
      if ((s.millFill || 0) < 0.16 && s.held !== "feed" && extra.hopper < 1) {
        sayJob("die is empty. mill or pit first.", "no free bricks.", 5);
        return true;
      }
      extra.bricks = (extra.bricks || 0) + 1;
      extra.hopper = Math.max(0, (extra.hopper || 0) - 0.4);
      extra.pressAnim = 1;
      saveExtra();
      markStory(["press-1"]);
      patch({
        millFill: Math.max(0, (s.millFill || 0) - 0.18),
        held: "paver",
      });
      sayJob("die stamped a brick. yard or rail can take it.", "regolith in. hardware out.", 7);
      speak("Hale", "That's a brick. Same glaze as the farm.");
      playBed("work");
      thud();
      blip(140, 0.18, "triangle", 0.05);
      return true;
    }
    if (kind === "hydro" && dist(px, pz, FARM.x, FARM.z) < 5.2) {
      markStory(["hydro-kit"]);
      if (s.held === "ice") {
        patch({
          held: "none",
          water: Math.min(100, (s.water || 0) + 24),
          plants: Math.min(100, (s.plants || 0) + 12),
        });
        markStory(["ice-pour"]);
        extra.nute = Math.min(100, (extra.nute || 40) + 22);
        extra.grow = Math.min(100, (extra.grow || 0) + 8);
        saveExtra();
        sayJob("reservoir took mapped crater ice. lamps on the beds.", "pipes, pump, nutrients — the loop.", 7);
        speak("Hale", "Mapped crater. Not the slope rumor.");
        playBed("discover");
        blip(420, 0.2, "sine", 0.04);
        return true;
      }
      if ((s.plants || 0) >= 32 || extra.grow > 18) {
        const take = Math.min(20, Math.max(8, (s.plants || 40) - 18));
        extra.foodBin = (extra.foodBin || 0) + Math.round(take * 0.7);
        extra.grow = Math.max(0, (extra.grow || 0) - 10);
        saveExtra();
        patch({
          plants: Math.max(12, (s.plants || 0) - take),
          food: Math.min(100, (s.food || 0) + Math.round(take * 0.7)),
          o2: Math.min(100, (s.o2 || 0) + 6),
        });
        markStory(["hydro-cut"]);
        sayJob("cut the beds. galley can eat this.", "harvest into food. water still ticks.", 7);
        blip(520, 0.1, "sine", 0.03);
        return true;
      }
      sayJob("beds, pump, lamp, tank. ice from the mapped crater fills this.", "not a poster.", 5);
      return true;
    }
    if (kind === "ear") {
      const nearLith =
        critters.some((c) => dist(px, pz, c.position.x, c.position.z) < 8.5) ||
        dist(px, pz, LITH.x, LITH.z) < 8.5;
      if (s.outside && nearLith) {
        markStory(["ear-push", "seen-litho", "site-print"]);
        extra.escalation = Math.max(extra.escalation || 0, 1);
        extra.earAt = performance.now();
        saveExtra();
        sayJob("the ear pushed it. it wouldn't stand the light.", "you were there. the mass moved.", 9);
        speak("Hale", "It pushed. Don't romanticize it.");
        playBed("litho");
        thud();
        blip(42, 0.28, "sine", 0.05);
        critters.forEach((c, i) => {
          if (i === 0) c.userData.recoil = 1;
        });
        return true;
      }
    }
    if (kind === "md" && s.outside && dist(px, pz, PED.x, PED.z) < 4.0) {
      if (mdFault || extra.mdFault) {
        mdFault = false;
        extra.mdOk = true;
        extra.mdFault = false;
        mdState = "idle";
        saveExtra();
        sayJob("rail reseated. capacitors green.", "maintenance done. load again.", 6);
        markStory(["md-maint"]);
        blip(520, 0.12, "sine", 0.04);
        return true;
      }
      if (!s.mdLoaded && (s.held === "paver" || s.held === "feed" || s.held === "slug" || extra.bricks > 0)) {
        if (s.held === "paver" || extra.bricks > 0) extra.bricks = Math.max(0, (extra.bricks || 0) - (s.held === "paver" ? 0 : 1));
        patch({
          mdLoaded: true,
          held: s.held === "paver" || s.held === "feed" || s.held === "slug" ? "none" : s.held,
        });
        mdState = "loaded";
        saveExtra();
        sayJob("bucket's on the rail. charge the bus.", "physical load. don't fire dry.", 7);
        thud();
        return true;
      }
      if (s.mdLoaded && (s.mdCharge || 0) > 0.82 && a.act) {
        if (dist(px, pz, RAILS.x, RAILS.z) < 1.6) {
          sayJob("you're on the rail. step off before fire.", "safety interlock. abort with X if charged dry.", 8);
          return true;
        }
        extra.mdShots = (extra.mdShots || 0) + 1;
        mdState = "firing";
        saveExtra();
        try {
          a.act("fire");
        } catch {}
        patch({ power: Math.max(6, (s.power || 0) - 10) });
        sayJob("fire. tracking. watch the sky.", "power dumped. carrier will come home.", 8);
        playBed("work");
        thud();
        blip(46, 0.7, "sine", 0.07);
        if (carrier) {
          carrier.userData.fly = true;
          carrier.userData.t = 0;
        }
        if (extra.mdShots % 3 === 0) {
          mdFault = true;
          extra.mdFault = true;
          mdState = "fault";
        } else mdState = "tracking";
        return true;
      }
      if ((s.mdCharge || 0) < 0.82) {
        const pwr = Math.max(8, (s.power || 0) - 7);
        const next = Math.min(1, (s.mdCharge || 0) + 0.28);
        patch({ mdCharge: next, power: pwr });
        mdState = next > 0.82 ? "armed" : "charging";
        sayJob("capacitors taking the bus. don't fire dry.", "industrial charge. power draw is real.", 6);
        markStory(["md-charge"]);
        blip(280 + next * 200, 0.15, "square", 0.03);
        return true;
      }
      sayJob("load the rail, charge, then fire from this pedestal.", "bucket, bus, shot, recovery.", 5);
      return true;
    }
    return false;
  }

  function onKey(e) {
    if (e.repeat) return;
    if (e.code === "KeyE" || e.code === "KeyF") {
      if (tryUse("mine") || tryUse("hopper") || tryUse("press") || tryUse("hydro") || tryUse("ear") || tryUse("md")) {
        e.stopPropagation();
      }
    }
    if (e.code === "KeyC") {
      e.preventDefault();
      e.stopPropagation();
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

  function tickScout(dt, s, a) {
    if (!a || !s || !s.play || s.paused) return;
    const phase = s.botPhase;
    const bot = a.bot || {};
    if (scoutBeam) {
      const looking = phase === "look" || phase === "out";
      scoutBeam.visible = looking;
      scanRing.visible = phase === "look";
      if (typeof bot.x === "number") {
        scoutBeam.position.set(bot.x, 0, bot.z);
        scanRing.position.set(bot.x, 0.08, bot.z);
        scanRing.rotation.y += dt * 1.4;
        scoutBeam.material.emissiveIntensity = 0.5 + Math.sin(performance.now() / 180) * 0.4;
      }
    }
    if (phase === "look" && extra.scoutLast && !extra.scoutReported) {
      extra.scoutLook = (extra.scoutLook || 0) + dt;
      if (extra.scoutLook > 2.2) {
        extra.scoutReported = true;
        reportScout(s, extra.scoutLast);
      }
    }
    if (phase === "out" || phase === "look" || phase === "in") return;
    extra.scoutReported = false;
    extra.scoutLook = 0;
    if (missionBotBusy(s)) return;
    if (!foundHas(s, "lems-base")) return;
    scoutT += dt;
    if (scoutT < 18) return;
    if ((s.solar || 0) < 28) return;
    scoutT = 0;
    const task = TASKS[scoutTask % TASKS.length];
    scoutTask++;
    extra.scoutN = (extra.scoutN || 0) + 1;
    extra.scoutLast = task.id;
    extra.scoutReported = false;
    saveExtra();
    if (a.setBot) a.setBot({ tx: task.x, tz: task.z, going: task.label });
    patch({ botPhase: "out", botLook: 0 });
    setOps("Scout inspecting " + task.label + ".");
    if (a.tickBot) a.tickBot(0.4);
  }
  function reportScout(s, id) {
    if (id === "arrays") {
      if ((s.dust || 0) > 35) {
        patch({ dust: Math.max(8, (s.dust || 0) - 6) });
        sayJob("scout wiped the arrays. dust's off the glass.", "it works the site. not a box.", 6);
        speak("Hale", "Scout cleaned a panel. That's why we keep it walking.");
      } else sayJob("scout walked the arrays. glass is clean.", "routine inspect.", 4);
    } else if (id === "mill" || id === "pit") {
      if ((s.millFill || 0) < 0.2) sayJob("scout says the mill's hungry. glaze pit still has cut.", "it named the job.", 5);
      else sayJob("scout pinged the mill. hopper's got bite.", "industry holds.", 4);
    } else if (id === "ice") {
      sayJob("scout mapped the crater ice. hydro can drink that.", "not the slope rumor.", 6);
      speak("Hale", "Crater's still cold. Bring a bag if the beds are dry.");
    } else if (id === "rails") {
      sayJob(mdFault ? "scout flagged the rail. reseat before the next shot." : "scout walked the rails. capacitors quiet.", "industrial inspect.", 5);
    } else if (id === "pad") {
      if ((extra.escalation || 0) > 0) sayJob("scout found prints on the pad. something walked our floor.", "not wind.", 7);
    } else if (id === "farm") {
      sayJob((s.water || 0) < 20 ? "scout says the pillows are dry." : "scout walked hydro. lamps are on.", "life support inspect.", 5);
    }
  }

  function tickCritters(t, s) {
    const escalate = s && (foundHas(s, "ear-push") || foundHas(s, "sag-1") || (extra.escalation || 0) > 0);
    const night = s && s.hour != null && Math.cos((s.hour / 708) * Math.PI * 2) < 0;
    const stage = extra.escalation || 0;
    critters.forEach((g, i) => {
      g.userData.phase += 0.35;
      const ph = g.userData.phase;
      const hx = g.userData.homeX, hz = g.userData.homeZ;
      let tx = hx + Math.sin(ph * 0.19 + i) * 5.5;
      let tz = hz + Math.cos(ph * 0.15 + i) * 4.2;
      if (g.userData.recoil > 0) {
        g.userData.recoil -= 0.02;
        tx = hx + 6;
        tz = hz + 4;
      } else if (escalate && i === 0 && stage >= 1) {
        tx = 3.2 + Math.sin(ph * 0.11) * 2.4;
        tz = -3.8 + Math.cos(ph * 0.14) * 2.1;
      } else if (escalate && i === 1 && (night || stage >= 2)) {
        tx = 8 + Math.sin(ph * 0.1) * 3;
        tz = 2 + Math.cos(ph * 0.12) * 2;
      } else if (escalate && i === 2 && stage >= 3) {
        tx = 4.1 + Math.sin(ph * 0.08) * 1.6;
        tz = -6.2 + Math.cos(ph * 0.09) * 1.4;
      }
      const dx = tx - g.position.x, dz = tz - g.position.z;
      g.position.x += dx * 0.03;
      g.position.z += dz * 0.03;
      const spd = Math.hypot(dx, dz);
      if (spd > 0.05) g.rotation.y = Math.atan2(dx, dz);
      const breathe = 1 + Math.sin(ph * 2.1) * 0.04;
      if (g.children[0]) g.children[0].scale.y = 0.78 * breathe;
      (g.userData.legs || []).forEach((leg) => {
        const gait = Math.sin(ph * 6.2 + leg.userData.idx * 1.05) * (spd > 0.2 ? 0.55 : 0.12);
        leg.rotation.x = gait * (leg.userData.idx % 2 ? 1 : -1);
        leg.rotation.z = leg.userData.side * 0.18;
      });
    });
    if (padPrints) padPrints.visible = !!escalate;
    if (padPrints2) padPrints2.visible = stage >= 2;
    if (hatchScuff) hatchScuff.visible = stage >= 2;
    if (panelDown) {
      panelDown.visible = !!(s && foundHas(s, "sag-1") && !foundHas(s, "sag-fix"));
      panelDown.rotation.z = panelDown.visible ? 0.58 : 0.08;
      panelDown.position.y = panelDown.visible ? 0.28 : 0.55;
    }
    if (escalate && s && !foundHas(s, "sag-1") && foundHas(s, "ear-push") && stage >= 1) {
      const waited = extra.earAt ? performance.now() - extra.earAt > 4000 : true;
      if (waited) {
        extra.escalation = Math.max(2, stage);
        saveExtra();
        addFound("sag-1");
        patch({
          dust: Math.min(100, (s.dust || 0) + 14),
          solar: Math.min(s.solar || 40, 34),
        });
        sayJob("something walked the pad. one array's sitting wrong.", "prints at the hatch. the farm brick.", 8);
        speak("Hale", "It walked our floor. The array's off its pin.");
        playBed("storm");
      }
    }
    if (foundHas(s, "sag-1") && !foundHas(s, "sag-fix") && stage < 3 && foundHas(s, "ear-push")) {
      extra.escT = (extra.escT || 0) + 0.016;
      if (extra.escT > 40) {
        extra.escalation = 3;
        extra.escT = 0;
        saveExtra();
        patch({ dust: Math.min(100, (s.dust || 0) + 8), power: Math.max(10, (s.power || 40) - 8) });
        sayJob("second set of prints. hatch grit. the pad isn't sealed.", "it comes back.", 8);
      }
    }
    if (foundHas(s, "sag-fix") && panelDown) {
      panelDown.visible = false;
      extra.escalation = Math.min(extra.escalation || 0, 1);
    }
  }

  function tickHydro(dt, s) {
    if (!s || !plants.length) return;
    const lit = (s.power || 0) > 18 && !(foundHas(s, "pipe-off") && !foundHas(s, "pipe-on"));
    const wet = (s.water || 0) > 8;
    const fed = (extra.nute || 0) > 2;
    const grow = lit && wet && fed && s.play && !s.paused;
    hydroAcc += dt;
    if (grow && hydroAcc > 2.4) {
      hydroAcc = 0;
      extra.grow = Math.min(100, (extra.grow || 0) + 1.4);
      extra.nute = Math.max(0, (extra.nute || 0) - 0.8);
      saveExtra();
      patch({
        plants: Math.min(100, (s.plants || 0) + 1.1),
        water: Math.max(4, (s.water || 0) - 0.45),
        o2: Math.min(100, (s.o2 || 0) + 0.35),
        power: Math.max(4, (s.power || 0) - 0.12),
      });
    } else if (!grow && hydroAcc > 3.5 && s.play) {
      hydroAcc = 0;
      extra.grow = Math.max(0, (extra.grow || 0) - 0.4);
    }
    const kGrow = Math.max(0.2, Math.min(1.45, ((s.plants || 0) + (extra.grow || 0)) / 80));
    plants.forEach((p, i) => {
      const k = (0.65 + kGrow * (0.45 + (i % 5) * 0.07)) * (lit ? 1 : 0.62);
      p.scale.setScalar(k);
    });
    if (lampMesh && lampMesh.material) lampMesh.material.emissiveIntensity = lit ? 0.75 : 0.04;
    if (waterMesh) waterMesh.scale.y = Math.max(0.12, Math.min(1, (s.water || 0) / 100));
    if (nuteMesh) nuteMesh.scale.y = Math.max(0.2, Math.min(1.1, (extra.nute || 0) / 80));
    if (pumpMesh) pumpMesh.rotation.y += (grow ? 4.2 : 0.4) * dt;
    if (farmG) {
      const crate = farmG.children.find((c) => c.userData.foodCrate);
      if (crate) crate.visible = (extra.foodBin || 0) > 0 || foundHas(s, "hydro-cut");
    }
  }

  function tickIndustry(dt, s) {
    if (drillMesh) drillMesh.rotation.y += dt * ((extra.ore || 0) > 0 || (s && (s.millFill || 0) > 0.02) ? 8 : 1.2);
    if (scoopMesh && extra.belt) {
      extra.belt = Math.max(0, extra.belt - dt * 0.25);
      scoopMesh.position.y = 0.55 + Math.sin(performance.now() / 180) * 0.12;
    }
    oreBits.forEach((o, i) => {
      o.visible = (extra.ore || 0) > i * 0.4 || (!foundHas(s, "mine-1") && i < 3);
    });
    beltBits.forEach((b) => {
      b.userData.belt = (b.userData.belt + dt * 0.18) % 1;
      const u = b.userData.belt;
      b.position.set(-0.2 - u * 3.6, 0.52, 0.1 + u * 0.35);
      b.visible = (extra.ore || 0) > 0 || extra.belt > 0 || (extra.hopper || 0) > 0;
    });
    if (hopperFill) hopperFill.scale.y = Math.max(0.12, Math.min(1, (extra.hopper || 0) / 8 + (s && s.millFill ? s.millFill * 0.4 : 0)));
    if (ramMesh) {
      if (extra.pressAnim > 0) {
        extra.pressAnim -= dt * 1.6;
        ramMesh.position.y = 1.62 - Math.sin(Math.max(0, extra.pressAnim) * Math.PI) * 0.45;
      } else ramMesh.position.y = 1.62;
    }
    bricks.forEach((b, i) => {
      b.visible = i < (extra.bricks || 0);
    });
  }

  function tickMd(s) {
    if (!s || !carrier) return;
    const orbit = s.lastOrbit || "";
    if (orbit && orbit !== "idle" && orbit !== mdWatch) {
      mdWatch = orbit;
      carrier.userData.t = 0;
      carrier.userData.fly = true;
      mdState = "tracking";
      markStory(["md-track", "md-recover"]);
      const line =
        orbit === "orbit"
          ? "bird is up. tracking. carrier on the return."
          : orbit === "crash"
            ? "it came back down. recover the bucket."
            : "shot tracked. bucket on the return rail.";
      sayJob(line, "not a disappearing toy. the loop closes.", 8);
    }
    if (carrier.userData.fly) {
      carrier.userData.t = (carrier.userData.t || 0) + 0.016;
      const t = carrier.userData.t;
      carrier.position.set(0.4 + Math.sin(t * 0.7) * 4.2, 0.15 + Math.max(0, 6.5 - t * 1.05), 0.2 + t * 0.45);
      mdState = t < 3 ? "tracking" : "recovering";
      if (t > 9) {
        carrier.userData.fly = false;
        carrier.position.set(0.4, 0.15, 0.2);
        patch({ mdCharge: 0, mdLoaded: false });
        mdState = mdFault ? "fault" : "idle";
        sayJob(mdFault ? "carrier seated. rail wants a look before the next shot." : "carrier seated. load again.", "recovery complete.", 6);
      }
    } else if (s.mdLoaded) {
      carrier.position.y = 0.22;
    }
    const ch = s.mdCharge || 0;
    caps.forEach((c, i) => {
      if (c.material) c.material.emissiveIntensity = 0.1 + ch * (0.4 + i * 0.12);
    });
    if (gains.charge && audio) {
      const charging = mdState === "charging" || (ch > 0.05 && ch < 0.95 && s.mdLoaded);
      gains.charge.gain.setTargetAtTime(s.mute ? 0 : charging ? 0.05 : 0, audio.currentTime, 0.3);
    }
  }

  function tickAudio(s) {
    if (!mix || !s || !audio) return;
    const mute = !!s.mute;
    const now = audio.currentTime;
    mix.gain.setTargetAtTime(mute ? 0 : 0.7, now, 0.2);
    const storm = Math.min(1, s.storm || 0);
    const dMill = dist(s.px, s.pz, MILL.x, MILL.z);
    const dFarm = dist(s.px, s.pz, FARM.x, FARM.z);
    const dLith = critters.length ? dist(s.px, s.pz, critters[0].position.x, critters[0].position.z) : 99;
    const millOn = (s.millFill || 0) > 0.05 && (s.power || 0) > 18;
    gains.storm.gain.setTargetAtTime(mute ? 0 : storm * 0.3, now, 0.4);
    gains.rover.gain.setTargetAtTime(mute ? 0 : s.vehicle === "ltv" || s.vehicle === "bed" ? 0.15 : 0, now, 0.25);
    gains.hab.gain.setTargetAtTime(mute ? 0 : s.outside ? 0.018 : 0.1, now, 0.3);
    gains.fan.gain.setTargetAtTime(mute ? 0 : s.outside ? 0.01 : 0.06, now, 0.3);
    gains.eva.gain.setTargetAtTime(mute ? 0 : s.outside && s.suited ? 0.055 : 0, now, 0.3);
    gains.litho.gain.setTargetAtTime(mute ? 0 : dLith < 14 ? 0.08 : foundHas(s, "seen-litho") ? 0.03 : 0.01, now, 0.5);
    gains.mill.gain.setTargetAtTime(mute ? 0 : millOn ? 0.09 * Math.max(0.2, 1 - dMill / 28) : 0, now, 0.4);
    gains.pump.gain.setTargetAtTime(mute ? 0 : foundHas(s, "ice-pour") && (s.water || 0) > 10 ? 0.055 * Math.max(0.2, 1 - dFarm / 22) : 0.012, now, 0.4);
    gains.alarm.gain.setTargetAtTime(mute ? 0 : mdFault || (foundHas(s, "sag-1") && !foundHas(s, "sag-fix")) ? 0.035 : 0, now, 0.4);
    if (s.airlock && s.airlock !== lastAirlock) {
      lastAirlock = s.airlock;
      if (s.airlock !== "idle") {
        blip(84, 0.22, "sine", 0.045);
        blip(200, 0.09, "triangle", 0.03);
      }
    }
  }
  function tickMusic(s) {
    if (!s || !s.play) {
      playBed("title");
      return;
    }
    if (foundHas(s, "tale-1") || foundHas(s, "end-seen") || foundHas(s, "credits-seen")) {
      playBed("end");
      return;
    }
    if ((s.storm || 0) > 0.45 || (foundHas(s, "sag-1") && !foundHas(s, "sag-fix"))) {
      playBed("storm");
      return;
    }
    if (foundHas(s, "ear-push") || foundHas(s, "seen-litho")) {
      playBed("litho");
      return;
    }
    if (foundHas(s, "ice-pour") || foundHas(s, "mine-1")) {
      playBed("work");
      return;
    }
    if (foundHas(s, "lems-base") && s.outside && s.vehicle === "walk") {
      playBed("eva");
      return;
    }
    if (s.outside) {
      playBed("explore");
      return;
    }
    playBed("arrival");
  }

  function tickCredits(s) {
    if (!s) return;
    if ((foundHas(s, "end-seen") || foundHas(s, "credits-seen") || foundHas(s, "tale-1")) && !creditsOn && (s.cine < 0 || s.cine == null)) {
      extra.creditWait = (extra.creditWait || 0) + 1;
      if (extra.creditWait > 40) showCredits(s);
    } else if (!foundHas(s, "tale-1") && !foundHas(s, "end-seen") && !foundHas(s, "credits-seen")) extra.creditWait = 0;
  }
  function showCredits(s) {
    if (creditsOn) return;
    creditsOn = true;
    playBed("end");
    addFound("credits-seen");
    speak("Rook", "Lights are on. The Moon doesn't close.");
    const wrap = document.createElement("div");
    wrap.id = "la-credits";
    wrap.style.cssText =
      "position:fixed;inset:0;z-index:90;display:flex;align-items:flex-end;justify-content:center;background:radial-gradient(ellipse at 50% 18%,rgba(18,22,30,.12),rgba(0,0,0,.94));color:#e8ece4;text-align:center;font-family:IBM Plex Sans,sans-serif;overflow:hidden";
    const ice = foundHas(s, "ice-pour");
    const nBricks = extra.bricks || 0;
    const shots = extra.mdShots || 0;
    wrap.innerHTML = `<div id="la-rollwrap" style="width:min(36rem,92vw);height:70vh;overflow:hidden;position:relative;margin-bottom:8vh">
      <div id="la-roll" style="animation:la-up 28s linear forwards;padding-top:70vh">
        <div style="font:600 11px IBM Plex Mono,monospace;opacity:.65;letter-spacing:.28em">SHACKLETON RIM</div>
        <div style="font:600 2.15rem Syne,sans-serif;letter-spacing:.2em;margin:.8rem 0 1.6rem">LUNAR ASCENT</div>
        <p style="font-size:15px;line-height:1.9;letter-spacing:.04em;opacity:.92">The foothold holds.<br/>${ice ? "The crater ice is in the tanks." : "Farther ice is still unread."}<br/>${nBricks ? nBricks + " bricks on the yard." : "The mill still wants glaze."}<br/>${shots ? shots + " shots off the rail." : "The rail is quiet."}<br/>The Moon doesn't close.</p>
        <div style="margin-top:2.4rem;font:500 12px IBM Plex Mono,monospace;letter-spacing:.16em;line-height:2.2;opacity:.62">
          ROOK · CAPCOM<br/>HALE · HABITAT<br/>VOSS · SCIENCE<br/>PIKE · EVA<br/>QUINN · ORBIT<br/><br/>OPTIMUS<br/>SCOUTBOT<br/>PEGASUS<br/><br/>KEEP THE FOOTHOLD
        </div>
      </div>
      <p style="position:absolute;bottom:0;left:0;right:0;font:500 10px IBM Plex Mono,monospace;opacity:.4">CLICK TO RETURN</p>
    </div>
    <style>@keyframes la-up{from{transform:translateY(0)}to{transform:translateY(-72%)}}</style>`;
    document.body.appendChild(wrap);
    wrap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1600, fill: "forwards" });
    wrap.addEventListener("click", () => {
      wrap.remove();
      creditsOn = false;
    });
  }

  function tickVoice(s) {
    if (!s || !s.play) return;
    const line = (s.voice || "") + "|" + (s.voiceWho || "");
    if (s.voice && s.voiceWho && line !== lastVoice) {
      lastVoice = line;
      speak(s.voiceWho, s.voice);
    }
  }
  function tickJobPri(dt, s) {
    if (!s) return;
    if (foundHas(s, "ice-pour") && /ice is still a rumor|slope is still a rumor|bag hasn't reached/.test(s.job || "")) {
      sayJob("the crater ice is in the tanks. farther cold is still unread.", "mapped crater is not the rumor.", 7);
      return;
    }
    if (!(s.jobPri > 0)) return;
    const next = Math.max(0, s.jobPri - dt * 0.28);
    if (Math.abs(next - s.jobPri) > 0.05) patch({ jobPri: next });
  }
  function tickEar(dt, s) {
    if (!s || !s.outside || !s.play) return;
    const near =
      dist(s.px, s.pz, LITH.x, LITH.z) < 8 ||
      critters.some((c) => dist(s.px, s.pz, c.position.x, c.position.z) < 7.2);
    if (near) {
      earHold += dt;
      setOps("E — the mass is close. push the ear.");
      if (earHold > 1.6 && !foundHas(s, "ear-push")) tryUse("ear");
    } else if (earHold > 0) earHold = Math.max(0, earHold - dt);
  }
  function tickFoot(s) {
    if (!audio || !s || !s.play || s.paused) return;
    const a = api();
    const spd = a && a.getSpeed ? Math.abs(a.getSpeed()) : 0;
    if (spd > 0.8 && performance.now() - lastStep > (s.outside ? 420 : 340)) {
      lastStep = performance.now();
      blip(s.outside ? 88 : 138, 0.05, "triangle", s.outside ? 0.028 : 0.042);
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
      if (!root && a && s && (s.play || s.outside || s.screen === "play")) buildWorld();
      if (s && a) {
        tickJobPri(dt, s);
        tickScout(dt, s, a);
        tickMd(s);
        tickHydro(dt, s);
        tickIndustry(dt, s);
        tickCredits(s);
        tickVoice(s);
        tickMusic(s);
        tickPhrases(s);
        tickEar(dt, s);
        tickFoot(s);
        if (audio) tickAudio(s);
        const nearMine = s.outside && dist(s.px, s.pz, MINE.x, MINE.z) < 5.2;
        const nearHop = s.outside && dist(s.px, s.pz, HOPPER.x, HOPPER.z) < 3.6;
        const nearPress = s.outside && dist(s.px, s.pz, PRESS.x, PRESS.z) < 3.5;
        const nearHydro = dist(s.px, s.pz, FARM.x, FARM.z) < 5.2;
        const nearMd = s.outside && dist(s.px, s.pz, PED.x, PED.z) < 4;
        if (nearMine) setOps("E — scoop the glaze pit");
        else if (nearHop) setOps("E — dump into the hopper");
        else if (nearPress) setOps("E — sinter press");
        else if (nearHydro) setOps("E — hydro beds / harvest / ice");
        else if (nearMd)
          setOps(mdFault ? "E — reseat the rail" : s.mdLoaded ? ((s.mdCharge || 0) > 0.82 ? "E — fire" : "E — charge capacitors") : "E — load / charge / fire");
        else if (!(earHold > 0)) setOps("");
      }
      tickCritters(now / 1000, s);
    } catch (err) {
      if (!window.__laFootholdErr) {
        window.__laFootholdErr = String(err && err.message ? err.message : err);
      }
    }
  }

  function boot() {
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", unlockAudio, { once: true });
    document.addEventListener("keydown", unlockAudio, { once: true });
    document.addEventListener("visibilitychange", () => {
      if (audio && document.visibilityState === "visible" && audio.state === "suspended") audio.resume();
    });
    requestAnimationFrame(frame);
    window.__laFoothold = {
      mine: MINE,
      press: PRESS,
      farm: FARM,
      hopper: HOPPER,
      rails: RAILS,
      ped: PED,
      lith: LITH,
      yard: YARD,
      mill: MILL,
      ice: ICE_CRATER,
      use: tryUse,
      extra,
      get extraState() {
        return extra;
      },
      get mdState() {
        return mdState;
      },
      get mdFault() {
        return mdFault;
      },
      get score() {
        return musicName;
      },
      dispatchScout() {
        scoutT = 99;
        const s = st();
        const a = api();
        if (s && a) tickScout(20, s, a);
      },
      forceCredits() {
        const s = st();
        if (s) showCredits(s);
      },
      built() {
        return !!root;
      },
      critters() {
        return critters.length;
      },
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
