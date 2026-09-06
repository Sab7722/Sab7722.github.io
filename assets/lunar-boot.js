/**
 * Lunar Ascent — input bootstrap.
 * Title buttons + WASD. Does not steal Optimus / LEMS E.
 */
(function lunarBoot() {
  if (window.__laBoot) return;
  window.__laBoot = true;

  try {
    const proto = Element.prototype;
    if (typeof proto.setPointerCapture === "function" && !proto.__laPtrCap) {
      proto.__laPtrCap = true;
      const cap = proto.setPointerCapture;
      proto.setPointerCapture = function (id) {
        try {
          return cap.call(this, id);
        } catch (err) {}
      };
      const rel = proto.releasePointerCapture;
      if (typeof rel === "function") {
        proto.releasePointerCapture = function (id) {
          try {
            return rel.call(this, id);
          } catch (err) {}
        };
      }
    }
  } catch (err) {}

  try {
    const proto = HTMLElement.prototype;
    if (typeof proto.requestPointerLock === "function" && !proto.__laRpl) {
      proto.__laRpl = true;
      const orig = proto.requestPointerLock;
      proto.requestPointerLock = function (...args) {
        try {
          if (!this.isConnected || this.ownerDocument !== document) return Promise.resolve();
          const ret = orig.apply(this, args);
          if (ret && typeof ret.then === "function") return ret.catch(function () {});
          return ret;
        } catch (err) {
          return Promise.resolve();
        }
      };
    }
    if (typeof document.exitPointerLock === "function" && !document.__laEpl) {
      document.__laEpl = true;
      const ex = document.exitPointerLock.bind(document);
      document.exitPointerLock = function () {
        try {
          const ret = ex();
          if (ret && typeof ret.then === "function") return ret.catch(function () {});
          return ret;
        } catch (err) {}
      };
    }
  } catch (err) {}

  try {
    const w = console.warn.bind(console);
    console.warn = function (...a) {
      const s = a[0] != null ? String(a[0]) : "";
      if (/PCFSoftShadowMap has been deprecated|THREE\.Clock: This module has been deprecated/.test(s)) return;
      return w(...a);
    };
  } catch (err) {}

  const OPT = 2.55;
  const LEMS = { x: 13, z: -24 };
  const held = Object.create(null);
  let lastStartAt = 0;
  let spawnFix = 0;
  let lastOut = false;
  let lastAir = "idle";

  function store() {
    return window.__laStore || (window.__controlsTest && window.__controlsTest.store) || null;
  }
  function st() {
    const Y = store();
    return Y && Y.getState ? Y.getState() : null;
  }
  function dist(ax, az, bx, bz) {
    return Math.hypot((ax || 0) - bx, (az || 0) - bz);
  }
  function optNear(s) {
    const t = window.__controlsTest;
    const o = t && t.getOpt ? t.getOpt() : null;
    return !!(o && s && dist(s.px, s.pz, o.x, o.z) < OPT);
  }
  function lemsNear(s) {
    return !!(s && dist(s.px, s.pz, LEMS.x, LEMS.z) < 3.4);
  }
  function nearSouthHatch(s) {
    if (!s) return false;
    const px = s.px || 0;
    const pz = s.pz || 0;
    return Math.abs(px) < 1.45 && pz < -1.85 && Math.hypot(px, pz) < 6.8;
  }
  function keepHatchOpen(ms) {
    const until = performance.now() + (ms || 8000);
    const cur = typeof window.__laHatchOpen === "number" ? window.__laHatchOpen : 0;
    window.__laHatchOpen = Math.max(cur, until);
  }
  function patchShadowMap() {
    if (window.__laPcf) return;
    try {
      const canvas = document.querySelector("canvas");
      const fiber = canvas && canvas.__r3f;
      const st = fiber && typeof fiber.getState === "function" ? fiber.getState() : fiber;
      const gl = st && st.gl;
      const sm = gl && gl.shadowMap;
      if (!sm) return;
      window.__laPcf = true;
      try {
        sm.type = 1;
      } catch (err) {}
      try {
        let cur = 1;
        Object.defineProperty(sm, "type", {
          configurable: true,
          get() {
            return cur === 2 ? 1 : cur;
          },
          set(v) {
            cur = v === 2 ? 1 : v;
          },
        });
      } catch (err) {}
    } catch (err) {}
  }

  function fireReact(el) {
    if (!el) return false;
    const pk = Object.keys(el).find((k) => k.startsWith("__reactProps"));
    const props = pk ? el[pk] : null;
    if (!props) return false;
    const ev = {
      preventDefault() {},
      stopPropagation() {},
      nativeEvent: { preventDefault() {}, stopPropagation() {} },
      target: el,
      currentTarget: el,
      type: "pointerdown",
      button: 0,
      buttons: 1,
    };
    try {
      if (typeof props.onPointerDown === "function") props.onPointerDown(ev);
    } catch {}
    try {
      if (typeof props.onClick === "function") props.onClick(ev);
    } catch {}
    return true;
  }

  function labelOf(el) {
    return ((el && (el.innerText || el.textContent)) || "").replace(/\s+/g, " ").trim();
  }

  function startPlay(fresh) {
    const now = performance.now();
    if (lastStartAt > 0 && now - lastStartAt < 350) return;
    lastStartAt = now;
    const Y = store();
    if (!Y || !Y.getState) return;
    const g = Y.getState();
    const has = !!(g.started || (g.found && g.found.length) || (g.notes && g.notes.length));
    try {
      if (fresh || !has) {
        if (typeof g.beginFromStart === "function") g.beginFromStart();
        else if (typeof g.startGame === "function") g.startGame(true);
      } else if (typeof g.startGame === "function") {
        g.startGame(false);
      }
    } catch {}
    try {
      Y.setState({
        started: true,
        play: true,
        screen: "play",
        cine: -1,
        cineFresh: false,
        paused: false,
        talkOpen: false,
        airlock: "idle",
        lockT: 0,
        donning: 0,
        seated: false,
        vehicle: "walk",
      });
    } catch {}
    spawnFix = 18;
    try {
      window.focus();
    } catch {}
  }

  function watchIntro() {
    const Y = store();
    try {
      window.__mbaWatch = true;
      window.__mbaWatchSnap = localStorage.getItem("mba-v1");
    } catch {
      window.__mbaWatch = true;
    }
    try {
      if (Y && Y.getState && Y.getState().startCine) Y.getState().startCine(true);
      if (Y) Y.setState({ screen: "intro", cine: 0, play: true, paused: false, cineFresh: true });
    } catch {}
  }

  function openSettings() {
    const Y = store();
    try {
      if (Y && Y.getState && Y.getState().openSettings) Y.getState().openSettings();
      else if (Y) Y.setState({ screen: "settings" });
    } catch {}
  }

  function actTitle(label, el) {
    const l = (label || "").toLowerCase();
    if (l === "start" || l === "continue") {
      startPlay(false);
      return true;
    }
    if (l === "new game") {
      const g = st();
      const has = !!(g && (g.started || (g.found && g.found.length)));
      if (has) {
        fireReact(el);
        return true;
      }
      startPlay(true);
      return true;
    }
    if (l === "erase and start") {
      startPlay(true);
      return true;
    }
    if (l === "keep save") {
      fireReact(el);
      return true;
    }
    if (l === "watch intro") {
      watchIntro();
      return true;
    }
    if (l === "settings") {
      openSettings();
      return true;
    }
    if (l === "back") {
      const Y = store();
      try {
        if (Y && Y.getState && Y.getState().closeSettings) Y.getState().closeSettings();
        else if (Y) Y.setState({ screen: "home" });
      } catch {}
      return true;
    }
    return false;
  }

  function onPointer(e) {
    const el =
      (e.target && e.target.closest && e.target.closest("button, [role=button], .title-menu")) ||
      null;
    if (!el) return;
    const label = labelOf(el);
    if (!label) return;
    const isMenu = /^(Start|Continue|New game|Watch intro|Settings|Back|Erase and start|Keep save)$/i.test(
      label
    );
    if (!isMenu) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    actTitle(label, el);
  }

  document.addEventListener("pointerdown", onPointer, true);
  document.addEventListener("click", onPointer, true);
  document.addEventListener(
    "touchend",
    (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      const t = e.changedTouches[0];
      const hit = document.elementFromPoint(t.clientX, t.clientY);
      const btn = hit && hit.closest ? hit.closest("button, [role=button]") : null;
      if (!btn) return;
      onPointer({
        target: btn,
        preventDefault() {
          try {
            e.preventDefault();
          } catch {}
        },
        stopImmediatePropagation() {
          try {
            e.stopPropagation();
          } catch {}
        },
      });
    },
    { capture: true, passive: false }
  );

  function syncKeys() {
    const t = window.__controlsTest;
    if (!t || !t.setKeys) return;
    t.setKeys(Object.keys(held).filter((k) => held[k]));
  }

  function onKey(e) {
    const down = e.type === "keydown";
    const tag = (e.target && e.target.tagName) || "";
    const s0 = st();
    if (tag === "INPUT" || tag === "TEXTAREA" || (s0 && s0.talkOpen && tag !== "BODY" && tag !== "")) {
      if (down && e.code === "Escape" && s0 && s0.setTalkOpen) s0.setTalkOpen(false);
      return;
    }
    if (s0 && s0.talkOpen && (e.code === "KeyW" || e.code === "KeyA" || e.code === "KeyS" || e.code === "KeyD")) {
      return;
    }
    if (e.repeat && e.code !== "KeyE") {
      if (down) held[e.code] = true;
      return;
    }
    held[e.code] = down;
    if (e.code === "ArrowUp") held.KeyW = down;
    if (e.code === "ArrowDown") held.KeyS = down;
    if (e.code === "ArrowLeft") held.KeyA = down;
    if (e.code === "ArrowRight") held.KeyD = down;

    const s = st();
    if (down && s && (s.screen === "home" || (!s.play && (s.cine | 0) < 0))) {
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        startPlay(false);
        return;
      }
    }
    syncKeys();
    if (down && (e.code === "KeyE" || e.code === "KeyF") && (optNear(s) || lemsNear(s))) return;
    if (
      down &&
      e.code === "KeyE" &&
      s &&
      s.play &&
      s.screen === "play" &&
      !s.talkOpen &&
      !s.paused &&
      (s.cine | 0) < 0 &&
      s.suited &&
      !(s.donning > 0) &&
      nearSouthHatch(s) &&
      (!s.airlock || s.airlock === "idle")
    ) {
      try {
        e.preventDefault();
        e.stopImmediatePropagation();
      } catch (err) {}
      keepHatchOpen(12000);
      try {
        if (s.outside) s.useAct("enter");
        else s.useAct("eva");
      } catch (err) {}
    }
  }
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("keyup", onKey, true);
  window.addEventListener("blur", () => {
    for (const k of Object.keys(held)) held[k] = false;
    syncKeys();
  });

  function tick() {
    requestAnimationFrame(tick);
    try {
      patchShadowMap();
      const Y = store();
      const s = Y && Y.getState ? Y.getState() : null;
      const t = window.__controlsTest;
      if (!s) return;
      if (s.play && s.screen === "play" && spawnFix > 0) {
        spawnFix--;
        if (s.airlock && s.airlock !== "idle") {
          spawnFix = 0;
        } else {
          const has = s.found && s.found.length;
          if (!has) {
            const need = s.outside || Math.hypot(s.px || 0, s.pz || 0) < 1.05 || Math.abs((s.pz || 0) + 1.48) < 0.05;
            if (need || spawnFix > 12) {
              Y.setState({
                outside: false,
                suited: false,
                px: 2.72,
                pz: 0.15,
                heading: 1.2,
                airlock: "idle",
                lockT: 0,
                donning: 0,
                seated: false,
                vehicle: "walk",
              });
              if (t && t.setPos) t.setPos(2.72, 0.15);
              if (spawnFix === 17 && t && t.setLook) t.setLook(1.2, -0.05);
            }
          }
        }
      }
      if (!s.play || s.paused || s.screen === "home" || s.screen === "settings") return;
      if (s.airlock && s.airlock !== "idle") keepHatchOpen(10000);
      else if (nearSouthHatch(s) && s.suited) {
        const r = Math.hypot(s.px || 0, s.pz || 0);
        if (r < 5.5) keepHatchOpen(6000);
      }
      const rNow = Math.hypot(s.px || 0, s.pz || 0);
      const now = performance.now();
      if (s.airlock === "egress") {
        if (!window.__laEvaT) window.__laEvaT = now;
        keepHatchOpen(10000);
        if (now - window.__laEvaT > 2200) {
          try {
            store().setState({ outside: true, airlock: "idle", lockT: 0, vehicle: "walk" });
          } catch (err) {}
          if (t && t.setPos) t.setPos(0, -14);
          if (t && t.setLook) t.setLook(0, -0.05);
          window.__laEvaT = 0;
        }
      } else {
        window.__laEvaT = 0;
      }
      if (s.airlock === "ingress") {
        if (!window.__laInT) window.__laInT = now;
        keepHatchOpen(10000);
        if (now - window.__laInT > 2200) {
          try {
            store().setState({ outside: false, airlock: "idle", lockT: 0, vehicle: "walk" });
          } catch (err) {}
          if (t && t.setPos) t.setPos(0, -1.5);
          window.__laInT = 0;
        }
      } else {
        window.__laInT = 0;
      }
      if (s.outside && !lastOut) {
        if (rNow < 10 && t && t.setPos) t.setPos(0, -14);
        if (t && t.setLook) t.setLook(0, -0.05);
        keepHatchOpen(8000);
      }
      lastOut = !!s.outside;
      lastAir = s.airlock || "idle";
      if (!s.outside) window.__laFacedOut = false;
      const want = held.KeyW || held.KeyS || held.KeyA || held.KeyD;
      if (want) syncKeys();
    } catch {}
  }
  requestAnimationFrame(tick);

  const css = document.createElement("style");
  css.textContent =
    "button.title-menu,[role=button].title-menu{position:relative;z-index:2147483647;pointer-events:auto!important;touch-action:manipulation;cursor:pointer}";
  document.documentElement.appendChild(css);
  try {
    window.focus();
  } catch {}
})();
