/**
 * Lunar Ascent — settlement simulation layer.
 * One loop: resources → mining → haul → refine → manufacture → construction
 * → power / ECLSS → crew / robots → maintenance → more production.
 * Does not replace mill / LEMS / Optimus / ScoutBot / habitat / story.
 */
(function lunarSettlement() {
  const OPT_KEEP = 2.55;
  const LEMS = { x: 13, z: -24 };
  const MILL = { x: 20.8, z: -17.6 };
  const MINE = { x: 34.2, z: -28.4 };
  const HOPPER = { x: 29.4, z: -22.8 };
  const PRESS = { x: 24.6, z: -14.2 };
  const YARD = { x: 22.2, z: -10.6 };
  const FARM = { x: 13.2, z: 0.4 };
  const ICE = { x: 20, z: -30 };
  const ISRU = { x: 18.4, z: -26.8 };
  const TANKS = { x: 15.6, z: -22.2 };
  const XFER = { x: 16.8, z: -19.6 };
  const HAUL_DOCK = { x: 31.8, z: -25.5 };
  const REMOTE = { x: 46, z: -44 };
  const MAST = { x: -8.2, z: -11 };
  const PAD = { x: 2.4, z: -3.2 };
  const HAB = { x: 0, z: 0 };

  const PADS = [
    { id: "solar", x: 16.4, z: 6.4, yaw: 0.15, costB: 3, costP: 2, label: "array wing", title: "extra array" },
    { id: "tank", x: 10.6, z: -8.6, yaw: 0.4, costB: 2, costP: 2, label: "tank farm", title: "water / prop tank" },
    { id: "bed", x: 11.4, z: 1.8, yaw: -0.2, costB: 2, costP: 1, label: "grow bed", title: "hydro bed" },
    { id: "shed", x: 8.4, z: 5.2, yaw: 0.6, costB: 3, costP: 2, label: "parts shed", title: "workshop shed" },
    { id: "hab", x: -6.8, z: 4.4, yaw: -0.5, costB: 4, costP: 3, label: "pressure module", title: "hab skirt" },
  ];

  const MACHINES = ["mill", "pump", "solar", "rover", "md", "bot", "opt", "eclss", "isru", "mine", "hauler", "remote", "scrubber", "heater"];

  function defaults() {
    return {
      v: 1,
      ore: 0,
      refined: 0,
      parts: 2,
      bricks: 0,
      iceRes: 0,
      lh2: 0,
      lox: 0,
      prop: 0,
      tankCap: 40,
      waste: 8,
      co2: 12,
      pressure: 101,
      temp: 21,
      leak: 0,
      wear: { mill: 6, pump: 5, solar: 8, rover: 10, md: 7, bot: 4, opt: 5, eclss: 6, isru: 0, mine: 4, hauler: 3, remote: 0, scrubber: 5, heater: 4 },
      failed: {},
      builds: {},
      buildProg: {},
      remote: { on: false, mode: "idle", ore: 0, power: 40, haul: 0, last: 0 },
      isruOn: false,
      hose: "",
      hoseT: 0,
      hauler: { x: HAUL_DOCK.x, z: HAUL_DOCK.z, job: "idle", batt: 88, load: 0, t: 0 },
      inspector: { x: MILL.x - 3, z: MILL.z + 4, job: "idle", batt: 80, t: 0 },
      crew: {
        Hale: { x: 0.4, z: 1.6, inside: true, task: "ops", fat: 12, hung: 18, thirst: 14, deck: 2 },
        Rook: { x: -0.6, z: 2.0, inside: true, task: "comms", fat: 10, hung: 16, thirst: 12, deck: 2 },
        Voss: { x: 1.2, z: -1.4, inside: true, task: "lab", fat: 20, hung: 22, thirst: 18, deck: 3 },
        Pike: { x: 2.6, z: -0.2, inside: true, task: "eva", fat: 24, hung: 20, thirst: 16, deck: 1 },
        Quinn: { x: -1.4, z: 0.8, inside: true, task: "orbit", fat: 8, hung: 14, thirst: 10, deck: 2 },
      },
      lastAlarm: "",
      ticks: 0,
    };
  }

  let S = load();
  let scene, Group, Mesh, BoxGeometry, CylinderGeometry, SphereGeometry, MeshStandardMaterial;
  let root, meshes = {};
  let crewG = {}, haulerG, inspectG, hoseMesh, ghostG = {};
  let audio, radioBus, hissGain, pttGain, voOpen = false;
  let lastSpeakAt = 0, lastSave = 0, lastJobPri = 0;
  let wasPlay = false, lastAlarmAt = 0, lastCrewSay = 0;
  let colliders = [];

  function load() {
    const d = defaults();
    try {
      const raw = JSON.parse(localStorage.getItem("la-settle") || "{}");
      const w = Object.assign({}, d.wear, raw.wear || {});
      const c = Object.assign({}, d.crew, raw.crew || {});
      const r = Object.assign({}, d.remote, raw.remote || {});
      const h = Object.assign({}, d.hauler, raw.hauler || {});
      const ins = Object.assign({}, d.inspector, raw.inspector || {});
      return Object.assign(d, raw, { wear: w, crew: c, remote: r, hauler: h, inspector: ins, failed: raw.failed || {}, builds: raw.builds || {}, buildProg: raw.buildProg || {} });
    } catch {
      return d;
    }
  }
  function save() {
    try {
      localStorage.setItem("la-settle", JSON.stringify(S));
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
  function fh() {
    return (window.__laFoothold && window.__laFoothold.extraState) || {};
  }
  function foundHas(s, k) {
    return !!(s && Array.isArray(s.found) && s.found.includes(k));
  }
  function addFound(k) {
    const s = st();
    if (!s || foundHas(s, k)) return;
    const found = s.found.slice();
    found.push(k);
    patch({ found });
  }
  function dist(ax, az, bx, bz) {
    return Math.hypot(ax - bx, az - bz);
  }
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  function optNear(s) {
    const a = api();
    const o = a && a.getOpt ? a.getOpt() : a && a.opt;
    if (!o || !s) return false;
    return dist(s.px, s.pz, o.x, o.z) < OPT_KEEP;
  }
  function lemsNear(s) {
    return s && dist(s.px, s.pz, LEMS.x, LEMS.z) < 3.4;
  }
  function millNear(s) {
    return s && dist(s.px, s.pz, MILL.x, MILL.z) < 2.15;
  }
  function bricks() {
    return (S.bricks || 0) + (fh().bricks || 0);
  }
  function spendBricks(n) {
    let need = n;
    if ((fh().bricks || 0) > 0 && window.__laFoothold) {
      const take = Math.min(need, fh().bricks);
      fh().bricks -= take;
      need -= take;
    }
    S.bricks = Math.max(0, (S.bricks || 0) - need);
  }
  function sayJob(job, why, pri) {
    const s = st();
    const p = pri == null ? 5 : pri;
    if (s && (s.jobPri | 0) > p && /ear pushed|tale|lights are on|Moon doesn't close|hopper still hasn't|rails still haven't/.test(s.job || "") && p < 9) return;
    lastJobPri = p;
    patch({ job, why, jobPri: p });
  }
  function radioSpeak(who, text) {
    const s = st();
    if (!s || s.mute || !text) return;
    const now = performance.now();
    if (now - lastSpeakAt < 2400) return;
    lastSpeakAt = now;
    radioOpen(who, s);
    const a = api();
    if (a && typeof a.speak === "function") {
      try {
        a.speak(who, text, false, () => radioClose(), true);
        return;
      } catch {}
    }
    const synth = window.speechSynthesis;
    if (!synth) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = who === "Hale" ? 0.88 : who === "Rook" ? 0.94 : 0.92;
    u.pitch = who === "Hale" ? 0.78 : who === "Rook" ? 1.05 : 0.95;
    u.volume = 0.82;
    u.onend = () => radioClose();
    synth.speak(u);
  }

  /* ---------- Radio VO treatment (gameplay TTS → comms chain) ---------- */
  function unlockAudio() {
    if (audio) {
      if (audio.state === "suspended") audio.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio = new AC({ latencyHint: "interactive" });
    radioBus = audio.createGain();
    radioBus.gain.value = 0.55;
    radioBus.connect(audio.destination);
    hissGain = audio.createGain();
    hissGain.gain.value = 0;
    const buf = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = audio.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = audio.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1400;
    bp.Q.value = 0.7;
    const hp = audio.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 380;
    src.connect(hp);
    hp.connect(bp);
    bp.connect(hissGain);
    hissGain.connect(radioBus);
    src.start();
    wrapSpeech();
  }
  function ptt(freq, dur, vol) {
    if (!audio) return;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = "square";
    o.frequency.value = freq;
    g.gain.value = vol || 0.04;
    o.connect(g);
    g.connect(radioBus);
    const t = audio.currentTime;
    o.start(t);
    g.gain.setTargetAtTime(0, t + (dur || 0.04), 0.02);
    o.stop(t + (dur || 0.04) + 0.08);
  }
  function radioOpen(who, s) {
    if (!audio) unlockAudio();
    if (!audio || !hissGain) return;
    voOpen = true;
    const storm = s ? s.storm || 0 : 0;
    const comms = s ? (s.comms || 70) / 100 : 0.7;
    const eva = s && s.outside;
    const hiss = (eva ? 0.045 : 0.022) + storm * 0.05 + (1 - comms) * 0.04;
    try {
      hissGain.gain.setTargetAtTime(s && s.mute ? 0 : hiss, audio.currentTime, 0.05);
    } catch {}
    ptt(who === "Rook" ? 1680 : 1320, 0.045, 0.05);
    ptt(90, 0.06, 0.03);
  }
  function radioClose() {
    if (!audio || !hissGain) return;
    voOpen = false;
    ptt(980, 0.03, 0.03);
    try {
      hissGain.gain.setTargetAtTime(0.004, audio.currentTime, 0.18);
    } catch {}
  }
  function wrapSpeech() {
    const synth = window.speechSynthesis;
    if (!synth || synth.__laRadio) return;
    const orig = synth.speak.bind(synth);
    synth.speak = function (u) {
      const s = st();
      if (s && !s.mute) radioOpen(u && u.pitch < 0.9 ? "Hale" : "Rook", s);
      if (u) {
        const prev = u.onend;
        u.onend = function (ev) {
          radioClose();
          if (typeof prev === "function") prev.call(u, ev);
        };
      }
      return orig(u);
    };
    synth.__laRadio = true;
  }

  /* ---------- THREE ---------- */
  function pickScene(v) {
    if (!v || typeof v !== "object") return null;
    if (v.isScene && v.traverse) return v;
    if (v.scene && v.scene.isScene) return v.scene;
    if (typeof v.getState === "function") {
      try {
        const stt = v.getState();
        if (stt && stt.scene && stt.scene.isScene) return stt.scene;
      } catch {}
    }
    return null;
  }
  function stealTHREE() {
    const a = api();
    if (a && a.scene && a.scene.traverse) scene = a.scene;
    const canvases = document.querySelectorAll("canvas");
    for (let ci = 0; ci < canvases.length && !scene; ci++) {
      scene = pickScene(canvases[ci].__r3f);
    }
    if (!scene || !scene.traverse) return false;
    scene.traverse((o) => {
      if (!Group && o.isGroup) Group = o.constructor;
      if (o.isMesh && o.geometry) {
        Mesh = Mesh || o.constructor;
        const typ = o.geometry.type || "";
        if (typ.indexOf("Box") >= 0) BoxGeometry = BoxGeometry || o.geometry.constructor;
        if (typ.indexOf("Cylinder") >= 0) CylinderGeometry = CylinderGeometry || o.geometry.constructor;
        if (typ.indexOf("Sphere") >= 0) SphereGeometry = SphereGeometry || o.geometry.constructor;
        const mat0 = Array.isArray(o.material) ? o.material[0] : o.material;
        if (mat0 && mat0.isMaterial) MeshStandardMaterial = MeshStandardMaterial || mat0.constructor;
      }
    });
    if (!Group && scene.constructor) Group = scene.constructor;
    return !!(Mesh && BoxGeometry && MeshStandardMaterial && Group);
  }
  function mat(color, extraM) {
    return new MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.22, ...(extraM || {}) });
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

  function makePerson(kind) {
    const g = new Group();
    const col = kind === "Hale" ? 0xece6dc : kind === "Rook" ? 0xe6eaee : kind === "Voss" ? 0xe4eaf0 : kind === "Pike" ? 0xece8e2 : 0xd8e0e8;
    const accent = kind === "Hale" ? 0x2a7a88 : kind === "Rook" ? 0xd4a429 : kind === "Voss" ? 0x4aa3e0 : kind === "Pike" ? 0xc45c48 : 0x8ec8f4;
    const torso = box(0.38, 0.62, 0.28, col, 1.05);
    g.add(torso);
    const helm = sph(0.16, 0xc5ccd4, 1.48);
    g.add(helm);
    const visor = box(0.22, 0.08, 0.06, accent, 1.48);
    visor.position.z = 0.12;
    visor.material = mat(accent, { emissive: accent, emissiveIntensity: 0.35 });
    g.add(visor);
    const pack = box(0.28, 0.38, 0.14, 0x4a5058, 1.08);
    pack.position.z = -0.2;
    g.add(pack);
    for (const side of [-1, 1]) {
      const leg = box(0.1, 0.55, 0.12, 0x3a4048, 0.38);
      leg.position.x = side * 0.12;
      g.add(leg);
      const arm = box(0.08, 0.48, 0.08, col, 1.05);
      arm.position.x = side * 0.26;
      g.add(arm);
    }
    g.userData.kind = kind;
    return g;
  }
  function makeHauler() {
    const g = new Group();
    g.add(box(1.35, 0.42, 0.85, 0x5a6168, 0.48));
    g.add(box(0.7, 0.38, 0.7, 0x3a6080, 0.92));
    const bed = box(0.85, 0.22, 0.7, 0x8a7048, 0.78);
    bed.name = "bed";
    g.add(bed);
    for (const sx of [-0.42, 0.42]) {
      g.add(box(0.18, 0.16, 0.95, 0x2a2e32, 0.14)).position.x = sx;
    }
    const lamp = sph(0.06, 0x8ec8f4, 0.95);
    lamp.position.z = 0.4;
    lamp.material = mat(0x8ec8f4, { emissive: 0x4aa3e0, emissiveIntensity: 0.6 });
    g.add(lamp);
    return g;
  }

  function buildWorld() {
    if (root || !stealTHREE()) return false;
    root = new Group();
    root.name = "la-settle";
    scene.add(root);

    const isru = new Group();
    isru.position.set(ISRU.x, 0, ISRU.z);
    isru.add(box(2.2, 1.15, 1.55, 0x5c6168, 0.58));
    isru.add(cyl(0.22, 0.22, 1.65, 0x8a9098, 1.55));
    const stack = cyl(0.12, 0.16, 1.1, 0x6a7278, 2.05);
    stack.position.set(0.65, 2.05, 0.2);
    isru.add(stack);
    const panel = box(0.55, 0.42, 0.08, 0x1a2830, 1.15);
    panel.position.set(0, 1.15, 0.82);
    panel.material = mat(0x1a2830, { emissive: 0x3dba6a, emissiveIntensity: 0.15 });
    isru.add(panel);
    meshes.isruLight = panel;
    const iceBin = cyl(0.4, 0.48, 0.7, 0x8aa0b0, 0.4);
    iceBin.position.set(-1.15, 0.4, 0.55);
    isru.add(iceBin);
    meshes.iceBin = iceBin;
    const pipeI = box(2.6, 0.07, 0.07, 0x7a8894, 0.55);
    pipeI.position.set(-1.4, 0.55, 1.4);
    isru.add(pipeI);
    root.add(isru);
    meshes.isru = isru;

    const tanks = new Group();
    tanks.position.set(TANKS.x, 0, TANKS.z);
    const lh = cyl(0.55, 0.55, 1.85, 0x8aa4b8, 0.95, 16);
    lh.position.set(-0.7, 0.95, 0);
    tanks.add(lh);
    const lx = cyl(0.55, 0.55, 1.85, 0xb0c0c8, 0.95, 16);
    lx.position.set(0.7, 0.95, 0);
    tanks.add(lx);
    const mx = cyl(0.42, 0.42, 1.35, 0x6a8aa0, 0.7, 14);
    mx.position.set(0, 0.7, 1.05);
    tanks.add(mx);
    meshes.lh2 = lh;
    meshes.lox = lx;
    meshes.prop = mx;
    const saddle = box(2.15, 0.16, 1.05, 0x4a5058, 0.1);
    tanks.add(saddle);
    root.add(tanks);
    meshes.tanks = tanks;

    const xfer = new Group();
    xfer.position.set(XFER.x, 0, XFER.z);
    xfer.add(box(1.15, 0.55, 0.7, 0x4a5560, 0.3));
    const pump = cyl(0.22, 0.22, 0.55, 0x6a7278, 0.62);
    xfer.add(pump);
    meshes.pump = pump;
    const valve = cyl(0.12, 0.12, 0.28, 0xc45c48, 0.72);
    valve.position.set(0.45, 0.72, 0.15);
    xfer.add(valve);
    meshes.valve = valve;
    hoseMesh = box(0.08, 0.08, 2.4, 0x3a4a40, 0.42);
    hoseMesh.position.set(0.2, 0.42, 1.1);
    hoseMesh.visible = false;
    xfer.add(hoseMesh);
    root.add(xfer);
    meshes.xfer = xfer;

    const remote = new Group();
    remote.position.set(REMOTE.x, 0, REMOTE.z);
    remote.add(cyl(3.6, 4.2, 0.28, 0x3a3329, 0.02, 16));
    remote.add(cyl(1.8, 2.2, 0.7, 0x241e18, 0.08, 14));
    const boom = box(0.14, 0.14, 3.2, 0x8a9088, 1.35);
    boom.position.set(0.9, 1.35, 0.8);
    remote.add(boom);
    meshes.drill = cyl(0.12, 0.06, 1.7, 0x6a7068, 0.7);
    meshes.drill.position.set(-0.3, 0.7, -0.2);
    remote.add(meshes.drill);
    const cab = box(1.05, 0.8, 0.85, 0x4a5248, 1.45);
    cab.position.set(-0.4, 1.45, 1.4);
    remote.add(cab);
    const mast = box(0.08, 2.4, 0.08, 0x9aa3aa, 1.25);
    mast.position.set(2.1, 1.25, -0.8);
    remote.add(mast);
    const dish = cyl(0.35, 0.35, 0.06, 0xc0c8d0, 2.55);
    dish.position.set(2.1, 2.55, -0.8);
    remote.add(dish);
    const rSolar = box(2.4, 0.06, 1.05, 0x1a2830, 1.15);
    rSolar.position.set(-2.2, 1.15, 0.4);
    rSolar.rotation.z = 0.45;
    rSolar.material = mat(0x1a2830, { emissive: 0x1a4060, emissiveIntensity: 0.25 });
    remote.add(rSolar);
    meshes.remoteSolar = rSolar;
    const hop = box(1.4, 1.1, 1.4, 0x5a6168, 0.6);
    hop.position.set(1.6, 0.6, 1.5);
    remote.add(hop);
    meshes.remoteFill = cyl(0.4, 0.4, 0.7, 0x8a7048, 0.9);
    meshes.remoteFill.position.set(1.6, 0.9, 1.5);
    meshes.remoteFill.scale.y = 0.15;
    remote.add(meshes.remoteFill);
    const beacon = box(0.12, 0.9, 0.12, 0xc45c48, 1.4);
    beacon.position.set(2.6, 1.4, 1.2);
    remote.add(beacon);
    meshes.remoteBeacon = beacon;
    root.add(remote);
    meshes.remote = remote;

    haulerG = makeHauler();
    haulerG.position.set(S.hauler.x, 0, S.hauler.z);
    root.add(haulerG);

    inspectG = makeHauler();
    inspectG.scale.setScalar(0.62);
    inspectG.position.set(S.inspector.x, 0, S.inspector.z);
    root.add(inspectG);

    ["Hale", "Rook", "Voss", "Pike", "Quinn"].forEach((k) => {
      const g = makePerson(k);
      const c = S.crew[k];
      g.position.set(c.x, c.inside ? (c.deck - 1) * 2.15 : 0, c.z);
      crewG[k] = g;
      root.add(g);
    });

    PADS.forEach((p) => {
      const g = new Group();
      g.position.set(p.x, 0, p.z);
      g.rotation.y = p.yaw;
      const ring = cyl(1.15, 1.15, 0.05, 0x4a453c, 0.03, 16);
      ring.material = mat(0x4a453c, { transparent: true, opacity: 0.7 });
      g.add(ring);
      ghostG[p.id] = g;
      g.userData.pad = p;
      root.add(g);
      rebuildPad(p.id);
    });

    boardHud();
    refreshColliders();
    return true;
  }

  function moduleMesh(id) {
    const g = new Group();
    g.name = "built-" + id;
    if (id === "solar") {
      const p = box(3.2, 0.08, 1.15, 0x1a2830, 1.25);
      p.rotation.z = 0.42;
      p.material = mat(0x1a2830, { emissive: 0x1a4060, emissiveIntensity: 0.3 });
      g.add(p);
      g.add(box(0.1, 1.4, 0.1, 0x8a9098, 0.7)).position.x = -1.1;
      g.add(box(0.1, 1.4, 0.1, 0x8a9098, 0.7)).position.x = 1.1;
    } else if (id === "tank") {
      g.add(cyl(0.7, 0.7, 1.6, 0x6a8aa0, 0.82, 16));
      g.add(cyl(0.55, 0.55, 1.25, 0x8aa4b8, 0.64, 14)).position.x = 1.15;
      g.add(box(2.2, 0.12, 1.2, 0x4a5058, 0.08));
    } else if (id === "bed") {
      g.add(box(2.4, 0.22, 1.4, 0x2c382e, 0.22));
      for (let i = 0; i < 6; i++) {
        const st = cyl(0.03, 0.02, 0.28, 0x3d6a3a, 0.5);
        st.position.set(-0.8 + (i % 3) * 0.7, 0.5, (i < 3 ? -0.3 : 0.3));
        g.add(st);
      }
      const lamp = box(1.8, 0.06, 0.3, 0xe8f0c8, 1.35);
      lamp.material = mat(0xe8f0c8, { emissive: 0x889966, emissiveIntensity: 0.45 });
      g.add(lamp);
    } else if (id === "shed") {
      g.add(box(2.2, 1.55, 1.8, 0x5a5548, 0.8));
      g.add(box(0.7, 1.2, 0.08, 0x3a3e42, 0.7)).position.z = 0.92;
      g.add(box(0.85, 0.45, 0.55, 0x6a5a3a, 0.28)).position.set(1.3, 0.28, 0.4);
    } else if (id === "hab") {
      g.add(cyl(1.35, 1.35, 2.05, 0x8b939c, 1.05, 16));
      g.add(box(0.7, 1.35, 0.12, 0x4a5058, 0.85)).position.z = 1.32;
      const win = box(0.35, 0.28, 0.06, 0x6ec8e6, 1.45);
      win.position.z = 1.3;
      win.material = mat(0x6ec8e6, { emissive: 0x2a7a88, emissiveIntensity: 0.4 });
      g.add(win);
    }
    return g;
  }
  function rebuildPad(id) {
    const g = ghostG[id];
    if (!g) return;
    const keep = g.children[0];
    for (let i = g.children.length - 1; i >= 1; i--) g.remove(g.children[i]);
    const done = !!S.builds[id];
    const prog = S.buildProg[id] || 0;
    keep.material.opacity = done ? 0.15 : 0.55;
    if (done) {
      g.add(moduleMesh(id));
    } else if (prog > 0) {
      const stub = box(0.9 + prog, 0.2 + prog * 0.9, 0.7 + prog * 0.4, 0x6a5a48, 0.2 + prog * 0.45);
      g.add(stub);
    }
  }

  function boardHud() {
    if (document.getElementById("la-board")) return;
    const el = document.createElement("div");
    el.id = "la-board";
    el.style.cssText =
      "position:fixed;left:14px;bottom:14px;z-index:42;width:min(22rem,46vw);padding:8px 10px 9px;font:500 11px IBM Plex Mono,ui-monospace,monospace;color:#c8d0c8;background:rgba(8,10,12,.58);border:1px solid rgba(214,196,160,.16);border-radius:4px;letter-spacing:.04em;pointer-events:none;line-height:1.55;opacity:0;transition:opacity .25s;text-shadow:0 1px 2px #000";
    el.innerHTML = `<div style="font:600 9px IBM Plex Mono,monospace;letter-spacing:.22em;opacity:.55;margin-bottom:4px">FOOTHOLD</div><div id="la-board-b"></div>`;
    document.body.appendChild(el);
    const hint = document.createElement("div");
    hint.id = "la-settle-ops";
    hint.style.cssText =
      "position:fixed;left:50%;transform:translateX(-50%);bottom:22%;z-index:41;max-width:36rem;padding:.32rem .8rem;font:500 12px IBM Plex Mono,monospace;color:#d8e0d4;background:rgba(8,10,12,.5);border:1px solid rgba(214,196,160,.18);border-radius:4px;letter-spacing:.04em;pointer-events:none;text-align:center;opacity:0;transition:opacity .3s";
    document.body.appendChild(hint);
  }
  function setHint(t) {
    const el = document.getElementById("la-settle-ops");
    if (!el) return;
    el.textContent = t || "";
    el.style.opacity = t ? "1" : "0";
  }
  function paintBoard(s) {
    const el = document.getElementById("la-board");
    const b = document.getElementById("la-board-b");
    if (!el || !b || !s || !s.play) {
      if (el) el.style.opacity = "0";
      return;
    }
    el.style.opacity = s.hudOn === false ? "0" : "0.92";
    const alarm = Object.keys(S.failed).filter((k) => S.failed[k]);
    const o2 = Math.round(s.o2 || 0);
    const pwr = Math.round(s.power || 0);
    const w = Math.round(s.water || 0);
    const food = Math.round(s.food || 0);
    const crewUp = Object.values(S.crew).filter((c) => c.fat < 88 && c.hung < 92).length;
    const rmode = S.remote.on ? S.remote.mode : "dark";
    const line1 = `ECLSS  O₂ ${o2}  CO₂ ${Math.round(S.co2)}  ${Math.round(S.pressure)} kPa  ${Math.round(S.temp)}°C`;
    const line2 = `GRID   PWR ${pwr}  H₂O ${w}  FOOD ${food}  PROP ${Math.round(S.prop)}`;
    const line3 = `CREW   ${crewUp}/5  ·  HAUL ${S.hauler.job}  ·  MINE ${rmode}`;
    const line4 = alarm.length ? `FAULT  ${alarm.join(" · ")}` : `STOCK  ore ${Math.round(S.ore + (fh().ore || 0))}  bricks ${Math.round(bricks())}  parts ${Math.round(S.parts)}`;
    b.innerHTML = `${line1}<br/>${line2}<br/>${line3}<br/><span style="color:${alarm.length ? "#c45c48" : "#9aa390"}">${line4}</span>`;
  }

  /* ---------- Collision ---------- */
  function refreshColliders() {
    colliders = [
      [ISRU.x, ISRU.z, 1.55],
      [TANKS.x, TANKS.z, 1.42],
      [XFER.x, XFER.z, 0.88],
      [HAUL_DOCK.x, HAUL_DOCK.z, 0.7],
      [REMOTE.x, REMOTE.z, 2.15],
    ];
    PADS.forEach((p) => {
      if (S.builds[p.id]) colliders.push([p.x, p.z, p.id === "hab" ? 1.45 : p.id === "solar" ? 1.35 : 1.05]);
    });
  }
  window.__settleBlock = function (x, z) {
    let px = x, pz = z, R = 0.45;
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < colliders.length; i++) {
        const cx = colliders[i][0], cz = colliders[i][1], cr = colliders[i][2] + R;
        const dx = px - cx, dz = pz - cz;
        const d = Math.hypot(dx, dz) || 1e-6;
        if (d < cr) {
          const s = cr / d;
          px = cx + dx * s;
          pz = cz + dz * s;
        }
      }
    }
    return { x: px, z: pz };
  };

  /* ---------- Simulation tick ---------- */
  function failed(id) {
    return !!S.failed[id];
  }
  function wearOn(id, amt) {
    S.wear[id] = clamp((S.wear[id] || 0) + amt, 0, 100);
    if (S.wear[id] > 92 && !S.failed[id]) {
      S.failed[id] = true;
      alarm(id + " failed");
    }
  }
  function alarm(msg) {
    const now = performance.now();
    if (msg === S.lastAlarm && now - lastAlarmAt < 12000) return;
    S.lastAlarm = msg;
    lastAlarmAt = now;
    sayJob(msg + ". inspect and repair with parts.", "wear from work, not a script.", 8);
    radioSpeak("Hale", msg + ". I keep the ears.");
  }
  function sun(s) {
    const hour = s.hour || 0;
    return Math.sin((hour / 708) * Math.PI * 2);
  }

  function simTick(dt, s) {
    if (!s || !s.play || s.paused || (s.cine >= 0 && s.cine != null)) return;
    const n = clamp(dt * (s.timeScale || 1), 0, 0.2);
    S.ticks += n;
    const sunA = sun(s);
    const storm = s.storm || 0;
    const dust = s.dust || 12;
    const millOn = !failed("mill") && (s.millFill || 0) > 0.04 && (s.power || 0) > 16 && foundHas(s, "mill-run");
    const hydroOn = !failed("pump") && (s.water || 0) > 6 && (s.power || 0) > 14 && foundHas(s, "ice-pour");
    const isruRun = S.isruOn && !failed("isru") && (s.power || 0) > 22 && S.iceRes > 0.15;
    const remoteRun = S.remote.on && S.remote.mode === "extract" && !failed("remote") && S.remote.power > 8;
    const crewN = 5;
    const cap = 5 + (S.builds.hab ? 2 : 0);

    // Power: extra industrial loads on top of the existing bus. Do not re-simulate solar income.
    let pwr = s.power || 40;
    if (S.builds.solar && sunA > 0.12 && !failed("solar")) pwr = Math.min(100, pwr + 0.32 * n);
    if (failed("solar")) pwr = Math.max(0, pwr - 0.25 * n);
    let load = 0;
    if (isruRun) load += 0.55 * n;
    if (remoteRun) load += 0.28 * n;
    if (S.hose) load += 0.16 * n;
    if (!failed("eclss")) load += 0.08 * n;
    if (!failed("heater") && !s.outside) load += 0.06 * n;
    if (!failed("scrubber")) load += 0.07 * n;
    if (S.builds.bed && hydroOn) load += 0.1 * n;
    pwr = Math.max(0, pwr - load);
    const brownout = pwr < 12;

    // Wear from actual work + environment
    if (millOn) wearOn("mill", 0.9 * n);
    if (hydroOn) wearOn("pump", 0.55 * n);
    wearOn("solar", (0.12 + dust * 0.008 + storm * 0.25) * n);
    if (s.vehicle === "ltv") wearOn("rover", 0.7 * n + storm * 0.4 * n);
    if ((s.mdCharge || 0) > 0.2) wearOn("md", 0.5 * n);
    if (isruRun) wearOn("isru", 0.8 * n);
    if (remoteRun) wearOn("remote", 0.65 * n);
    if (S.hauler.job !== "idle") wearOn("hauler", 0.5 * n);
    wearOn("eclss", 0.2 * n + (storm * 0.15 * n));
    wearOn("scrubber", (crewN * 0.08) * n);
    wearOn("heater", 0.12 * n);
    if (s.botPhase === "out" || s.botPhase === "look") wearOn("bot", 0.4 * n);
    const a = api();
    const opt = a && a.getOpt ? a.getOpt() : null;
    if (opt && (opt.phase === "walk" || opt.phase === "work")) wearOn("opt", 0.35 * n);

    // ECLSS cascade
    let o2 = s.o2 || 80;
    let water = s.water || 40;
    let food = s.food || 50;
    let plants = s.plants || 20;
    const tankBonus = S.builds.tank ? 18 : 0;
    const bedBonus = S.builds.bed ? 1.35 : 1;
    if (!failed("eclss") && !brownout) {
      // scrubber
      if (!failed("scrubber") && pwr > 10) S.co2 = Math.max(4, S.co2 - 1.6 * n);
      else S.co2 = Math.min(80, S.co2 + 1.1 * n * crewN * 0.25);
      // heater/cooler
      if (!failed("heater") && pwr > 8) S.temp += (21 - S.temp) * 0.15 * n;
      else S.temp += ((s.outside ? (sunA > 0 ? 40 : -20) : 8) - S.temp) * 0.04 * n;
      S.pressure = clamp(S.pressure - S.leak * 0.4 * n + (S.builds.hab ? 0.2 * n : 0), 62, 108);
      if (S.wear.eclss > 70) S.leak = Math.min(8, S.leak + 0.02 * n);
    } else {
      S.co2 = Math.min(90, S.co2 + 1.4 * n);
      S.temp += ((sunA > 0 ? 28 : 4) - S.temp) * 0.05 * n;
      S.pressure = clamp(S.pressure - 0.8 * n, 55, 108);
    }
    // O2: crew + EVA consume; hydro + tanks produce
    const eva = s.outside && s.suited ? 1 : 0;
    o2 -= 0.012 * n * crewN + eva * 0.03 * n;
    if (hydroOn && !brownout) o2 += 0.025 * n * bedBonus;
    if (S.co2 > 45) o2 -= 0.04 * n;
    if (S.pressure < 78) o2 -= 0.05 * n;
    o2 = clamp(o2, 0, 100);
    water -= 0.018 * n * crewN;
    if (hydroOn) water -= 0.04 * n * bedBonus;
    if (isruRun) water -= 0.05 * n;
    if (foundHas(s, "ice-pour") && S.iceRes > 0 && water < 30) {
      const take = Math.min(S.iceRes, 0.4 * n);
      S.iceRes -= take;
      water += take * 1.4;
    }
    water = clamp(water, 0, 100 + tankBonus);
    // Food / waste
    food -= 0.014 * n * crewN;
    if (hydroOn && plants > 20) {
      plants = Math.min(100, plants + 0.35 * n * bedBonus);
      if (plants > 55) {
        food = Math.min(100, food + 0.06 * n * bedBonus);
      }
    } else plants = Math.max(2, plants - 0.08 * n);
    S.waste = clamp(S.waste + 0.05 * n * crewN - (pwr > 18 && !failed("eclss") ? 0.08 * n : 0), 0, 100);
    if (S.waste > 88) {
      S.co2 += 0.3 * n;
      water = Math.max(0, water - 0.08 * n);
    }
    food = clamp(food, 0, 100);

    // Propellant production (ice + power → LH2/LOX → prop)
    if (isruRun) {
      const take = Math.min(S.iceRes, 0.55 * n);
      S.iceRes -= take;
      S.lh2 = clamp(S.lh2 + take * 0.42, 0, S.tankCap + tankBonus);
      S.lox = clamp(S.lox + take * 0.78, 0, S.tankCap + tankBonus);
      const mix = Math.min(S.lh2, S.lox * 0.5) * 0.15 * n;
      if (mix > 0) {
        S.lh2 -= mix * 0.4;
        S.lox -= mix * 0.8;
        S.prop = clamp(S.prop + mix * 2.2, 0, S.tankCap + tankBonus);
      }
      addFound("isru-1");
    }

    // Transfer: hose connected to LTV or tanks
    if (S.hose === "ltv" && S.prop > 0.2 && pwr > 10 && !failed("pump")) {
      const give = Math.min(S.prop, 1.6 * n);
      S.prop -= give;
      patch({ ltvBatt: Math.min(100, (s.ltvBatt || 0) + give * 1.8) });
      S.hoseT += n;
    } else if (S.hose === "tank" && (fh().ore || S.ore) && false) {
      S.hoseT += n;
    }
    if (S.hose && failed("pump")) S.hose = "";

    // Factory: remote ore + local ore → hopper (foothold) → mill → refined → press → bricks/parts
    if (remoteRun && S.remote.power > 6) {
      S.remote.ore += 0.55 * n;
      S.remote.power = clamp(S.remote.power + (sunA > 0.1 ? 0.4 * n : -0.15 * n), 0, 100);
      S.remote.haul += n;
    } else if (S.remote.on) {
      S.remote.power = clamp(S.remote.power + (sunA > 0.1 ? 0.25 * n : -0.1 * n), 0, 100);
    }

    // Mill byproduct → refined/parts when mill chews
    if (millOn) {
      S.refined += 0.12 * n;
      if (S.refined > 1.2) {
        S.refined -= 1.2;
        S.parts += 0.15;
      }
    }

    // Construction progress if assigned work nearby
    PADS.forEach((p) => {
      if (S.builds[p.id]) return;
      const prog = S.buildProg[p.id] || 0;
      if (prog > 0 && prog < 1) {
        const worker = nearCrew(p.x, p.z, 6) || S.hauler.job === "build" && dist(S.hauler.x, S.hauler.z, p.x, p.z) < 6;
        if (worker && pwr > 8) {
          S.buildProg[p.id] = Math.min(1, prog + 0.08 * n);
          if (S.buildProg[p.id] >= 1) {
            S.builds[p.id] = true;
            rebuildPad(p.id);
            refreshColliders();
            addFound("build-" + p.id);
            sayJob(p.title + " is up. it is on the grid.", "bricks and parts. not a menu.", 7);
            radioSpeak("Hale", p.title + " holds. I can live with that.");
          }
        }
      }
    });

    // Crew needs + tasks
    tickCrew(n, s, pwr, o2, food, water);
    tickHauler(n, s, pwr);
    tickInspector(n, s);
    tickRemoteHaul(n, s);

    // Push coupled resources into the game store (slow, so Vi and we coexist)
    const p = {
      power: pwr,
      o2,
      water,
      food,
      plants,
      co2: S.co2,
    };
    if (S.builds.solar) p.solar = Math.min(100, Math.max(s.solar || 40, (s.solar || 40) + 0.02));
    patch(p);

    if (o2 < 18 && performance.now() - lastAlarmAt > 8000) alarm("oxygen is thin");
    if (S.pressure < 72 && performance.now() - lastAlarmAt > 8000) alarm("hull pressure is walking off");
    if (pwr < 8 && performance.now() - lastAlarmAt > 8000) alarm("bus is brown");
    if (S.ticks - lastSave > 4) {
      lastSave = S.ticks;
      save();
    }
  }

  function nearCrew(x, z, r) {
    return Object.values(S.crew).some((c) => !c.inside && dist(c.x, c.z, x, z) < r);
  }

  function tickCrew(n, s, pwr, o2, food, water) {
    const hour = s.hour || 0;
    const night = Math.cos((hour / 708) * Math.PI * 2) < 0;
    const jobs = {
      Hale: night ? { x: -0.8, z: 1.8, inside: true, deck: 3, task: "sleep" } : hydroOnSafe(s) ? { x: FARM.x + 0.8, z: FARM.z, inside: false, deck: 1, task: "hydro" } : { x: 0.2, z: 1.8, inside: true, deck: 2, task: "ops" },
      Rook: { x: -0.5, z: 2.1, inside: true, deck: 2, task: "comms" },
      Voss: foundHas(s, "lab-pad") || true ? (night ? { x: 1.1, z: -1.2, inside: true, deck: 3, task: "sleep" } : { x: 0.9, z: -1.6, inside: true, deck: 3, task: "lab" }) : { x: 0.9, z: -1.6, inside: true, deck: 3, task: "lab" },
      Pike: night ? { x: 1.6, z: -0.4, inside: true, deck: 3, task: "sleep" } : S.remote.on && S.remote.mode !== "idle" ? { x: REMOTE.x - 3, z: REMOTE.z + 2, inside: false, deck: 1, task: "eva-mine" } : { x: PAD.x + 1.2, z: PAD.z - 0.6, inside: false, deck: 1, task: "eva" },
      Quinn: { x: MAST.x + 1.4, z: MAST.z + 0.8, inside: false, deck: 1, task: "mast" },
    };
    if (failed("eclss") || o2 < 20) {
      Object.keys(jobs).forEach((k) => {
        jobs[k] = { x: 0.1, z: 1.4, inside: true, deck: 2, task: "shelter" };
      });
    }
    Object.keys(S.crew).forEach((k) => {
      const c = S.crew[k];
      const j = jobs[k];
      c.task = j.task;
      c.inside = j.inside;
      c.deck = j.deck;
      c.x += (j.x - c.x) * Math.min(1, 0.55 * n);
      c.z += (j.z - c.z) * Math.min(1, 0.55 * n);
      c.hung = clamp(c.hung + 0.35 * n - (food > 12 ? 0.5 * n : 0), 0, 100);
      c.thirst = clamp(c.thirst + 0.4 * n - (water > 10 ? 0.55 * n : 0), 0, 100);
      c.fat = clamp(c.fat + (j.task === "sleep" ? -1.2 * n : 0.25 * n) + (o2 < 25 ? 0.8 * n : 0) + (pwr < 10 ? 0.2 * n : 0), 0, 100);
      if (c.task === "hydro" && (s.plants || 0) < 90) patch({ plants: Math.min(100, (s.plants || 0) + 0.08 * n) });
      if (c.task === "eva-mine" && S.remote.on) S.remote.ore += 0.08 * n;
    });
    if (performance.now() - lastCrewSay > 28000 && s.play) {
      lastCrewSay = performance.now();
      const tired = Object.entries(S.crew).find(([, c]) => c.fat > 70 || c.hung > 75);
      if (tired) radioSpeak(tired[0], tired[1].hung > 75 ? "Galley's thin. I can still work." : "I'm cooked. Not quitting.");
      else if (S.remote.on) radioSpeak("Pike", "Remote pit's still cutting.");
      else if (S.isruOn) radioSpeak("Hale", "ISRU's drinking ice. Tanks are taking it.");
    }
  }
  function hydroOnSafe(s) {
    return (s.water || 0) > 8 && foundHas(s, "ice-pour");
  }

  function tickHauler(n, s, pwr) {
    const h = S.hauler;
    if (failed("hauler") || pwr < 6) {
      h.job = "idle";
      h.batt = Math.max(0, h.batt - 0.05 * n);
      return;
    }
    h.batt = clamp(h.batt - (h.job === "idle" ? 0.02 : 0.18) * n, 0, 100);
    if (h.batt < 12) {
      h.job = "charge";
    }
    const dests = {
      idle: HAUL_DOCK,
      charge: { x: PAD.x + 3.2, z: PAD.z - 2.2 },
      mine: MINE,
      hopper: HOPPER,
      remote: REMOTE,
      yard: YARD,
      build: nearestBuild(),
    };
    if (h.job === "idle") {
      if (S.remote.on && S.remote.ore > 2 && h.batt > 30) h.job = "remote";
      else if (((fh().ore || 0) + S.ore) > 0.5 && h.batt > 25) h.job = "mine";
      else if (Object.keys(S.buildProg).some((k) => S.buildProg[k] > 0 && S.buildProg[k] < 1) && h.batt > 20) h.job = "build";
    }
    const d = dests[h.job] || HAUL_DOCK;
    const dx = d.x - h.x, dz = d.z - h.z;
    const dd = Math.hypot(dx, dz) || 1;
    const spd = 2.6 * n;
    if (dd > 0.7) {
      h.x += (dx / dd) * spd;
      h.z += (dz / dd) * spd;
    } else {
      if (h.job === "mine") {
        const take = Math.min(3, (fh().ore || 0) + S.ore);
        if (take > 0) {
          S.ore = Math.max(0, S.ore - take);
          if (fh().ore) fh().ore = Math.max(0, fh().ore - take);
          h.load += take;
          h.job = "hopper";
        } else h.job = "idle";
      } else if (h.job === "remote") {
        const take = Math.min(4, S.remote.ore);
        S.remote.ore -= take;
        h.load += take;
        h.job = "hopper";
      } else if (h.job === "hopper") {
        if (window.__laFoothold && fh()) fh().hopper = (fh().hopper || 0) + h.load;
        S.ore += h.load * 0.15;
        patch({ millFill: Math.min(1, (s.millFill || 0) + h.load * 0.08) });
        h.load = 0;
        h.job = "idle";
        addFound("haul-1");
      } else if (h.job === "charge") {
        if (dist(h.x, h.z, PAD.x, PAD.z) < 8 && (s.power || 0) > 12) h.batt = Math.min(100, h.batt + 8 * n);
        if (h.batt > 80) h.job = "idle";
      } else if (h.job === "build") h.job = "idle";
    }
  }
  function nearestBuild() {
    let best = HAUL_DOCK, bestD = 999;
    PADS.forEach((p) => {
      const prog = S.buildProg[p.id] || 0;
      if (prog > 0 && prog < 1) {
        const d = dist(S.hauler.x, S.hauler.z, p.x, p.z);
        if (d < bestD) {
          bestD = d;
          best = p;
        }
      }
    });
    return best;
  }
  function tickInspector(n, s) {
    const ins = S.inspector;
    ins.t += n;
    const sites = [MILL, FARM, ISRU, TANKS, REMOTE, { x: -18, z: 16 }];
    const i = Math.floor(ins.t / 14) % sites.length;
    const d = sites[i];
    ins.x += (d.x - ins.x) * Math.min(1, 0.4 * n);
    ins.z += (d.z - ins.z) * Math.min(1, 0.4 * n);
    ins.batt = clamp(ins.batt - 0.08 * n, 0, 100);
    if (ins.batt < 15) {
      ins.x += (PAD.x - ins.x) * 0.3 * n;
      ins.z += (PAD.z - ins.z) * 0.3 * n;
      if ((s.power || 0) > 10) ins.batt += 6 * n;
    }
    if (dist(ins.x, ins.z, d.x, d.z) < 2.5 && ins.t % 14 < n * 2) {
      const map = ["mill", "pump", "isru", "isru", "remote", "md"];
      const m = map[i];
      if (S.wear[m] > 55 && !S.failed[m] && Math.random() < 0.4) {
        sayJob("inspector flagged " + m + ". wear " + Math.round(S.wear[m]) + ".", "it walked the machine. not a light.", 5);
      }
    }
  }
  function tickRemoteHaul(n, s) {
    if (!S.remote.on) return;
    if (S.remote.mode === "haul" && S.remote.ore > 1) {
      S.hauler.job = S.hauler.job === "idle" ? "remote" : S.hauler.job;
    }
    if ((s.comms || 70) < 18 || failed("remote")) {
      if (S.remote.mode === "extract") {
        S.remote.mode = "fault";
        alarm("remote mine dropped off the bus");
      }
    }
  }

  /* ---------- Interactions ---------- */
  function tryUse() {
    const s = st();
    const a = api();
    if (!s || !a || s.paused || !s.play) return false;
    if (s.cine >= 0 && s.cine != null) return false;
    if (optNear(s) || lemsNear(s) || millNear(s)) return false;
    const px = s.px, pz = s.pz;

    if (s.outside && dist(px, pz, ISRU.x, ISRU.z) < 3.6) {
      if (failed("isru")) return repair("isru");
      if (s.held === "ice" || (S.iceRes < 2 && foundHas(s, "ice-bag"))) {
        if (s.held === "ice") patch({ held: "none" });
        S.iceRes = Math.min(30, S.iceRes + 6);
        S.isruOn = true;
        save();
        addFound("isru-1");
        sayJob("ISRU took the ice. power in, propellant out.", "mapped crater feeds the tanks.", 7);
        radioSpeak("Hale", "That's the chain. Ice to gas. Don't waste the bus.");
        return true;
      }
      S.isruOn = !S.isruOn;
      if (S.iceRes < 0.2) S.isruOn = false;
      sayJob(S.isruOn ? "ISRU running. tanks will take hydrogen and oxygen." : "ISRU idle. it wants ice and power.", "electrolysis is not a rumor.", 6);
      return true;
    }
    if (s.outside && dist(px, pz, TANKS.x, TANKS.z) < 3.2) {
      sayJob("propellant tanks. LH2 " + Math.round(S.lh2) + "  LOX " + Math.round(S.lox) + "  mix " + Math.round(S.prop) + ".", "ISRU fills them. the skid transfers.", 5);
      return true;
    }
    if (s.outside && dist(px, pz, XFER.x, XFER.z) < 3.0) {
      if (failed("pump")) return repair("pump");
      if (!S.hose) {
        S.hose = "ltv";
        sayJob("umbilical on the buggy tap. pumps will move mix.", "stand here. it's a transfer, not a number.", 6);
        radioSpeak("Rook", "Copy. Hose is live.");
      } else {
        S.hose = "";
        sayJob("umbilical stowed. " + Math.round(S.prop) + " still in the tanks.", "valve closed.", 5);
      }
      save();
      return true;
    }
    if (s.outside && dist(px, pz, REMOTE.x, REMOTE.z) < 5.4) {
      if (!S.remote.on) {
        if (S.parts < 1 || bricks() < 1) {
          sayJob("remote pit wants a brick and a part before it cuts.", "deploy the site. then it works without you.", 6);
          return true;
        }
        spendBricks(1);
        S.parts -= 1;
        S.remote.on = true;
        S.remote.mode = "extract";
        S.wear.remote = Math.max(S.wear.remote, 4);
        addFound("remote-1");
        save();
        sayJob("remote pit is live. it will cut while you're on the porch.", "power, comms, haul. it can fail.", 7);
        radioSpeak("Pike", "Pit's up. I'll keep an eye from the pad.");
        return true;
      }
      if (failed("remote") || S.remote.mode === "fault") return repair("remote");
      const order = ["extract", "haul", "idle"];
      S.remote.mode = order[(order.indexOf(S.remote.mode) + 1) % order.length];
      sayJob("remote mine: " + S.remote.mode + ". ore " + Math.round(S.remote.ore) + ".", "it keeps cutting if the bus holds.", 6);
      save();
      return true;
    }
    if (s.outside && dist(px, pz, HAUL_DOCK.x, HAUL_DOCK.z) < 3.2) {
      if (failed("hauler")) return repair("hauler");
      if (S.hauler.job === "idle") S.hauler.job = S.remote.on ? "remote" : "mine";
      else S.hauler.job = "idle";
      sayJob("hauler " + S.hauler.job + ". battery " + Math.round(S.hauler.batt) + ".", "it moves ore. you don't have to.", 5);
      return true;
    }
    // Construction pads
    for (let i = 0; i < PADS.length; i++) {
      const p = PADS[i];
      if (dist(px, pz, p.x, p.z) > 3.4) continue;
      if (S.builds[p.id]) {
        sayJob(p.title + " is on the grid.", "it holds. it draws the bus.", 4);
        return true;
      }
      const prog = S.buildProg[p.id] || 0;
      if (prog > 0 && prog < 1) {
        S.buildProg[p.id] = Math.min(1, prog + 0.22);
        rebuildPad(p.id);
        if (S.buildProg[p.id] >= 1) {
          S.builds[p.id] = true;
          refreshColliders();
          addFound("build-" + p.id);
          sayJob(p.title + " seated.", "you tamped it. the grid felt that.", 7);
        } else sayJob("tamping " + p.label + ". " + Math.round(S.buildProg[p.id] * 100) + "%.", "bricks already spent.", 6);
        save();
        return true;
      }
      if (bricks() < p.costB || S.parts < p.costP) {
        sayJob(p.title + " wants " + p.costB + " bricks and " + p.costP + " parts.", "mill, press, then place.", 6);
        return true;
      }
      spendBricks(p.costB);
      S.parts -= p.costP;
      S.buildProg[p.id] = 0.12;
      rebuildPad(p.id);
      addFound("build-start");
      save();
      sayJob("pad staked for " + p.label + ". tamp it or let the hauler finish.", "construction is physical.", 7);
      radioSpeak("Hale", "That's a floor. Don't walk away from a wet brick.");
      return true;
    }
    // Repair any nearby failed / high-wear machine
    const repairSites = [
      ["mill", MILL, 3.8],
      ["isru", ISRU, 3.4],
      ["pump", XFER, 2.8],
      ["md", { x: -16.2, z: 13.4 }, 3.5],
      ["remote", REMOTE, 5],
      ["hauler", { x: S.hauler.x, z: S.hauler.z }, 2.6],
      ["eclss", HAB, 4.2],
      ["solar", FARM, 4.5],
    ];
    for (let i = 0; i < repairSites.length; i++) {
      const [id, pos, r] = repairSites[i];
      if (dist(px, pz, pos.x, pos.z) < r && (failed(id) || (S.wear[id] || 0) > 60)) return repair(id);
    }
    return false;
  }
  function repair(id) {
    if (S.parts < 1) {
      sayJob("no spare parts. press a brick or wait the mill.", id + " still wants a look.", 6);
      return true;
    }
    S.parts -= 1;
    S.wear[id] = Math.max(6, (S.wear[id] || 40) - 38);
    S.failed[id] = false;
    if (id === "remote" && S.remote.mode === "fault") S.remote.mode = "extract";
    save();
    addFound("repair-1");
    sayJob(id + " reseated. wear " + Math.round(S.wear[id]) + ".", "parts from the press. not magic.", 6);
    radioSpeak("Rook", "Copy. " + id + " is back on the bus.");
    return true;
  }

  function onKey(e) {
    if (e.repeat) return;
    if (e.code === "KeyE" || e.code === "KeyF") {
      if (tryUse()) e.stopPropagation();
    }
  }

  function tickVisuals(dt, s) {
    if (!root) return;
    if (meshes.drill) meshes.drill.rotation.y += dt * (S.remote.mode === "extract" ? 9 : 0.4);
    if (meshes.remoteFill) meshes.remoteFill.scale.y = clamp(0.12 + S.remote.ore / 12, 0.12, 1.1);
    if (meshes.iceBin) meshes.iceBin.scale.y = clamp(0.3 + S.iceRes / 20, 0.3, 1.2);
    if (meshes.lh2) meshes.lh2.scale.y = clamp(0.35 + S.lh2 / 40, 0.35, 1.15);
    if (meshes.lox) meshes.lox.scale.y = clamp(0.35 + S.lox / 40, 0.35, 1.15);
    if (meshes.prop) meshes.prop.scale.y = clamp(0.3 + S.prop / 40, 0.3, 1.2);
    if (meshes.isruLight && meshes.isruLight.material) meshes.isruLight.material.emissiveIntensity = S.isruOn ? 0.7 : 0.08;
    if (meshes.pump) meshes.pump.rotation.y += dt * (S.hose || S.isruOn ? 5 : 0.3);
    if (hoseMesh) hoseMesh.visible = !!S.hose;
    if (haulerG) {
      haulerG.position.x += (S.hauler.x - haulerG.position.x) * 0.2;
      haulerG.position.z += (S.hauler.z - haulerG.position.z) * 0.2;
      const dx = S.hauler.x - haulerG.position.x, dz = S.hauler.z - haulerG.position.z;
      if (Math.hypot(dx, dz) > 0.04) haulerG.rotation.y = Math.atan2(dx, dz);
    }
    if (inspectG) {
      inspectG.position.x += (S.inspector.x - inspectG.position.x) * 0.15;
      inspectG.position.z += (S.inspector.z - inspectG.position.z) * 0.15;
    }
    Object.keys(crewG).forEach((k) => {
      const c = S.crew[k];
      const g = crewG[k];
      if (!c || !g) return;
      const y = c.inside ? (c.deck - 1) * 2.15 : 0;
      g.position.x += (c.x - g.position.x) * 0.12;
      g.position.z += (c.z - g.position.z) * 0.12;
      g.position.y += (y - g.position.y) * 0.12;
      g.visible = true;
    });
    PADS.forEach((p) => {
      const g = ghostG[p.id];
      if (!g) return;
      g.visible = true;
    });
    if (meshes.remoteBeacon && meshes.remoteBeacon.material) {
      meshes.remoteBeacon.material.emissive = meshes.remoteBeacon.material.emissive || { r: 0.7, g: 0.2, b: 0.15 };
    }
  }

  function hintTick(s) {
    if (!s || !s.play || s.outside === undefined) return;
    if (optNear(s) || lemsNear(s)) {
      setHint("");
      return;
    }
    const px = s.px, pz = s.pz;
    if (s.outside && dist(px, pz, ISRU.x, ISRU.z) < 3.6) setHint(failed("isru") ? "E — repair ISRU" : "E — ISRU  ice in / run");
    else if (s.outside && dist(px, pz, TANKS.x, TANKS.z) < 3.2) setHint("propellant tanks");
    else if (s.outside && dist(px, pz, XFER.x, XFER.z) < 3.0) setHint(S.hose ? "E — stow umbilical" : "E — connect transfer hose");
    else if (s.outside && dist(px, pz, REMOTE.x, REMOTE.z) < 5.4) setHint(S.remote.on ? "E — command remote mine" : "E — deploy remote pit");
    else if (s.outside && dist(px, pz, HAUL_DOCK.x, HAUL_DOCK.z) < 3.2) setHint("E — assign hauler");
    else {
      let hit = false;
      for (let i = 0; i < PADS.length; i++) {
        const p = PADS[i];
        if (dist(px, pz, p.x, p.z) < 3.4) {
          setHint(S.builds[p.id] ? p.title : "E — build " + p.label);
          hit = true;
          break;
        }
      }
      if (!hit) setHint("");
    }
  }

  function maybeReset(s) {
    if (!s) return;
    if (s.play && !wasPlay && (!s.found || s.found.length < 2)) {
      S = defaults();
      save();
      PADS.forEach((p) => rebuildPad(p.id));
      refreshColliders();
    }
    wasPlay = !!s.play;
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
      if (s && s.play && !window.__laPlayAt) window.__laPlayAt = now;
      if (s && !s.play) window.__laPlayAt = 0;
      const readyOut = !!(s && s.play && s.outside);
      const away = readyOut && Math.hypot(s.px || 0, s.pz || 0) > 12;
      if (away && !window.__laOutAt) window.__laOutAt = now;
      if (!root && a && s && away && window.__laOutAt && now - window.__laOutAt > 400) buildWorld();
      if (s && a) {
        maybeReset(s);
        wrapSpeech();
        simTick(dt, s);
        tickVisuals(dt, s);
        hintTick(s);
        paintBoard(s);
      }
    } catch (err) {
      if (!window.__laSettleErr) window.__laSettleErr = String(err && err.message ? err.message : err);
    }
  }

  function boot() {
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", unlockAudio, { once: true });
    document.addEventListener("keydown", unlockAudio, { once: true });
    document.addEventListener("visibilitychange", () => {
      if (audio && document.visibilityState === "visible" && audio.state === "suspended") audio.resume();
      save();
    });
    window.addEventListener("pagehide", save);
    requestAnimationFrame(frame);
    window.__laSettle = {
      sites: { ISRU, TANKS, XFER, REMOTE, HAUL_DOCK, PADS },
      get state() {
        return S;
      },
      use: tryUse,
      save,
      reset() {
        S = defaults();
        save();
      },
      built() {
        return !!root;
      },
      colliders() {
        return colliders.slice();
      },
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
