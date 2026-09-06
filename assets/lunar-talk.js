/**
 * Lunar Ascent — Hale & Rook actually answer the radio.
 * Diagnoses airlock, suit, power, hatch. Does not steal Optimus E.
 */
(function lunarTalk() {
  if (window.__laTalk) return;
  window.__laTalk = true;

  function store() {
    return window.__laStore || (window.__controlsTest && window.__controlsTest.store) || null;
  }
  function st() {
    const Y = store();
    return Y && Y.getState ? Y.getState() : null;
  }

  function lockWhy(s) {
    const held = (s && s.held) || "none";
    if (s && s.airlock && s.airlock !== "idle") {
      return {
        rook: "Lock is cycling. Stand still. If you walk off, it aborts.",
        hale: "Equalizing. Wait for the hatch lamp. Then the pad.",
      };
    }
    if (s && s.donning > 0) {
      return {
        rook: "Suit is still sealing. Wait for the visor. Then face the hatch and E.",
        hale: "Do not cycle while the pack is still latching.",
      };
    }
    if (s && !s.suited && !s.outside) {
      return {
        rook: "You are in shirtsleeves. Orange suit on the rack by the airlock first. Walk up, E, wait for the visor. Then face the round hatch and E again.",
        hale: "The lock will not open for an unsuited body. That is the whole point of the lock.",
      };
    }
    if (held && held !== "none" && /crate|feed|paver/.test(held)) {
      return {
        rook: "Drop the " + held + " first. The lock will not cycle with cargo in your hands.",
        hale: "Unload. Feedstock and pavers stay this side.",
      };
    }
    if (s && typeof s.power === "number" && s.power < 18) {
      return {
        rook: "Bus is too thin to pump the lock. Clear the arrays, then cycle.",
        hale: "We spend power to equalize. Dusty arrays, no hatch.",
      };
    }
    if (s && s.storm > 0.45) {
      return {
        rook: "Storm lock. Pumps can't fight that dust. Wait it out.",
        hale: "Sealed until the blow passes. Do not force it.",
      };
    }
    if (s && s.outside && typeof s.o2 === "number" && s.o2 < 22) {
      return {
        rook: "Pack is thin. Face the hatch from the pad and E. Come in.",
        hale: "Ingress now. Science can wait.",
      };
    }
    if (s && s.outside) {
      return {
        rook: "You are already EVA. Face the round hatch on the hab wall, wait for the prompt, then E. Do not stand out on the pad and mash it.",
        hale: "Ingress is the hatch, not the rover. Look at the lock.",
      };
    }
    if (s && s.suited && !s.outside) {
      return {
        rook: "You are suited. Face the round hatch in the wall until the prompt comes up, then E. Wait while it equalizes. Do not walk off.",
        hale: "Look at the hatch, not the rack. E cycles it. Count two breaths.",
      };
    }
    return {
      rook: "Suit, then hatch, then E. Dust stays outside. That is the lock.",
      hale: "Rack suit. Hatch. Equalize. In that order.",
    };
  }

  function answer(asked, world, live) {
    const q = String(asked || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!q) return null;
    const s = live || st() || world || {};
    const toHale = /\bhale\b/.test(q);
    const toRook = /\brook\b/.test(q);
    const lockQ = /airlock|air lock|\block\b|hatch|eva|cycle/.test(q);
    const whyQ = /why|not work|doesn't work|doesnt work|won't|wont|can't|cant|broken|stuck|ignore|help|how|fix/.test(q);

    let hale = "";
    let rook = "";

    if (lockQ || (whyQ && /suit|hatch|door|outside|pad/.test(q))) {
      const w = lockWhy(s);
      rook = w.rook;
      hale = w.hale;
      if (whyQ && lockQ && (s.suited || s.outside || (s.airlock && s.airlock !== "idle"))) {
        try {
          if (typeof window.__laCycleLock === "function") window.__laCycleLock();
        } catch {}
      }
    } else if (/suit|visor|helmet|pack/.test(q)) {
      rook = s.suited
        ? "Pack is on. Hatch next. E on the lock."
        : "Orange suit on the rack by the airlock. Walk up, E, wait until the visor finishes.";
      hale = s.suited ? "Good. Now the hatch." : "The rack, not the hatch. Seal first.";
    } else if (/power|array|solar|bus|battery/.test(q)) {
      rook =
        (s.solar || 0) < 42
          ? "Arrays are dirty. That is why the bus is thin. Walk east of the hatch and wipe them."
          : "Arrays are holding. If the lock still sulks, it is suit or hatch, not power.";
      hale = "Power is solar plus batteries. No pile. Dust is the enemy.";
    } else if (/job|what do|what should|next|stuck/.test(q)) {
      rook = s.job
        ? "Do this: " + s.job + (s.why ? " — " + s.why : "")
        : "Suit. Hatch. Arrays. In that order unless I said otherwise.";
      hale = s.job ? "Rook has the bus. I want the science after you can breathe." : "Keep the cabin breathing. Then we look.";
    } else if (/hello|hi\b|hey|status|report/.test(q)) {
      rook = s.outside
        ? "You are EVA. I keep the bus. Don't linger."
        : "Cabin is mine. Ask a real question.";
      hale = "Hale. Science loop. Speak.";
    } else if (toHale && !toRook) {
      hale = s.outside
        ? "I hear you. Come back through the lock if the pack thins."
        : "Ask me about the lock, the peg, the mill, or the ice. I will answer.";
      rook = "";
    } else if (toRook && !toHale) {
      rook = "Copy. Suit, hatch, arrays, then talk. What is actually broken.";
      hale = "";
    } else {
      rook = s.outside
        ? "Copy. I keep the bus. If the lock is the problem, face the hatch and E."
        : "Copy. If something is broken, name it. Lock, suit, power, hatch.";
      hale = "Say the system. Airlock, arrays, peg, mill. I do not guess.";
    }

    if (toHale && !hale) hale = "Hale. Go ahead.";
    if (toRook && !rook) rook = "Rook. Go ahead.";
    if (!toHale && !toRook) {
      if (!rook) rook = "Copy. I keep the bus.";
      if (!hale) hale = "Hale. I am on the loop.";
    }
    return { rook, hale };
  }

  window.__laCrewAsk = function (asked, world, live) {
    try {
      return answer(asked, world, live && live.getState ? live.getState() : live);
    } catch {
      return {
        rook: "Copy. Face the hatch, E to cycle. Suit first.",
        hale: "Name the fault. I will answer.",
      };
    }
  };

  let lastAsk = "";
  let lastAskAt = 0;
  function pushBoth(asked) {
    const now = performance.now();
    const Y = store();
    if (!Y || !Y.getState) return false;
    const g = Y.getState();
    const text = String(asked || "").trim();
    if (!text) return false;
    if (text === lastAsk && now - lastAskAt < 450) return true;
    lastAsk = text;
    lastAskAt = now;
    try {
      g.pushTalk && g.pushTalk("you", text);
    } catch {}
    const a = window.__laCrewAsk(text, null, g);
    try {
      if (a && a.rook) g.pushTalk("Rook", a.rook);
      if (a && a.hale) {
        g.pushTalk("Hale", a.hale);
        g.say && g.say("Hale", a.hale);
      }
      g.setTalkBusy && g.setTalkBusy(false);
    } catch {}
    return true;
  }
  window.__laAskCrew = pushBoth;

  function openTalk() {
    const Y = store();
    if (!Y || !Y.getState) return;
    try {
      Y.getState().setTalkOpen && Y.getState().setTalkOpen(true);
    } catch {
      try {
        Y.setState({ talkOpen: true, talkBusy: false });
      } catch {}
    }
  }

  document.addEventListener(
    "keydown",
    (e) => {
      const tag = (e.target && e.target.tagName) || "";
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      const s = st();
      if (e.code === "KeyT" && s && s.play && s.screen === "play" && !typing) {
        e.preventDefault();
        openTalk();
        return;
      }
      if (e.code === "Enter" && typing && s && s.talkOpen) {
        const el = e.target;
        const v = (el.value || "").trim();
        if (v) {
          e.preventDefault();
          e.stopPropagation();
          pushBoth(v);
          el.value = "";
          try {
            el.dispatchEvent(new Event("input", { bubbles: true }));
          } catch {}
        }
      }
    },
    true
  );

  document.addEventListener(
    "submit",
    (e) => {
      const form = e.target;
      if (!form || !form.querySelector) return;
      const input = form.querySelector("input");
      if (!input) return;
      const ph = (input.getAttribute("placeholder") || "").toLowerCase();
      if (!/hale|rook|talk|ask/.test(ph) && !st()?.talkOpen) return;
      const v = (input.value || "").trim();
      if (!v) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      pushBoth(v);
      input.value = "";
      try {
        input.dispatchEvent(new Event("input", { bubbles: true }));
      } catch {}
    },
    true
  );
})();
