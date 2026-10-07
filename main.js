/* ========================================================================
   Understanding Teen Stress — shared behaviour
   Every init function checks its root element exists before running, so
   this one file is safe to include unchanged on every page.
   ======================================================================== */
(function(){
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Theme toggle (localStorage, try/catch per project convention) ---- */
  function initTheme(){
    var KEY = "teenstress-theme";
    var root = document.documentElement;
    var btn = document.getElementById("theme-toggle");
    var saved = null;
    try{ saved = localStorage.getItem(KEY); }catch(e){}
    if(saved === "dark" || saved === "light"){ root.setAttribute("data-theme", saved); }
    if(!btn) return;
    btn.addEventListener("click", function(){
      var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var current = root.getAttribute("data-theme") || (dark ? "dark" : "light");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try{ localStorage.setItem(KEY, next); }catch(e){}
    });
  }

  /* ---- Nav / hamburger ---- */
  function initNav(){
    var btn = document.getElementById("hamburger-btn");
    var nav = document.getElementById("main-nav");
    if(!btn || !nav) return;
    btn.addEventListener("click", function(){
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){
        btn.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      });
    });
  }

  /* ---- Scroll reveal ---- */
  function initReveal(){
    var items = document.querySelectorAll(".reveal");
    if(!items.length) return;
    if(reduceMotion || !("IntersectionObserver" in window)){
      items.forEach(function(el){ el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function(el){ io.observe(el); });
    /* Safety net: content must never stay permanently invisible if the
       observer misses an element (fast navigation, odd viewport, print/
       capture tools that don't scroll). */
    setTimeout(function(){
      items.forEach(function(el){ el.classList.add("is-visible"); });
      io.disconnect();
    }, 2000);
  }

  /* ---- Count-up stat numbers ---- */
  function initCountUp(){
    var items = document.querySelectorAll("[data-countup]");
    if(!items.length) return;
    function run(el){
      if(el.dataset.countupDone) return;
      el.dataset.countupDone = "1";
      var target = parseFloat(el.getAttribute("data-countup"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      if(reduceMotion || isNaN(target)){
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }
      var start = null, duration = 1200;
      function step(ts){
        if(start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
        if(p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if(!("IntersectionObserver" in window)){
      items.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    items.forEach(function(el){ io.observe(el); });
    /* Safety net: a stat stuck at 0 reads as broken, not as "not yet scrolled to". */
    setTimeout(function(){ items.forEach(run); io.disconnect(); }, 2000);
  }

  /* ---- Ring charts ---- */
  function initRingCharts(){
    var rings = document.querySelectorAll(".ring-value[data-pct]");
    if(!rings.length) return;
    var CIRC = 326.73; /* 2 * PI * 52 */
    function run(el){
      if(el.dataset.ringDone) return;
      el.dataset.ringDone = "1";
      var pct = parseFloat(el.getAttribute("data-pct")) || 0;
      var offset = CIRC - (CIRC * pct / 100);
      el.style.strokeDashoffset = String(offset);
    }
    if(!("IntersectionObserver" in window)){ rings.forEach(run); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){ run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    rings.forEach(function(el){ io.observe(el); });
    setTimeout(function(){ rings.forEach(run); io.disconnect(); }, 2000);
  }

  /* ---- Accordion ---- */
  function initAccordion(){
    var triggers = document.querySelectorAll(".accordion-trigger");
    if(!triggers.length) return;
    triggers.forEach(function(btn){
      btn.addEventListener("click", function(){
        var panel = document.getElementById(btn.getAttribute("aria-controls"));
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        if(panel) panel.hidden = open;
      });
    });
  }

  /* ---- Tabs ---- */
  function initTabs(){
    document.querySelectorAll("[data-tabs]").forEach(function(group){
      var tabs = Array.prototype.slice.call(group.querySelectorAll(".tab-btn"));
      if(!tabs.length) return;
      function activate(tab){
        tabs.forEach(function(t){
          var selected = t === tab;
          t.setAttribute("aria-selected", String(selected));
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if(panel) panel.hidden = !selected;
        });
        tab.focus();
      }
      tabs.forEach(function(tab, i){
        tab.addEventListener("click", function(){ activate(tab); });
        tab.addEventListener("keydown", function(e){
          if(e.key === "ArrowRight" || e.key === "ArrowLeft"){
            e.preventDefault();
            var next = e.key === "ArrowRight" ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
            activate(tabs[next]);
          }
        });
      });
    });
  }

  /* ---- Subtopic nav (jump between the two halves of a merged topic page) ---- */
  function initSubtopicNav(){
    var nav = document.querySelector(".subtopic-nav");
    if(!nav) return;
    var links = Array.prototype.slice.call(nav.querySelectorAll(".subtopic-link"));
    if(!links.length) return;
    var targets = links.map(function(a){
      return document.getElementById(a.getAttribute("href").slice(1));
    }).filter(Boolean);
    function setActive(id){
      links.forEach(function(a){
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
      });
    }
    setActive(targets[0] && targets[0].id);
    if(!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    targets.forEach(function(el){ io.observe(el); });
  }

  /* ---- Back to top ---- */
  function initBackToTop(){
    var btn = document.getElementById("back-to-top");
    if(!btn) return;
    window.addEventListener("scroll", function(){
      btn.classList.toggle("is-visible", window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener("click", function(){
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---- Presentation mode ---- */
  function initPresentation(){
    var toggleBtn = document.getElementById("present-toggle");
    var bar = document.getElementById("present-bar");
    var counter = document.getElementById("present-counter");
    var prevBtn = document.getElementById("present-prev");
    var nextBtn = document.getElementById("present-next");
    var exitBtn = document.getElementById("present-exit");
    if(!bar) return;
    var steps = Array.prototype.slice.call(document.querySelectorAll("[data-present-step]"));
    var active = false, idx = 0;

    function goTo(i){
      if(!steps.length) return;
      idx = Math.max(0, Math.min(i, steps.length - 1));
      steps[idx].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      if(counter) counter.textContent = "Step " + (idx + 1) + " of " + steps.length;
      if(prevBtn) prevBtn.disabled = idx === 0;
      if(nextBtn) nextBtn.disabled = idx === steps.length - 1;
    }
    function enter(){
      active = true;
      document.body.classList.add("is-presenting");
      bar.hidden = false;
      goTo(0);
    }
    function exit(){
      active = false;
      document.body.classList.remove("is-presenting");
      bar.hidden = true;
    }
    if(toggleBtn) toggleBtn.addEventListener("click", function(){ active ? exit() : enter(); });
    if(prevBtn) prevBtn.addEventListener("click", function(){ goTo(idx - 1); });
    if(nextBtn) nextBtn.addEventListener("click", function(){ goTo(idx + 1); });
    if(exitBtn) exitBtn.addEventListener("click", exit);

    document.addEventListener("keydown", function(e){
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if(!typing && (e.key === "p" || e.key === "P") && !e.ctrlKey && !e.metaKey && !e.altKey){
        active ? exit() : enter();
        return;
      }
      if(!active) return;
      if(e.key === "Escape"){ exit(); }
      else if(e.key === "ArrowRight"){ goTo(idx + 1); }
      else if(e.key === "ArrowLeft"){ goTo(idx - 1); }
    });
  }

  /* ---- Stress check-in quiz (Teen Stress page) ---- */
  function initQuiz(){
    var root = document.getElementById("stress-quiz");
    if(!root) return;
    var questions = Array.prototype.slice.call(root.querySelectorAll(".quiz-question"));
    var fill = root.querySelector(".quiz-progress-fill");
    var progressText = root.querySelector(".quiz-progress-text");
    var submitBtn = document.getElementById("quiz-submit");
    var resetBtn = document.getElementById("quiz-reset");
    var result = document.getElementById("quiz-result");
    var badge = document.getElementById("quiz-result-badge");
    var message = document.getElementById("quiz-result-message");
    var form = document.getElementById("quiz-form");

    function answeredCount(){
      var n = 0;
      questions.forEach(function(q){ if(q.querySelector("input:checked")) n++; });
      return n;
    }
    function updateProgress(){
      var n = answeredCount();
      var pct = Math.round((n / questions.length) * 100);
      if(fill) fill.style.width = pct + "%";
      if(progressText) progressText.textContent = n + " of " + questions.length + " answered";
      if(submitBtn) submitBtn.disabled = n < questions.length;
    }
    root.addEventListener("change", function(e){
      if(e.target && e.target.matches('input[type="radio"]')) updateProgress();
    });

    if(submitBtn) submitBtn.addEventListener("click", function(){
      if(answeredCount() < questions.length) return;
      var total = 0;
      questions.forEach(function(q){
        var checked = q.querySelector("input:checked");
        if(checked) total += parseInt(checked.getAttribute("data-weight") || "0", 10);
      });
      var band, text;
      if(total <= 6){
        band = "Low pressure right now";
        text = "Things feel fairly manageable for you at the moment. Keep doing what helps, and check back any time your days change.";
      } else if(total <= 12){
        band = "Moderate pressure right now";
        text = "You are carrying a fair amount right now. The What Helps page has small, realistic ways to take some weight off.";
      } else {
        band = "High pressure right now";
        text = "It sounds like a lot is piling up right now. That is worth taking seriously. Have a look at What Helps, and consider talking to someone on the Get Help page.";
      }
      if(badge) badge.textContent = band;
      if(message) message.textContent = text;
      if(form) form.hidden = true;
      if(result) result.hidden = false;
      if(result) result.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });

    if(resetBtn) resetBtn.addEventListener("click", function(){
      root.querySelectorAll('input[type="radio"]').forEach(function(r){ r.checked = false; });
      if(form) form.hidden = false;
      if(result) result.hidden = true;
      updateProgress();
      root.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });

    updateProgress();
  }

  /* ---- Brain break card deck (What Helps page) ---- */
  function initBrainBreak(){
    var card = document.getElementById("bb-card");
    var text = document.getElementById("bb-card-text");
    var btn = document.getElementById("bb-shuffle");
    if(!card || !text || !btn) return;
    var ideas = [
      "Go outside, even just for a few minutes.",
      "Listen to a song you really like.",
      "Talk to a friend about anything, big or small.",
      "Take a short walk, no destination needed.",
      "Put your phone away for a while.",
      "Do something you enjoy, just because."
    ];
    var lastIndex = -1;
    function shuffle(){
      var i;
      do { i = Math.floor(Math.random() * ideas.length); } while(i === lastIndex && ideas.length > 1);
      lastIndex = i;
      text.textContent = ideas[i];
      if(!reduceMotion){
        card.classList.remove("is-swapping");
        void card.offsetWidth;
        card.classList.add("is-swapping");
      }
    }
    btn.addEventListener("click", shuffle);
  }

  /* ---- Highlight reel toggle (Social Media page) ---- */
  function initHighlightReel(){
    var root = document.querySelector(".highlight-reel");
    if(!root) return;
    var buttons = Array.prototype.slice.call(root.querySelectorAll(".hr-switch button"));
    var panes = Array.prototype.slice.call(root.querySelectorAll(".hr-pane"));
    buttons.forEach(function(btn){
      btn.addEventListener("click", function(){
        var target = btn.getAttribute("data-target");
        buttons.forEach(function(b){ b.classList.toggle("is-active", b === btn); b.setAttribute("aria-pressed", String(b === btn)); });
        panes.forEach(function(p){ p.classList.toggle("is-active", p.id === target); });
      });
    });
  }

  /* ---- Wellness tracker (What Helps page, localStorage) ---- */
  function initWellnessTracker(){
    var root = document.getElementById("wellness-tracker");
    if(!root) return;
    var KEY = "teenstress-wellness";
    var grid = document.getElementById("tracker-grid");
    var formWrap = document.getElementById("tracker-form");
    var formTitle = document.getElementById("tracker-form-title");
    var saveBtn = document.getElementById("tracker-save");
    var cancelBtn = document.getElementById("tracker-cancel");
    var resetBtn = document.getElementById("tracker-reset");
    var moodSel = document.getElementById("tf-mood");
    var sleepInp = document.getElementById("tf-sleep");
    var screenInp = document.getElementById("tf-screen");
    var moveChk = document.getElementById("tf-move");
    var connChk = document.getElementById("tf-conn");
    var summaryWrap = document.getElementById("tracker-summary");

    var memStore = null;
    function load(){
      var raw;
      try{ raw = localStorage.getItem(KEY); }catch(e){ raw = memStore; }
      if(raw == null) raw = memStore;
      try{ return raw ? JSON.parse(raw) : {}; }catch(e){ return {}; }
    }
    function save(data){
      var json = JSON.stringify(data);
      memStore = json;
      try{ localStorage.setItem(KEY, json); }catch(e){ /* session-only fallback, see memStore */ }
    }

    var data = load();
    var openDay = null;
    var moodEmoji = { "1":"😣", "2":"😕", "3":"😐", "4":"🙂", "5":"😄" };

    function renderGrid(){
      grid.innerHTML = "";
      for(var d = 1; d <= 14; d++){
        var entry = data[d];
        var cell = document.createElement("button");
        cell.type = "button";
        cell.className = "tracker-day" + (entry ? " has-entry" : "");
        cell.setAttribute("aria-label", "Day " + d + (entry ? ", logged" : ", not logged yet"));
        cell.innerHTML = '<span class="td-mood">' + (entry ? moodEmoji[entry.mood] : "") + '</span><span class="td-num">Day ' + d + '</span>';
        cell.addEventListener("click", function(day){ return function(){ openForm(day); }; }(d));
        grid.appendChild(cell);
      }
    }
    function openForm(day){
      openDay = day;
      var entry = data[day] || {};
      formTitle.textContent = "Day " + day;
      moodSel.value = entry.mood || "3";
      sleepInp.value = entry.sleep != null ? entry.sleep : "";
      screenInp.value = entry.screen != null ? entry.screen : "";
      moveChk.checked = !!entry.move;
      connChk.checked = !!entry.conn;
      formWrap.classList.add("is-open");
      formWrap.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }
    function closeForm(){
      formWrap.classList.remove("is-open");
      openDay = null;
    }
    function renderSummary(){
      var entries = [];
      for(var d = 1; d <= 14; d++){ if(data[d]) entries.push(data[d]); }
      summaryWrap.innerHTML = "";
      if(!entries.length){
        summaryWrap.innerHTML = '<p class="stat-note">Log a few days to see your summary here.</p>';
        return;
      }
      var avgMood = entries.reduce(function(s,e){ return s + (parseInt(e.mood,10) || 0); }, 0) / entries.length;
      var avgSleep = entries.reduce(function(s,e){ return s + (parseFloat(e.sleep) || 0); }, 0) / entries.length;
      var avgScreen = entries.reduce(function(s,e){ return s + (parseFloat(e.screen) || 0); }, 0) / entries.length;
      var moveDays = entries.filter(function(e){ return e.move; }).length;
      var connDays = entries.filter(function(e){ return e.conn; }).length;

      var rows = [
        { label: "Mood", val: avgMood.toFixed(1) + " / 5", pct: (avgMood/5)*100 },
        { label: "Sleep", val: avgSleep.toFixed(1) + " h", pct: Math.min((avgSleep/10)*100,100) },
        { label: "Screen time", val: avgScreen.toFixed(1) + " h", pct: Math.min((avgScreen/6)*100,100) },
        { label: "Movement days", val: moveDays + " / " + entries.length, pct: (moveDays/entries.length)*100 },
        { label: "Real connection", val: connDays + " / " + entries.length, pct: (connDays/entries.length)*100 }
      ];
      rows.forEach(function(r){
        var row = document.createElement("div");
        row.className = "tracker-bar-row";
        row.innerHTML = '<span class="tbr-label">' + r.label + '</span>' +
          '<span class="tracker-bar-track"><span class="tracker-bar-fill" style="width:' + r.pct + '%"></span></span>' +
          '<span class="tbr-val">' + r.val + '</span>';
        summaryWrap.appendChild(row);
      });
    }
    function renderAll(){ renderGrid(); renderSummary(); }

    if(saveBtn) saveBtn.addEventListener("click", function(){
      if(openDay == null) return;
      data[openDay] = {
        mood: moodSel.value,
        sleep: sleepInp.value,
        screen: screenInp.value,
        move: moveChk.checked,
        conn: connChk.checked
      };
      save(data);
      closeForm();
      renderAll();
    });
    if(cancelBtn) cancelBtn.addEventListener("click", closeForm);
    if(resetBtn) resetBtn.addEventListener("click", function(){
      if(!window.confirm("Clear all 14 days of tracker data on this device? This cannot be undone.")) return;
      data = {};
      save(data);
      closeForm();
      renderAll();
    });

    renderAll();
  }

  document.addEventListener("DOMContentLoaded", function(){
    initTheme();
    initNav();
    initReveal();
    initCountUp();
    initRingCharts();
    initAccordion();
    initTabs();
    initSubtopicNav();
    initBackToTop();
    initPresentation();
    initQuiz();
    initBrainBreak();
    initHighlightReel();
    initWellnessTracker();
  });
})();
