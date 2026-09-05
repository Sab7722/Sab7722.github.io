/**
 * Lunar Ascent — input bootstrap.
 * Title buttons + WASD. Does not steal Optimus / LEMS E.
 * After Start, keep the 3D view presenting (no per-frame camera stomp).
 */
(function lunarBoot() {
  if (window.__laBoot) return;
  window.__laBoot = true;

  const OPT = 2.55;
  const LEMS = { x: 13, z: -24 };
  const SPAWN = { x: 2.72, z: 0.15, yaw: 1.2 };
  const held = Object.create(null);
  let lastStartAt = 0;
  let spawnFix = 0;
  let placedLook = false;
  let pendingStart = null;

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

  function kickGL() {
    try {
      const c = document.querySelector("canvas");
      if (!c) return;
      const r3f = c.__r3f;
      const root = r3f && (r3f.root || r3f);
      const getState = root && root.getState;
      const state = typeof getState === "function" ? getState() : r3f;
      if (state && typeof state.invalidate === "function") state.invalidate();
      const gl = state && state.gl;
      if (gl && gl.domElement) {
        gl.domElement.style.display = "block";
        gl.domElement.style.visibility = "visible";
        gl.domElement.style.opacity = "1";
      }
    } catch {}
  }

  function placeSpawn(Y, t, withLook) {
    try {
      Y.setState({
        outside: false,
        suited: false,
        px: SPAWN.x,
        pz: SPAWN.z,
        heading: SPAWN.yaw,
        airlock: "idle",
        lockT: 0,
        donning: 0,
        seated: false,
        vehicle: "walk",
        paused: false,
        cine: -1,
        screen: "play",
      });
    } catch {}
    try {
      if (t && t.setPos) t.setPos(SPAWN.x, SPAWN.z);
      if (withLook && t && t.setLook && !placedLook) {
        t.setLook(SPAWN.yaw, -0.05);
        placedLook = true;
      }
    } catch {}
  }

  function startPlay(fresh) {
    window.__laDbg = { at: "enter", fresh: !!fresh, n: window.__laStartN || 0 };
    const Y = store();
    window.__laDbg.y = !!Y;
    window.__laDbg.gs = !!(Y && Y.getState);
    if (!Y || !Y.getState) {
      pendingStart = fresh;
      window.__laDbg.at = "no-store";
      return;
    }
    const now = performance.now();
    window.__laDbg.now = now;
    window.__laDbg.last = lastStartAt;
    if (lastStartAt > 0 && now - lastStartAt < 350) {
      window.__laDbg.at = "debounce";
      return;
    }
    lastStartAt = now;
    pendingStart = null;
    window.__laStartN = (window.__laStartN || 0) + 1;
    window.__laDbg.at = "queued";
    window.__laDbg.n = window.__laStartN;
    const g = Y.getState();
    const has = !!(g.started || (g.found && g.found.length) || (g.notes && g.notes.length));
    spawnFix = fresh || !has ? 8 : 0;
    placedLook = false;
    const applyPlay = () => {
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
          outside: false,
          suited: false,
          px: SPAWN.x,
          pz: SPAWN.z,
          heading: SPAWN.yaw,
        });
      } catch {}
      try {
        const t = window.__controlsTest;
        if (t && t.setPos) t.setPos(SPAWN.x, SPAWN.z);
        if (t && t.setLook && !placedLook) {
          t.setLook(SPAWN.yaw, -0.05);
          placedLook = true;
        }
      } catch {}
    };
    // Leave the click handler immediately so Start cannot freeze the UI thread.
    setTimeout(() => {
      applyPlay();
      if (fresh) {
        setTimeout(() => {
          try {
            const g2 = Y.getState();
            if (typeof g2.beginFromStart === "function") g2.beginFromStart();
          } catch {}
          applyPlay();
          placeSpawn(Y, window.__controlsTest, true);
        }, 80);
      } else if (has) {
        setTimeout(() => {
          try {
            const g2 = Y.getState();
            if (typeof g2.startGame === "function") g2.startGame(false);
          } catch {}
          applyPlay();
        }, 0);
      }
      try {
        window.focus();
      } catch {}
      try {
        ensureCtl(Y);
      } catch {}
    }, 0);
  }
  window.__laStartPlay = startPlay;


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
    kickGL();
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

  function bindTitle(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("button.title-menu, button, [role=button]").forEach((b) => {
      if (b.__laBound) return;
      const label = labelOf(b);
      if (!/^(Start|Continue|New game|Watch intro|Settings|Back|Erase and start|Keep save)$/i.test(label)) return;
      b.__laBound = true;
      const fire = (e) => {
        try {
          e.preventDefault();
          e.stopImmediatePropagation();
        } catch {}
        actTitle(labelOf(b) || label, b);
      };
      b.addEventListener("pointerdown", fire, true);
      b.addEventListener("click", fire, true);
    });
  }
  try {
    bindTitle(document);
    const mo = new MutationObserver(() => bindTitle(document));
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch {}

  function syncKeys() {
    const t = window.__controlsTest;
    if (!t || !t.setKeys) return;
    t.setKeys(Object.keys(held).filter((k) => held[k]));
  }

  function onKey(e) {
    const down = e.type === "keydown";
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
  }
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("keyup", onKey, true);
  window.addEventListener("blur", () => {
    for (const k of Object.keys(held)) held[k] = false;
    syncKeys();
  });
  document.addEventListener(
    "mousemove",
    (e) => {
      const s = st();
      if (!s || !s.play || s.paused || s.screen !== "play") return;
      const mx = e.movementX || 0;
      const my = e.movementY || 0;
      if (!mx && !my) return;
      const t = window.__controlsTest;
      const yaw0 = t && t.getYaw ? t.getYaw() : s.heading || 0;
      if (t && t.setLook) t.setLook(yaw0 - mx * 0.0024, undefined);
      else {
        const Y = store();
        if (Y) Y.setState({ heading: yaw0 - mx * 0.0024 });
      }
    },
    true
  );

  function ensureCtl(Y) {
    const cur = window.__controlsTest;
    if (cur && cur.setKeys && cur.setPos) return cur;
    const keys = held;
    const ctl = {
      store: Y,
      setKeys(k) {
        for (const c of Object.keys(keys)) keys[c] = false;
        for (const c of k || []) keys[c] = true;
      },
      getSpeed() {
        return window.__laBootSpd || 0;
      },
      getYaw() {
        const s = Y.getState();
        return s.heading || SPAWN.yaw;
      },
      setLook(y, pt) {
        try {
          Y.setState({ heading: y });
        } catch {}
      },
      setPos(x, z) {
        try {
          Y.setState({ px: x, pz: z });
        } catch {}
      },
      snap() {
        const s = Y.getState();
        return { px: s.px, pz: s.pz, heading: s.heading, play: s.play };
      },
      patch: (q) => Y.setState(q),
      startGame: (n) => startPlay(!!n),
    };
    window.__controlsTest = cur ? Object.assign(ctl, cur) : ctl;
    return window.__controlsTest;
  }

  function tick() {
    requestAnimationFrame(tick);
    try {
      const Y = store();
      if (pendingStart !== null && Y && Y.getState) {
        const f = pendingStart;
        pendingStart = null;
        startPlay(f);
        return;
      }
      const s = Y && Y.getState ? Y.getState() : null;
      const playing = !!(s && s.play && s.screen !== "home" && s.screen !== "settings");
      document.documentElement.classList.toggle("la-play", playing);
      if (!s) return;
      const t = playing ? ensureCtl(Y) : window.__controlsTest;
      if (s.play && s.screen === "play" && spawnFix > 0) {
        spawnFix--;
        const has = s.found && s.found.length;
        if (!has) {
          const at = !s.outside && dist(s.px, s.pz, SPAWN.x, SPAWN.z) < 0.8;
          if (!at && spawnFix >= 7) placeSpawn(Y, t, false);
          if (at || (t && t.getSpeed)) spawnFix = 0;
        } else {
          spawnFix = 0;
        }
      }
      if (!s.play || s.paused || s.screen === "home" || s.screen === "settings") return;
      const want = held.KeyW || held.KeyS || held.KeyA || held.KeyD;
      if (want) {
        syncKeys();
        if (s.airlock && s.airlock !== "idle") Y.setState({ airlock: "idle", lockT: 0, donning: 0 });
        const spd = t && t.getSpeed ? Math.abs(t.getSpeed()) : 0;
        if (spd >= 0.35) {
          window.__laBootSpd = spd;
          return;
        }
        const cur = t && t.snap ? t.snap() : s;
        const yaw = t && t.getYaw ? t.getYaw() : s.heading || SPAWN.yaw;
        const step = 0.16;
        const fx = -Math.sin(yaw),
          fz = -Math.cos(yaw);
        const rx = Math.cos(yaw),
          rz = -Math.sin(yaw);
        let dx = 0,
          dz = 0;
        if (held.KeyW) {
          dx += fx;
          dz += fz;
        }
        if (held.KeyS) {
          dx -= fx;
          dz -= fz;
        }
        if (held.KeyD) {
          dx += rx;
          dz += rz;
        }
        if (held.KeyA) {
          dx -= rx;
          dz -= rz;
        }
        const len = Math.hypot(dx, dz) || 1;
        const nx = (cur.px || 0) + (dx / len) * step;
        const nz = (cur.pz || 0) + (dz / len) * step;
        window.__laBootSpd = step / 0.016;
        if (t && t.setPos) t.setPos(nx, nz);
        else Y.setState({ px: nx, pz: nz });
      } else {
        window.__laBootSpd = 0;
      }
    } catch {}
  }
  requestAnimationFrame(tick);

  const css = document.createElement("style");
  css.textContent =
    "button.title-menu,[role=button].title-menu{position:relative;z-index:2147483647;pointer-events:auto!important;touch-action:manipulation;cursor:pointer}" +
    "canvas{display:block!important;visibility:visible!important;opacity:1!important}" +
    "html:not(.la-play) canvas,html:not(.la-play) canvas *{pointer-events:none!important}" +
    "html:not(.la-play) #app,html:not(.la-play) #app *{pointer-events:none!important}";
  document.documentElement.appendChild(css);
  try {
    window.focus();
  } catch {}
})();
