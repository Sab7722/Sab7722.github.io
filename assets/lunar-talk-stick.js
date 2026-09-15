/**
 * Lunar Ascent — walk-up radio. One crew answers what you asked.
 * No unsolicited chatter. Does not steal Optimus E.
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

  function whoOf(q) {
    if (/\bhale\b/.test(q)) return "Hale";
    if (/\brook\b/.test(q)) return "Rook";
    if (/\bvoss\b/.test(q)) return "Voss";
    if (/\bpike\b/.test(q)) return "Pike";
    return window.__laTalkWho === "Hale" ? "Hale" : "Rook";
  }

  function lockLine(s, who) {
    const held = (s && s.held) || "none";
    const hale = who === "Hale";
    if (s && s.airlock && s.airlock !== "idle") {
      return hale
        ? "It's equalizing. Stand in the lock. When the lamp changes, walk through."
        : "Lock is cycling. Don't walk off the threshold or it aborts.";
    }
    if (s && s.donning > 0) {
      return hale
        ? "Your pack is still latching. Wait for the visor, then the hatch."
        : "Suit's still sealing. Visor first, then E on the hatch.";
    }
    if (s && !s.suited && !s.outside) {
      return hale
        ? "The lock will not cycle shirtsleeves. Orange rack by the hatch. E, wait, then the hatch."
        : "You're not in a suit. Orange rack by the airlock, E, wait for the visor, then face the round hatch and E.";
    }
    if (held && held !== "none" && /crate|feed|paver/.test(held)) {
      return hale
        ? "Put the " + held + " down. We don't pump cargo through the lock."
        : "Drop the " + held + " first. Lock won't cycle with cargo in your hands.";
    }
    if (s && typeof s.power === "number" && s.power < 18) {
      return hale
        ? "Not enough bus to run the pumps. Arrays first, then the hatch."
        : "Bus is too thin to pump the lock. Wipe the arrays east of the hatch.";
    }
    if (s && s.storm > 0.45) {
      return hale
        ? "We're sealed until this blow passes. Don't force the hatch."
        : "Storm lock. Pumps can't fight that dust. Wait it out.";
    }
    if (s && s.outside && typeof s.o2 === "number" && s.o2 < 22) {
      return hale
        ? "Pack is thin. Face the hatch from the pad and come in."
        : "Pack's low. Hatch on the hab wall, E, come in.";
    }
    if (s && s.outside) {
      return hale
        ? "You're already out. Ingress is the round hatch on the hull, not the rover."
        : "You're EVA. Face the round hatch on the hab, wait for the prompt, E.";
    }
    if (s && s.suited && !s.outside) {
      return hale
        ? "You're sealed. Look at the hatch, not the rack. E, then walk through while it equalizes."
        : "Suited. Face the round hatch until the prompt, E, wait, then walk through. Don't mash it from the pad.";
    }
    return hale
      ? "Suit, hatch, equalize. In that order."
      : "Suit, then hatch, then E. Dust stays outside.";
  }

  function answer(asked, world, live) {
    const q = String(asked || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!q) return null;
    const s = live || st() || world || {};
    const who = whoOf(q);
    const hale = who === "Hale";
    let text = "";

    if (/airlock|air lock|\block\b|hatch|eva|cycle|go outside|go out|can't leave|cant leave|won't open|wont open/.test(q)) {
      text = lockLine(s, who);
    } else if (/suit|visor|helmet|pack/.test(q)) {
      text = s.suited
        ? hale
          ? "Pack is on. Hatch is next."
          : "Pack's on. Face the hatch and E."
        : hale
          ? "Orange suit on the rack by the lock. E and wait until the visor finishes."
          : "Rack by the airlock. Walk up, E, wait for the visor.";
    } else if (/power|array|solar|bus|battery|dusty|dirty/.test(q)) {
      text =
        (s.solar || 0) < 42 || /dirty|dust/.test(q)
          ? hale
            ? "Dust on the arrays is why the cabin goes hungry. East of the hatch — wipe them, then the bus comes back."
            : "If they look dirty, they are. Walk east of the hatch and wipe them. Thin bus is dust, not a dead pile."
          : hale
            ? "Power is holding. If the lock still sulks, it's suit or hatch, not the arrays."
            : "Arrays are holding. If the lock sulks, it's suit or hatch, not power.";
    } else if (/what should i|what do i|what next|job|stuck|help me|what now/.test(q)) {
      text = s.job
        ? hale
          ? "Right now: " + s.job + (s.why ? " " + s.why : "")
          : "Do this: " + s.job + (s.why ? " — " + s.why : "")
        : hale
          ? "Keep the cabin breathing. Suit, hatch, arrays. Then we look at the rock."
          : "Suit. Hatch. Arrays. Unless I said otherwise.";
    } else if (/where are you|who are you|name/.test(q)) {
      text = hale
        ? "Hale. Science loop. I'm in the hab if you want a real answer."
        : "Rook. I keep the bus. You walked up, so talk.";
    } else if (/hello|hi\b|hey|status|report|how are you/.test(q)) {
      text = hale
        ? s.outside
          ? "I hear you. Don't linger. Pack and hatch."
          : "Hale. Cabin is quiet. Ask me something that has a name: lock, peg, mill, ice."
        : s.outside
          ? "You're EVA. I keep the bus. Ask if something is actually broken."
          : "Cabin is mine. Ask a real question.";
    } else if (/ice|water|hydro|mill|peg|litho|voss|pike|lems|ltv|rover/.test(q)) {
      text = hale
        ? s.job
          ? "On that: " + s.job + (s.why ? " " + s.why : "") + " I care about the rock after you can breathe."
          : "Name the site. Ice, peg, mill, litho — I'll tell you what I know. Don't wander the dark with a thin pack."
        : s.job
          ? "Copy. " + s.job + (s.why ? " — " + s.why : "") + " I keep the bus while you walk it."
          : "If it's broken, name it. I keep the bus. Hale keeps the ears.";
    } else {
      text = hale
        ? "I heard you. Ask about the lock, the arrays, the peg, the mill, or the ice — I'll answer that, not a speech."
        : "Copy. Name what's broken: lock, suit, power, hatch. I don't guess.";
    }

    return { who, text, rook: who === "Rook" ? text : "", hale: who === "Hale" ? text : "" };
  }

  window.__laCrewAsk = function (asked, world, live) {
    try {
      return answer(asked, world, live && live.getState ? live.getState() : live);
    } catch {
      return { who: "Rook", text: "Copy. Say that again.", rook: "Copy. Say that again.", hale: "" };
    }
  };

  let lastAsk = "";
  let lastAskAt = 0;
  function pushAsk(asked) {
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
      const who = (a && a.who) || "Rook";
      const line = (a && a.text) || (who === "Hale" ? a && a.hale : a && a.rook);
      if (line) g.pushTalk && g.pushTalk(who, line);
      g.setTalkBusy && g.setTalkBusy(false);
    } catch {}
    return true;
  }
  window.__laAskCrew = pushAsk;

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
          pushAsk(v);
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
      pushAsk(v);
      input.value = "";
      try {
        input.dispatchEvent(new Event("input", { bubbles: true }));
      } catch {}
    },
    true
  );
})();
