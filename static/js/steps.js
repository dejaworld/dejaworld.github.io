// The step-by-step version of the film (#recall): one real prediction in five steps, laid out as the film lays them
// out (homepage/tools/film/film.html in the wm-ttt workspace is the reference; its content area, x 72..1848 and
// y 290..1030 of the 1920 x 1080 frame, is this stage). Data: static/recall/recall.js, written by
// wm-ttt/homepage/tools/film_search.py web_assets from the film's own assets.
// Every element sits on a 1776 x 740 stage in percent; a step sets every element's place and CSS moves it there.
(function () {
  "use strict";
  var root = document.getElementById("recall");
  var data = window.DEJA_RECALL;
  if (!root || !data) return;
  var stage = root.querySelector(".rc-stage");
  var caption = root.querySelector(".rc-caption");
  var buttons = root.querySelectorAll(".rc-steps button");
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 1776, H = 740;
  var TYPE = 1.14; // type is set a little larger than in the film: the stage is narrower than the film's frame
  var CAPTIONS = [
    "A new query: given the current frame and the next 16 actions, predict the resulting video.",
    "Retrieve: a learned selector scores every chunk in the bank and picks the ones that help most.",
    "Read: they become context. From them, the model reads what its actions mean.",
    "Predict: then it generates the future. No calibration, no fine-tuning.",
    "Record: the finished episode joins the bank, ready to help the next prediction.",
  ];
  var ZOOM_MS = 3800; // one zoomed chunk in Retrieve
  var DIR = "static/recall/";

  // ---- helpers ----
  function el(cls, html) {
    var e = document.createElement("div");
    e.className = "rc-el" + (cls ? " " + cls : "");
    if (html !== undefined) e.innerHTML = html;
    stage.appendChild(e);
    return e;
  }
  function place(e, r) {
    if (r.x !== undefined) e.style.left = (r.x / W) * 100 + "%";
    if (r.y !== undefined) e.style.top = (r.y / H) * 100 + "%";
    if (r.w !== undefined) e.style.width = (r.w / W) * 100 + "%";
    if (r.h !== undefined) e.style.height = (r.h / H) * 100 + "%";
  }
  function show(e, on) { e.classList.toggle("off", !on); }
  function size(e, px) { e.style.fontSize = (px * TYPE / W) * 100 + "cqw"; } // stage px -> container width units
  function video(src, poster) {
    var v = document.createElement("video");
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "metadata";
    v.src = DIR + src;
    v.poster = DIR + poster;
    return v;
  }
  function play(v, restart, rate) {
    if (still) return;
    if (restart && v.readyState) v.currentTime = 0;
    v.playbackRate = rate || 1;
    v.play().catch(function () {});
  }
  function stop(v) { v.pause(); }
  function sym(letter, sub) { return '<i class="rc-math">' + letter + "</i><sub>" + sub + "</sub>"; }
  function thick(L) { // the film's thick arrow, L stage px long and 44 across
    return '<svg viewBox="0 0 ' + L + ' 44" aria-hidden="true"><path class="shaft" d="M7 22H' + (L - 28) + '" /><path class="head" d="M' +
      (L - 30) + " 6L" + (L - 5) + " 22L" + (L - 30) + ' 38Z" /></svg>';
  }

  // ---- layout (stage px; the film's numbers moved by (-72, -290)) ----
  var LABEL_Y = 20, ROW_Y = 54;
  var Q = { x: 24, y: ROW_Y, w: 552, h: 414 }; // the anchor frame from Retrieve on
  var Y0 = 60; // the first step is centred on the stage
  var CARD = { x: 24, y: 28 + Y0, w: 1040, h: 564 };
  var A_BIG = { x: CARD.x + 54, y: CARD.y + 90, w: 504, h: 378 };
  var GOAL = { x: W - 24 - 24 - 472, y: A_BIG.y + 24, w: 472, h: 354 }; // front frame of a pile of three
  var QS = { x: 24, y: ROW_Y, w: 320, h: 240 }; // the anchor frame in Predict
  var BANK = { x: 612, y: ROW_Y, w: 1140, cols: 4, gap: 20 };
  BANK.tw = (BANK.w - (BANK.cols - 1) * BANK.gap) / BANK.cols;
  BANK.th = BANK.tw * 0.75;
  function slot(i) {
    return { x: BANK.x + (i % BANK.cols) * (BANK.tw + BANK.gap), y: BANK.y + Math.floor(i / BANK.cols) * (BANK.th + BANK.gap), w: BANK.tw, h: BANK.th };
  }
  var PANEL = { x: 842, y: 10, w: 680, h: 668 };
  var ZOOM = { x: PANEL.x + 20, y: PANEL.y + 20, w: 640, h: 480 };
  // the context as the paper writes a sequence: chunks 1, 2, 3, an ellipsis, the most recent one
  var NP = data.picks.length, CW = (BANK.w - 60 - (NP + 1) * 20) / (NP + 1), CH = CW * 0.75;
  function rowRect(j) { return { x: BANK.x + j * (CW + 20) + (j === NP ? 80 : 0), y: ROW_Y, w: CW, h: CH }; }
  var PILE = { x: 24, y: QS.y + 350, w: 320, h: 240, step: 14 }; // Predict: the same chunks as a pile under the query
  function pileRect(j) { return { x: PILE.x + j * PILE.step, y: PILE.y - j * PILE.step, w: PILE.w, h: PILE.h }; }
  var MID = (QS.y + PILE.y + PILE.h) / 2;
  var WM = { x: 652, y: MID, r: 66 };
  var PW = 446, PH = PW * 0.75;
  var PRED = { x: W - 24 - 2 * PW - 24, y: MID - PH / 2, w: PW, h: PH };
  var GT = { x: W - 24 - PW, y: MID - PH / 2, w: PW, h: PH };
  // tokens a_t+1, a_t+2, ..., a_t+16: a large row on the query card, a small row under the anchor frame, and a
  // column beside it in Predict
  function tokenPlace(step, k) {
    if (step === 0) return { x: A_BIG.x + A_BIG.w + 48 + [0, 112, 224, 280][k], y: A_BIG.y + (A_BIG.h - 84) / 2, w: k === 2 ? 44 : 100, h: 84, font: 36 };
    if (step === 3) return { x: QS.x + QS.w + 16, y: QS.y + 42 + [0, 44, 88, 120][k], w: 104, h: k === 2 ? 22 : 36, font: 19 };
    return { x: Q.x + [0, 106, 212, 250][k], y: Q.y + Q.h + 12, w: k === 2 ? 30 : 98, h: 38, font: 20 };
  }

  // ---- elements ----
  var card = el("rc-card");
  place(card, CARD);
  var qBig = el("rc-title rc-accent", "Query");
  place(qBig, { x: A_BIG.x, y: CARD.y + 20 });
  size(qBig, 40);
  var qSmall = el("rc-label", "Query");
  var anchor = el("rc-media rc-anchor", '<img src="' + DIR + 'query.jpg" alt="" width="640" height="480">');
  var capAnchor = el("rc-cap", sym("I", "t") + " <span>anchor frame</span>");
  place(capAnchor, { x: A_BIG.x, y: A_BIG.y + A_BIG.h + 16, w: A_BIG.w });
  var tokens = ["t+1", "t+2", null, "t+16"].map(function (sub) {
    return sub === null ? el("rc-dots rc-tokdots", "…") : el("rc-tok", "<span>" + sym("a", sub) + "</span>");
  });
  var capTokens = el("rc-cap", "<span>16 future actions</span>");
  place(capTokens, { x: tokenPlace(0, 0).x, y: tokenPlace(0, 0).y + 84 + 18, w: 380 });
  var arrowPredict = el("rc-thin", '<svg viewBox="0 0 156 30" aria-hidden="true"><path d="M2 15H140" /><path class="head" d="M138 6L154 15L138 24Z" /></svg>');
  place(arrowPredict, { x: CARD.x + CARD.w + 18, y: A_BIG.y + A_BIG.h / 2 - 15, w: GOAL.x - 18 - (CARD.x + CARD.w + 18), h: 30 });
  var capPredict = el("rc-cap rc-accent rc-strong", "predict");
  place(capPredict, { x: CARD.x + CARD.w + 18, y: A_BIG.y + A_BIG.h / 2 - 50, w: GOAL.x - 18 - (CARD.x + CARD.w + 18) });
  size(capPredict, 24);
  var futureLabel = el("rc-title", "Future video");
  place(futureLabel, { x: GOAL.x, y: CARD.y + 27 });
  size(futureLabel, 30);
  var goal = [2, 1, 0].map(function (k) { // a pile of empty frames, the rear ones up and to the right
    var g = el("rc-hole", k === 0 ? "<span>?</span>" : "");
    place(g, { x: GOAL.x + 12 * k, y: GOAL.y - 12 * k, w: GOAL.w, h: GOAL.h });
    return g;
  });
  var capGoal = el("rc-cap", sym("I", "t+1") + ", …, " + sym("I", "t+16") + " <span>the resulting video</span>");
  place(capGoal, { x: GOAL.x, y: A_BIG.y + A_BIG.h + 16, w: GOAL.w });
  [capAnchor, capTokens, capGoal].forEach(function (c) { size(c, 27); });

  var bankLabel = el("rc-label", 'Experience bank · <b class="rc-count">' + data.bank + "</b> episodes · " + data.chunks.toLocaleString("en-US") + " chunks");
  place(bankLabel, { x: BANK.x, y: LABEL_Y });
  var count = bankLabel.querySelector(".rc-count");
  var slotOf = {};
  data.layout.forEach(function (tile, s) { slotOf[tile] = s; });
  var tiles = [];
  for (var i = 0; i < data.tiles; i += 1) {
    var t = el("rc-tile", '<img src="' + DIR + "bank_" + (i < 10 ? "0" : "") + i + '.jpg" alt="" width="320" height="240" loading="lazy">');
    place(t, slot(slotOf[i]));
    tiles.push(t);
  }
  var emptySlot = el("rc-slot", "<span>This episode</span>");
  place(emptySlot, slot(data.tiles));
  size(emptySlot, 23);
  var joined = el("rc-tile rc-joined", '<img src="' + DIR + 'bank_new.jpg" alt="" width="320" height="240">');
  place(joined, slot(data.tiles));
  var badges = data.picks.map(function (p, n) {
    var b = el("rc-badge", String(n + 1));
    var r = slot(slotOf[p.tile]);
    place(b, { x: r.x + 10, y: r.y + 10 });
    return b;
  });

  var panel = el("rc-panel");
  place(panel, PANEL);
  var zoom = el("rc-media rc-zoom");
  var zoomVideos = data.picks.map(function (p, n) {
    var v = video("pick_" + n + ".mp4", "pick_" + n + ".jpg");
    zoom.appendChild(v);
    return v;
  });
  var zBadge = el("rc-badge rc-zbadge", "1");
  place(zBadge, { x: ZOOM.x + 14, y: ZOOM.y + 14 });
  var zHead = el("rc-zhead");
  place(zHead, { x: ZOOM.x + 6, y: ZOOM.y + ZOOM.h + 18 });
  size(zHead, 38);
  var zDetail = el("rc-zdetail");
  place(zDetail, { x: ZOOM.x + 6, y: ZOOM.y + ZOOM.h + 76 });
  size(zDetail, 23);
  var zNote = el("rc-znote");
  place(zNote, { x: ZOOM.x + 6, y: ZOOM.y + ZOOM.h + 114 });
  size(zNote, 23);

  var ctxLabel = el("rc-label", "Context");
  var ctx = [];
  for (var n = 0; n <= NP; n += 1) {
    var box = el("rc-media rc-ctx");
    var v = n < NP ? video("pick_" + n + ".mp4", "pick_" + n + ".jpg") : video("recent.mp4", "recent.jpg");
    box.appendChild(v);
    var tag = document.createElement("span");
    tag.className = n < NP ? "rc-num" : "rc-recent";
    tag.textContent = n < NP ? String(n + 1) : "most recent";
    box.appendChild(tag);
    box.style.zIndex = String(4 + NP - n); // in the pile chunk 1 is the front frame
    ctx.push({ box: box, video: v });
  }
  var ctxDots = el("rc-dots", "…");
  place(ctxDots, { x: BANK.x + NP * (CW + 20), y: ROW_Y, w: 60, h: CH });
  size(ctxDots, 56);

  var A1 = { x: QS.x + QS.w + 16 + 104 + 18, w: WM.x - WM.r - 14 - (QS.x + QS.w + 16 + 104 + 18) };
  var A2 = { x: WM.x + WM.r + 14, w: PRED.x - 14 - (WM.x + WM.r + 14) };
  var arrowIn = el("rc-thick", thick(A1.w));
  place(arrowIn, { x: A1.x, y: MID - 22, w: A1.w, h: 44 });
  var globe = el("rc-globe", '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="47" /><ellipse cx="50" cy="50" rx="21" ry="47" />' +
    '<path d="M50 3V97M3 50H97M10.5 26Q50 40 89.5 26M10.5 74Q50 60 89.5 74" /></svg>');
  place(globe, { x: WM.x - WM.r, y: WM.y - WM.r, w: 2 * WM.r, h: 2 * WM.r });
  var globeLabel = el("rc-cap rc-wm", "World Model");
  place(globeLabel, { x: WM.x - 130, y: WM.y + WM.r + 14, w: 260 });
  size(globeLabel, 25);
  var arrowOut = el("rc-thick", thick(A2.w));
  place(arrowOut, { x: A2.x, y: MID - 22, w: A2.w, h: 44 });
  var predLabel = el("rc-label rc-accent", "Prediction");
  place(predLabel, { x: PRED.x, y: PRED.y - 34 });
  var gtLabel = el("rc-label", "Ground truth");
  place(gtLabel, { x: GT.x, y: GT.y - 34 });
  var placeholder = el("rc-hole", "<span>?</span>");
  place(placeholder, PRED);
  var pred = el("rc-media rc-out");
  var predVideo = video("pred.mp4", "pred.jpg");
  pred.appendChild(predVideo);
  place(pred, PRED);
  var gt = el("rc-media rc-out");
  var gtVideo = video("gt.mp4", "gt.jpg");
  gt.appendChild(gtVideo);
  place(gt, GT);

  var flyer = el("rc-media rc-flyer", '<img src="' + DIR + 'query.jpg" alt="" width="640" height="480">');

  // ---- steps ----
  var timers = [];
  function later(ms, fn) { timers.push(setTimeout(fn, still ? 0 : ms)); }
  function clearLater() { timers.forEach(clearTimeout); timers = []; }

  function setZoom(n, open) {
    // the zoomed chunk grows out of its bank tile into the panel, then shrinks back
    var r = slot(slotOf[data.picks[n].tile]);
    zoomVideos.forEach(function (v, k) { v.style.display = k === n ? "block" : "none"; });
    if (open) {
      zoom.classList.add("instant");
      place(zoom, r);
      show(zoom, true);
      void zoom.offsetWidth; // start the growth from the tile
      zoom.classList.remove("instant");
      place(zoom, ZOOM);
      zBadge.textContent = String(n + 1);
      zHead.textContent = data.picks[n].reason;
      zDetail.textContent = data.picks[n].detail;
      zNote.textContent = data.picks[n].note;
      zNote.classList.toggle("rc-accent", data.picks[n].note.indexOf("Different") === 0);
      [panel, zBadge, zHead, zDetail, zNote].forEach(function (e) { show(e, true); });
      play(zoomVideos[n], true, 1.25);
    } else {
      [panel, zBadge, zHead, zDetail, zNote].forEach(function (e) { show(e, false); });
      place(zoom, r);
      later(560, function () { show(zoom, false); stop(zoomVideos[n]); });
      tiles[data.picks[n].tile].classList.add("hit");
      show(badges[n], true);
    }
  }

  function setPhase(p) {
    clearLater();
    Array.prototype.forEach.call(buttons, function (b, k) { b.setAttribute("aria-selected", k === p ? "true" : "false"); });
    caption.textContent = CAPTIONS[p];
    stage.dataset.phase = String(p);

    // query: the card in the first step, the anchor frame and its tokens after
    [card, qBig, capAnchor, capTokens, arrowPredict, capPredict, futureLabel, capGoal].concat(goal).forEach(function (e) { show(e, p === 0); });
    var a = p === 0 ? A_BIG : p === 3 ? QS : Q;
    place(anchor, a);
    place(qSmall, { x: a.x, y: a.y - 34 });
    show(qSmall, p !== 0);
    tokens.forEach(function (tk, k) {
      var r = tokenPlace(p, k);
      place(tk, r);
      size(tk, r.font);
      if (k === 2) tk.textContent = p === 3 ? "⋮" : "…";
    });

    // bank: Retrieve and Record
    var bankOn = p === 1 || p === 4;
    show(bankLabel, bankOn);
    tiles.forEach(function (tl) { show(tl, bankOn); tl.classList.remove("hit"); });
    badges.forEach(function (b) { show(b, false); });
    show(emptySlot, bankOn);
    show(joined, false);
    show(flyer, false);
    count.textContent = String(data.bank);
    count.classList.remove("grown");
    show(panel, false);
    show(zoom, false);
    [zBadge, zHead, zDetail, zNote].forEach(function (e) { show(e, false); });
    zoomVideos.forEach(stop);
    stage.classList.toggle("picking", p === 1);

    // context: a row in Read; in Predict the same chunks slide under the query and stack, the rear frame first
    var ctxOn = p === 2 || p === 3;
    place(ctxLabel, p === 3 ? { x: PILE.x, y: pileRect(NP).y - 34 } : { x: BANK.x, y: LABEL_Y });
    show(ctxLabel, ctxOn);
    show(ctxDots, p === 2);
    stage.classList.toggle("piled", p === 3);
    ctx.forEach(function (c, n) {
      place(c.box, p === 3 ? pileRect(n) : rowRect(n));
      show(c.box, ctxOn);
      c.box.style.transitionDelay = !ctxOn ? "0s" : p === 2 ? n * 0.16 + "s" : (NP - n) * 0.14 + "s";
      if (p === 2) play(c.video, true); else stop(c.video);
    });

    // predict: the arrows, the world model and the prediction arrive in turn
    [arrowIn, globe, globeLabel, arrowOut, predLabel, gtLabel, placeholder, pred, gt].forEach(function (e) { show(e, false); });
    stop(predVideo);
    stop(gtVideo);

    if (p === 1) {
      data.picks.forEach(function (pk, n) {
        var t0 = 900 + n * ZOOM_MS;
        later(t0, function () { setZoom(n, true); });
        later(t0 + ZOOM_MS - 700, function () { setZoom(n, false); });
      });
    }
    if (p === 3) {
      later(700, function () { show(predLabel, true); show(placeholder, true); });
      later(1300, function () { show(arrowIn, true); });
      later(1700, function () { show(globe, true); show(globeLabel, true); });
      later(2200, function () { show(arrowOut, true); });
      later(2700, function () {
        show(placeholder, false);
        show(pred, true);
        show(gt, true);
        show(gtLabel, true);
        play(predVideo, true);
        play(gtVideo, true);
      });
    }
    if (p === 4) {
      // the finished episode flies from the query on the left into the bank's empty slot
      var to = slot(data.tiles);
      flyer.classList.add("instant");
      place(flyer, Q);
      show(flyer, false);
      void flyer.offsetWidth;
      later(700, function () {
        flyer.classList.remove("instant");
        show(flyer, true);
        flyer.classList.add("lift");
        later(260, function () { place(flyer, to); });
      });
      later(2000, function () {
        flyer.classList.remove("lift");
        show(joined, true);
        show(emptySlot, false);
        count.textContent = String(data.bank + 1);
        count.classList.add("grown");
        later(300, function () { show(flyer, false); });
      });
    }
  }

  // steps change only on a click (user, 2026-11-23: no automatic advance); a step's own motion still plays
  Array.prototype.forEach.call(buttons, function (b, k) {
    b.addEventListener("click", function () { setPhase(k); });
  });
  setPhase(still ? 3 : 0);
})();
