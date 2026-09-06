/**
 * Lunar Ascent — input bootstrap.
 * Title buttons + WASD. Does not steal Optimus / LEMS E.
 */
(function lunarBoot() {
  if (window.__laBoot) return;
  window.__laBoot = true;

  const OPT = 2.55;
  const LEMS = { x: 13, z: -24 };
  const held = Object.create(null);
  let lastStartAt = 0;
  let spawnFix = 0;

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
