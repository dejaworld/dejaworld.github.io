// DejaWorld project page: case tabs of the comparison videos, video controls, copy button.
(function () {
  "use strict";

  // Captions per case. Every video holds four tiles side by side.
  var CASES = {
    bank: {
      prefix: "static/videos/bank_",
      figure: "clip-bank",
      items: {
        atombench_m7: {
          caption:
            "AtomBench, real Franka arm. With N = 0 and N = 8 the gripper rises empty and the red cube stays on the " +
            "table; with N = 64 the cube is lifted in the gripper, as in the ground truth.",
        },
        robodojo_bowl: {
          caption:
            "RoboDojo, two real ARX X5 arms. With N = 0 the bowl turns into a shapeless block and drifts away from " +
            "the gripper, and with N = 8 it stays at the gripper but tilted; with N = 64 the gripper holds the bowl, " +
            "as in the ground truth.",
        },
        anchorz_cups: {
          caption:
            "AnchorZ, real Franka arm. With N = 0 and N = 8 the teal cup vanishes and only the orange cup is left on " +
            "the table; with N = 64 the teal cup sits in the orange one, as in the ground truth.",
        },
        libero_cabinet: {
          caption:
            "LIBERO, simulation. With N = 0 and N = 8 the cabinet warps and its drawer stays open; with N = 64 the " +
            "drawer closes and the cabinet keeps its shape, as in the ground truth.",
        },
      },
    },
  };

  function show(group, name) {
    var set = CASES[group];
    var item = set.items[name];
    var figure = document.getElementById(set.figure);
    if (!figure || !item) return;
    var video = figure.querySelector("video");
    var source = set.prefix + name + ".mp4";
    if (video.getAttribute("src") !== source) {
      video.poster = set.prefix + name + ".jpg";
      video.src = source;
      video.load();
      figure.dataset.paused = "0";
      if (figure.dataset.visible === "1") video.play().catch(function () {});
    }
    if (item.head) {
      var cells = figure.querySelectorAll(".clip-head span");
      item.head.forEach(function (text, i) {
        if (cells[i]) cells[i].textContent = text;
      });
    }
    figure.querySelector("figcaption").textContent = item.caption;
  }

  document.querySelectorAll(".tabs").forEach(function (tabs) {
    var group = tabs.dataset.tabs;
    var buttons = tabs.querySelectorAll("button");
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (other) {
          other.setAttribute("aria-selected", other === button ? "true" : "false");
        });
        show(group, button.dataset.case);
      });
    });
    var first = tabs.querySelector('button[aria-selected="true"]') || buttons[0];
    if (first) show(group, first.dataset.case);
  });

  // Each clip gets a play / pause button and a seek bar under the video (the browser's own controls would cover
  // the lower part of the frames). Videos play while they are on screen unless the viewer paused them.
  var PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z"/></svg>';
  var PAUSE = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 1.5h3v11h-3zM8.5 1.5h3v11h-3z"/></svg>';
  var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".clip").forEach(function (figure) {
    var video = figure.querySelector("video");
    video.removeAttribute("controls");
    var bar = document.createElement("div");
    bar.className = "clip-controls";
    var button = document.createElement("button");
    button.type = "button";
    var seek = document.createElement("input");
    seek.type = "range";
    seek.min = "0";
    seek.max = "1000";
    seek.value = "0";
    seek.setAttribute("aria-label", "Seek");
    bar.appendChild(button);
    bar.appendChild(seek);
    figure.querySelector(".clip-inner").appendChild(bar);

    function label() {
      button.innerHTML = video.paused ? PLAY : PAUSE;
      button.setAttribute("aria-label", video.paused ? "Play" : "Pause");
    }
    function toggle() {
      if (video.paused) {
        figure.dataset.paused = "0";
        video.play().catch(function () {});
      } else {
        figure.dataset.paused = "1";
        video.pause();
      }
    }
    function follow() {
      if (video.duration) seek.value = String(Math.round((video.currentTime / video.duration) * 1000));
      if (!video.paused) requestAnimationFrame(follow);
    }
    button.addEventListener("click", toggle);
    video.addEventListener("click", toggle);
    video.addEventListener("play", function () {
      label();
      follow();
    });
    video.addEventListener("pause", label);
    video.addEventListener("seeked", function () {
      if (video.paused) follow();
    });
    seek.addEventListener("input", function () {
      figure.dataset.paused = "1";
      video.pause();
      if (video.duration) video.currentTime = (Number(seek.value) / 1000) * video.duration;
    });
    label();
  });

  if ("IntersectionObserver" in window && !still) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target;
          var figure = video.closest("figure");
          figure.dataset.visible = entry.isIntersecting ? "1" : "0";
          if (entry.isIntersecting && figure.dataset.paused !== "1") video.play().catch(function () {});
          else video.pause();
        });
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll(".clip video").forEach(function (video) {
      observer.observe(video);
    });
  }

  // The wall of pairs plays whatever is on screen; with reduced motion each video gets its own controls instead.
  var wall = document.querySelectorAll(".wall video, .mosaic video");
  if ("IntersectionObserver" in window && !still) {
    var wallObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.play().catch(function () {});
          else entry.target.pause();
        });
      },
      { threshold: 0.25 }
    );
    wall.forEach(function (video) {
      wallObserver.observe(video);
    });
  } else {
    wall.forEach(function (video) {
      video.controls = true;
    });
  }

  // The step-by-step retrieval animation (#recall) lives in static/js/steps.js.

  document.querySelectorAll(".copy").forEach(function (button) {
    button.addEventListener("click", function () {
      var text = document.getElementById(button.dataset.copy).textContent;
      var done = function () {
        button.textContent = "Copied";
        setTimeout(function () {
          button.textContent = "Copy";
        }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });
})();
