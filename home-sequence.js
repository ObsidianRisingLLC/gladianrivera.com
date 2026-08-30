/**
 * Vanilla JS / GSAP ScrollTrigger port of the Nocturnal Muse home page
 * scroll experience — same frame ranges, fade curves, and stagger timing
 * as the React/Motion version it was built from, just driven imperatively
 * instead of through Motion's useTransform.
 *
 * Requires GSAP + ScrollTrigger loaded before this script runs.
 */
(function () {
  "use strict";

  // This is a 40-frame scroll-scrubbed sequence — every frame is a distinct
  // photo, not just a re-crop of one image. Browsers restore scroll position
  // on reload by default, and they don't apply it just once — they keep
  // re-nudging scrollY back toward the remembered offset as the page's
  // scrollable height grows during load (which happens here once GSAP's
  // pin-spacer is created). A single scrollTo(0,0) loses that race. Setting
  // scrollRestoration to manual plus repeatedly forcing scrollY to 0 for the
  // first second of load reliably out-lasts it, guaranteeing frame 1 (the
  // one with the crystal's tip fully visible) is what always renders.
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);
  (function guardScrollToTop() {
    var elapsed = 0;
    var intervalMs = 50;
    var guardId = setInterval(function () {
      if (window.scrollY !== 0) window.scrollTo(0, 0);
      elapsed += intervalMs;
      if (elapsed >= 1000) clearInterval(guardId);
    }, intervalMs);
  })();

  var FRAME_COUNT = 40;
  var SCROLL_DIST_PER_FRAME = 90; // px of scroll per frame, before pin math
  var MOBILE_BREAKPOINT = 800;
  var EDGE_FADE_FRAMES = 1;

  // ---------- frame-range helpers (mirrors the React rangeWindow/staggerWindow) ----------
  function rangeWindow(start1Indexed, end1Indexed) {
    var start = start1Indexed - 1;
    var end = end1Indexed - 1;
    return [start - EDGE_FADE_FRAMES, start, end, end + EDGE_FADE_FRAMES];
  }
  function staggerWindow(start1Indexed, sharedEnd1Indexed) {
    return rangeWindow(start1Indexed, sharedEnd1Indexed);
  }

  // Piecewise-linear interpolation across 4 keyframe points, clamped at the
  // ends — the same behavior Motion's useTransform gives by default.
  function interp(frameIndex, points, outputs) {
    if (frameIndex <= points[0]) return outputs[0];
    if (frameIndex >= points[3]) return outputs[3];
    for (var i = 0; i < 3; i++) {
      if (frameIndex >= points[i] && frameIndex <= points[i + 1]) {
        var span = points[i + 1] - points[i];
        var t = span === 0 ? 0 : (frameIndex - points[i]) / span;
        return outputs[i] + (outputs[i + 1] - outputs[i]) * t;
      }
    }
    return outputs[3];
  }

  var WELCOME_WIN = rangeWindow(2, 5);
  var TAGLINE_WIN = rangeWindow(6, 9);
  var BIO_WIN = rangeWindow(15, 18);
  var EXPLORE_WIN = rangeWindow(26, 29);

  var TRAIT_STAGGER_START = 19;
  var TRAIT_SHARED_END = 24;
  var TRAIT_WINS = [0, 1, 2, 3].map(function (i) {
    return staggerWindow(TRAIT_STAGGER_START + i, TRAIT_SHARED_END);
  });

  // 5 shard buttons now (was 6) — spread two frames apart instead of one
  // so the reveal stays visually distinct with fewer items to stagger.
  var BUTTON_STAGGER_START = 30;
  var BUTTON_STAGGER_STEP = 2;
  var BUTTON_SHARED_END = 40;
  var NAV_WINS = [0, 1, 2, 3, 4].map(function (i) {
    return staggerWindow(BUTTON_STAGGER_START + i * BUTTON_STAGGER_STEP, BUTTON_SHARED_END);
  });

  // ---------- setup ----------
  var section = document.getElementById("home-sequence");
  var canvas = document.getElementById("home-sequence-canvas");
  var ctx = canvas.getContext("2d");

  var welcomeEl = document.querySelector(".caption-welcome");
  var taglineEl = document.querySelector(".caption-tagline");
  var exploreEl = document.querySelector(".caption-explore");
  var bioCardEl = document.querySelector(".bio-card");
  var traitCardEls = Array.prototype.slice.call(document.querySelectorAll(".trait-card"));
  var navButtonsRowEl = document.querySelector(".nav-buttons-layer");
  var navPillEls = Array.prototype.slice.call(document.querySelectorAll(".nav-pill-wrap"));

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  var basePath = isMobile
    ? "assets/glass-frames/mobile/frame-"
    : "assets/glass-frames/desktop/frame-";

  var images = [];
  var loadedCount = 0;
  var lastDrawnFrame = -1;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function frameSrc(index) {
    var n = String(index + 1);
    if (n.length < 2) n = "0" + n;
    return basePath + n + ".jpg";
  }

  function sizeCanvas() {
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }

  // Cover-fit draw: crops the source image so it fills the canvas without
  // distortion, same result as CSS object-fit: cover.
  var VERTICAL_NUDGE = 0.06; // fraction of canvas height to push the frame down by

  function drawFrame(index) {
    var img = images[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    var cw = canvas.width,
      ch = canvas.height;
    var iw = img.naturalWidth,
      ih = img.naturalHeight;
    var canvasRatio = cw / ch;
    var imageRatio = iw / ih;

    var sx, sy, sw, sh;
    if (imageRatio > canvasRatio) {
      sh = ih;
      sw = ih * canvasRatio;
      sx = (iw - sw) / 2;
      sy = 0;
    } else {
      sw = iw;
      sh = iw / canvasRatio;
      sx = 0;
      sy = (ih - sh) / 2;
    }

    var destY = ch * VERTICAL_NUDGE;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh, 0, destY, cw, ch);
    lastDrawnFrame = index;
  }

  function preload() {
    return new Promise(function (resolve) {
      var remaining = FRAME_COUNT;
      for (var i = 0; i < FRAME_COUNT; i++) {
        var img = new Image();
        img.decoding = "async";
        // Handlers must be attached BEFORE src is set — an already-cached
        // image can fire load/error the moment src is assigned, and a
        // handler attached after that point misses it entirely. That was
        // the actual bug: with src set first, any cached frame's load was
        // silently dropped, remaining never hit 0, preload()'s promise
        // never resolved, and nothing downstream (ScrollTrigger setup,
        // first draw, every caption/card/button reveal) ever ran.
        var onDone = function () {
          loadedCount++;
          remaining--;
          if (remaining <= 0) resolve();
        };
        img.onload = onDone;
        img.onerror = onDone;
        img.src = frameSrc(i);
        images[i] = img;
      }
    });
  }

  // ---------- overlay updates ----------
  function setOpacityY(el, win, yOutputs) {
    if (!el) return;
    var op = interp(currentFrameIndex, win, [0, 1, 1, 0]);
    el.style.opacity = op;
    if (yOutputs) {
      el.style.transform = "translateY(" + interp(currentFrameIndex, win, yOutputs) + "px)";
    }
    return op;
  }

  var currentFrameIndex = 0;

  function updateOverlays() {
    setOpacityY(welcomeEl, WELCOME_WIN);
    setOpacityY(taglineEl, TAGLINE_WIN);
    setOpacityY(exploreEl, EXPLORE_WIN);

    var bioOp = setOpacityY(bioCardEl, BIO_WIN, [30, 0, 0, -20]);
    if (bioCardEl) bioCardEl.style.pointerEvents = bioOp > 0.05 ? "auto" : "none";

    traitCardEls.forEach(function (el, i) {
      setOpacityY(el, TRAIT_WINS[i], [24, 0, 0, -14]);
    });

    var anyNavVisible = false;
    navPillEls.forEach(function (el, i) {
      var op = setOpacityY(el, NAV_WINS[i], [16, 0, 0, 0]);
      if (op > 0.05) anyNavVisible = true;
    });
    if (navButtonsRowEl) navButtonsRowEl.style.pointerEvents = anyNavVisible ? "auto" : "none";
  }

  // ---------- reduced motion fallback ----------
  if (prefersReduced) {
    section.style.height = "100vh";
    sizeCanvas();
    preload().then(function () {
      drawFrame(Math.floor(FRAME_COUNT / 2));
    });
    currentFrameIndex = FRAME_COUNT - 1; // show end-state content statically
    updateOverlays();
    if (bioCardEl) bioCardEl.style.pointerEvents = "auto";
    if (navButtonsRowEl) navButtonsRowEl.style.pointerEvents = "auto";
    return;
  }

  // ---------- scroll-driven scrub ----------
  sizeCanvas();
  var totalScrollDistance = FRAME_COUNT * SCROLL_DIST_PER_FRAME;

  preload().then(function () {
    // The section's own CSS height is exactly 100vh (viewport-sized, no
    // built-in excess) — ScrollTrigger's `end: '+=totalScrollDistance'` is
    // the ONLY source of the extra scroll room. Giving the section any
    // additional height of its own on top of that double-books the scroll
    // space: GSAP's pin-spacer ends up sized to (natural height + pin
    // duration) instead of just the pin duration, leaving a dead scroll
    // zone the same size as the natural excess after the pin releases —
    // confirmed with Playwright: totalScrollDistance=3600 but the page's
    // actual max scroll was 7200, exactly double.
    section.style.height = "100vh";
    drawFrame(0);
    section.classList.add("is-ready");

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=" + totalScrollDistance,
      pin: true,
      scrub: true,
      onUpdate: function (self) {
        currentFrameIndex = self.progress * (FRAME_COUNT - 1);
        var rounded = Math.round(currentFrameIndex);
        if (rounded !== lastDrawnFrame) drawFrame(rounded);
        updateOverlays();
      },
    });

    // The page is only one viewport tall until this pin-spacer is created,
    // so a restored scroll position from an earlier visit has nowhere to
    // "land" until right now — re-asserting scroll-to-top here, after the
    // page has actually grown tall enough, is what makes it stick.
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  });

  window.addEventListener("resize", function () {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    sizeCanvas();
    drawFrame(lastDrawnFrame >= 0 ? lastDrawnFrame : 0);
    ScrollTrigger.refresh();
  });
})();
