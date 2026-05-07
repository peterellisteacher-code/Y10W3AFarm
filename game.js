/* ============================================================
   THROUGH THE LENS — Phaser orchestration + DOM controller
   Phaser is the audio engine + scene flow.
   All UI is DOM (Tier 3 accessible-web-composition pattern).
   ============================================================ */

(function () {
  'use strict';

  // ============ Reduced motion check ============
  window.PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.PREFERS_REDUCED_MOTION) {
    document.documentElement.classList.add('motion-reduced');
  }

  // ============ Audio engine (Web Audio API directly) ============
  var Audio = (function () {
    var ctx = null;
    var masterGain = null;
    var ready = false;

    function init() {
      if (ready) return;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.4;
        masterGain.connect(ctx.destination);
        ready = true;
        window.LensState.audioReady = true;
      } catch (e) {
        // Audio not available — fail silent
        ready = false;
      }
    }

    function isMuted() { return window.LensState.muted; }

    function thunk() {
      if (!ready || isMuted() || window.PREFERS_REDUCED_MOTION) return;
      // Typewriter strike: short noise burst + low click
      var now = ctx.currentTime;

      // Noise burst
      var bufferSize = ctx.sampleRate * 0.05;
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      var noise = ctx.createBufferSource();
      noise.buffer = buffer;
      var noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1800;
      noiseFilter.Q.value = 1.5;
      var noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.05);

      // Low click (typewriter mechanism)
      var osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 90;
      var oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.18, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.04);
    }

    function scratch() {
      if (!ready || isMuted() || window.PREFERS_REDUCED_MOTION) return;
      // Eraser: filtered noise envelope
      var now = ctx.currentTime;
      var bufferSize = ctx.sampleRate * 0.18;
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
      var noise = ctx.createBufferSource();
      noise.buffer = buffer;
      var filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 2400;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.25, now + 0.04);
      g.gain.linearRampToValueAtTime(0, now + 0.18);
      noise.connect(filter);
      filter.connect(g);
      g.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.18);
    }

    function projectorClick() {
      if (!ready || isMuted() || window.PREFERS_REDUCED_MOTION) return;
      // Two-stage mechanical click (lens switch)
      var now = ctx.currentTime;
      [0, 0.06].forEach(function (delay, i) {
        var osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = i === 0 ? 220 : 180;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.15, now + delay);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.05);
      });
    }

    function stamp() {
      if (!ready || isMuted() || window.PREFERS_REDUCED_MOTION) return;
      // Stamped document: thump
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.45, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.15);

      // Paper rustle on top
      var bufferSize = ctx.sampleRate * 0.08;
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      var noise = ctx.createBufferSource();
      noise.buffer = buffer;
      var filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3500;
      var ng = ctx.createGain();
      ng.gain.setValueAtTime(0.15, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      noise.connect(filter);
      filter.connect(ng);
      ng.connect(masterGain);
      noise.start(now);
      noise.stop(now + 0.08);
    }

    function reflectionSwell() {
      if (!ready || isMuted() || window.PREFERS_REDUCED_MOTION) return;
      // Slow swell: pages rustling + door
      var now = ctx.currentTime;
      var bufferSize = ctx.sampleRate * 1.5;
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4 * (1 - Math.abs((i - bufferSize / 2) / (bufferSize / 2)));
      }
      var noise = ctx.createBufferSource();
      noise.buffer = buffer;
      var filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.2, now + 0.7);
      g.gain.linearRampToValueAtTime(0, now + 1.5);
      noise.connect(filter);
      filter.connect(g);
      g.connect(masterGain);
      noise.start(now);
      noise.stop(now + 1.5);
    }

    return {
      init: init,
      thunk: thunk,
      scratch: scratch,
      projectorClick: projectorClick,
      stamp: stamp,
      reflectionSwell: reflectionSwell
    };
  })();
  window.LensAudio = Audio;

  // ============ HUD live-region helpers ============
  window.HUD = {
    polite: function (msg) {
      var el = document.getElementById('hud-polite');
      if (el) el.textContent = msg;
    },
    assertive: function (msg) {
      var el = document.getElementById('hud-assertive');
      if (el) el.textContent = msg;
    }
  };

  // ============ DOM controller ============
  var DOM = (function () {

    function $(sel) { return document.querySelector(sel); }
    function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

    var screens = ['title', 'reading', 'reflection', 'complete'];

    function showScreen(name) {
      screens.forEach(function (s) {
        var el = document.getElementById('screen-' + s);
        if (el) el.classList.toggle('visible', s === name);
      });
      // Set focus to a sensible element
      requestAnimationFrame(function () {
        var screen = document.getElementById('screen-' + name);
        if (!screen) return;
        var firstHeading = screen.querySelector('h1, h2');
        if (firstHeading) {
          firstHeading.setAttribute('tabindex', '-1');
          firstHeading.focus({ preventScroll: false });
        }
      });
    }

    function renderLensTray() {
      var tray = $('.lens-buttons');
      if (!tray) return;
      tray.innerHTML = '';
      window.LensState.lenses.forEach(function (lens) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lens-btn';
        btn.dataset.lens = lens.id;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.innerHTML =
          '<span class="lens-letter" aria-hidden="true">' + lens.letter + '</span>' +
          '<span class="lens-meta">' +
            '<span class="lens-name">' + escapeHtml(lens.label) + '</span>' +
            '<span class="lens-count" data-count-for="' + lens.id + '">0 marks</span>' +
          '</span>';
        btn.addEventListener('click', function () {
          window.LensActions.setActiveLens(lens.id);
        });
        btn.addEventListener('keydown', function (e) {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            window.LensActions.setActiveLens(lens.id);
          }
        });
        tray.appendChild(btn);
      });
    }

    function updateLensTray() {
      var p = window.currentPassageState();
      $$('.lens-btn').forEach(function (btn) {
        var lensId = btn.dataset.lens;
        var isActive = lensId === p.currentLens;
        btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
        var countEl = btn.querySelector('[data-count-for]');
        var count = p.playerMarks.filter(function (m) { return m.lens === lensId; }).length;
        if (countEl) countEl.textContent = count + (count === 1 ? ' mark' : ' marks');
      });
      // Update active-lens prompt above passage
      var lens = window.LensState.lensById[p.currentLens];
      var rubric = $('#active-lens-prompt');
      if (rubric) {
        rubric.innerHTML =
          '<span class="rubric-label">Active lens:</span> ' +
          '<span class="rubric-name">' + escapeHtml(lens.label) + '</span>';
      }
    }

    function renderPassage() {
      var passage = window.currentPassage();
      var p = window.currentPassageState();

      $('#passage-reference').textContent = passage.reference;
      $('#passage-context').textContent = passage.context;

      var container = $('#passage-text');
      container.innerHTML = '';
      container.dataset.activeLens = p.currentLens;

      passage.tokens.forEach(function (token, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'phrase';
        btn.dataset.tokenIndex = String(i);
        btn.setAttribute('aria-label', 'Phrase ' + (i + 1) + ': ' + token + '. Click or press Enter to mark with the active lens.');
        btn.textContent = token;
        btn.addEventListener('click', function () {
          window.LensActions.toggleMark(i);
        });
        container.appendChild(btn);
      });

      applyAllMarks();
      updateLensTray();
      renderProgressGrid();
      updateActionButtons();
    }

    function applyAllMarks() {
      var p = window.currentPassageState();
      // Clear current marks
      $$('.phrase[data-marked-lens]').forEach(function (el) {
        el.removeAttribute('data-marked-lens');
        // Reset aria-label to base
        var idx = parseInt(el.dataset.tokenIndex, 10);
        var token = window.currentPassage().tokens[idx];
        el.setAttribute('aria-label', 'Phrase ' + (idx + 1) + ': ' + token + '. Click or press Enter to mark with the active lens.');
      });
      // Re-apply player marks
      // If a phrase has multiple lens marks, the active lens wins display priority
      var marksByToken = {};
      p.playerMarks.forEach(function (m) {
        if (!marksByToken[m.tokenIndex]) marksByToken[m.tokenIndex] = [];
        marksByToken[m.tokenIndex].push(m.lens);
      });
      Object.keys(marksByToken).forEach(function (tokIdx) {
        var lensesOnToken = marksByToken[tokIdx];
        var displayLens = lensesOnToken.indexOf(p.currentLens) >= 0
          ? p.currentLens
          : lensesOnToken[0];
        var el = document.querySelector('.phrase[data-token-index="' + tokIdx + '"]');
        if (el) {
          el.dataset.markedLens = displayLens;
          var token = window.currentPassage().tokens[parseInt(tokIdx, 10)];
          var lensLabels = lensesOnToken.map(function (id) {
            return window.LensState.lensById[id].label;
          }).join(', ');
          el.setAttribute('aria-label',
            'Phrase ' + (parseInt(tokIdx, 10) + 1) + ': ' + token +
            '. Marked with ' + lensLabels + ' lens. Click to remove.'
          );
        }
      });
    }

    function renderProgressGrid() {
      var grid = $('#progress-grid');
      if (!grid) return;
      grid.innerHTML = '';
      // 4 passages × 4 lenses
      window.LensState.passages.forEach(function (passage, pi) {
        window.LensState.lenses.forEach(function (lens) {
          var cell = document.createElement('div');
          cell.className = 'progress-cell lens-' + lens.id;
          var ps = window.LensState.perPassage[pi];
          var state = ps.developed ? 'developed' :
                      (ps.touched[lens.id] ? 'touched' : 'untouched');
          cell.dataset.state = state;
          if (pi === window.LensState.currentPassageIndex) cell.classList.add('current');
          cell.setAttribute('aria-label',
            'Passage ' + (pi + 1) + ', ' + lens.label + ' lens: ' + state
          );
          grid.appendChild(cell);
        });
      });
    }

    function flashLensBrief(lensId, customMessage) {
      var lens = window.LensState.lensById[lensId];
      var brief = $('#lens-brief');
      brief.dataset.lens = lensId;
      $('#lens-brief-name').textContent = lens.label;
      $('#lens-brief-definition').textContent = customMessage || lens.huntFor;
      brief.classList.add('visible');
      brief.setAttribute('aria-hidden', 'false');
      clearTimeout(brief._hideTimer);
      brief._hideTimer = setTimeout(function () {
        brief.classList.remove('visible');
        brief.setAttribute('aria-hidden', 'true');
      }, 4500);
    }

    function tintSweep(lensId) {
      if (window.PREFERS_REDUCED_MOTION) return;
      var frame = document.querySelector('.passage-frame');
      if (!frame) return;
      var lens = window.LensState.lensById[lensId];
      frame.style.setProperty('--tint-color', lens.colour);
      frame.classList.remove('tint-sweep');
      // Force reflow to restart animation
      void frame.offsetWidth;
      frame.classList.add('tint-sweep');
    }

    function showJustifyDialog(tokenIndex, lensId) {
      var passage = window.currentPassage();
      var lens = window.LensState.lensById[lensId];
      var dlg = $('#justify-dialog');
      dlg.dataset.lens = lensId;
      $('#justify-lens-letter').textContent = lens.letter;
      $('#justify-lens-label').textContent = lens.label + ' lens';
      $('#justify-quote').textContent = '"' + passage.tokens[tokenIndex] + '"';
      $('#justify-prompt').textContent = lens.justifyPrompt;
      $('#justify-text').value = '';
      $('#justify-counter').textContent = '0 / 500 characters';
      dlg.dataset.tokenIndex = String(tokenIndex);

      if (typeof dlg.showModal === 'function') {
        dlg.showModal();
      } else {
        dlg.setAttribute('open', '');
      }
      // Focus textarea after open
      setTimeout(function () { $('#justify-text').focus(); }, 50);
    }

    function renderReflection() {
      var passage = window.currentPassage();
      var p = window.currentPassageState();
      $('#reflection-passage-ref').textContent = passage.reference;

      var grid = $('#reflection-grid');
      grid.innerHTML = '';

      window.LensState.lenses.forEach(function (lens) {
        var panel = document.createElement('section');
        panel.className = 'reflection-panel';
        panel.dataset.lens = lens.id;

        var expertMarksForLens = passage.expertMarks.filter(function (em) { return em.lens === lens.id; });
        var playerMarksForLens = p.playerMarks.filter(function (m) { return m.lens === lens.id; });

        var found = expertMarksForLens.filter(function (em) {
          return playerMarksForLens.some(function (pm) { return pm.tokenIndex === em.tokenIndex; });
        });
        var missed = expertMarksForLens.filter(function (em) {
          return !playerMarksForLens.some(function (pm) { return pm.tokenIndex === em.tokenIndex; });
        });
        var falsePos = playerMarksForLens.filter(function (pm) {
          return !expertMarksForLens.some(function (em) { return em.tokenIndex === pm.tokenIndex; });
        });

        var header = document.createElement('header');
        header.className = 'reflection-panel-header';
        header.innerHTML =
          '<span class="reflection-panel-letter" aria-hidden="true">' + lens.letter + '</span>' +
          '<span class="reflection-panel-name">' + escapeHtml(lens.label) + '</span>' +
          '<span class="reflection-stats">' +
            found.length + ' / ' + expertMarksForLens.length + ' found' +
            (falsePos.length > 0 ? ' · ' + falsePos.length + ' extra' : '') +
          '</span>';
        panel.appendChild(header);

        var list = document.createElement('ul');
        list.className = 'reflection-mark-list';

        if (expertMarksForLens.length === 0 && playerMarksForLens.length === 0) {
          var empty = document.createElement('p');
          empty.className = 'reflection-empty';
          empty.textContent = 'This lens does not have an expert reading authored for this passage. The silence is itself a reading — what would this lens have shown if it were here?';
          panel.appendChild(empty);
        } else {
          // Expert marks first (found + missed)
          expertMarksForLens.forEach(function (em) {
            var li = document.createElement('li');
            li.className = 'reflection-mark';
            li.dataset.lens = lens.id;
            var isFound = playerMarksForLens.some(function (pm) { return pm.tokenIndex === em.tokenIndex; });
            li.dataset.status = isFound ? 'found' : 'missed';
            var studentJust = p.justifications.find(function (j) {
              return j.tokenIndex === em.tokenIndex && j.lens === lens.id;
            });
            li.innerHTML =
              '<span class="reflection-mark-status" aria-label="' + (isFound ? 'Found' : 'Missed') + '">' +
                (isFound ? '✓' : '·') +
              '</span>' +
              '<div>' +
                '<blockquote class="reflection-quote">"' + escapeHtml(passage.tokens[em.tokenIndex]) + '"</blockquote>' +
                '<p class="reflection-justification">' +
                  '<strong>Expert reading</strong>' + escapeHtml(em.justification) +
                '</p>' +
                (studentJust && studentJust.text.trim()
                  ? '<p class="student-justification"><strong>Your justification</strong> ' + escapeHtml(studentJust.text) + '</p>'
                  : '') +
              '</div>';
            list.appendChild(li);
          });
          // False positives — player marks not in expert reading
          falsePos.forEach(function (pm) {
            var li = document.createElement('li');
            li.className = 'reflection-mark';
            li.dataset.lens = lens.id;
            li.dataset.status = 'false-pos';
            li.innerHTML =
              '<span class="reflection-mark-status" aria-label="Not in expert reading">○</span>' +
              '<div>' +
                '<blockquote class="reflection-quote">"' + escapeHtml(passage.tokens[pm.tokenIndex]) + '"</blockquote>' +
                '<p class="reflection-justification">' +
                  '<strong>Not in expert reading</strong>' +
                  'This was your mark — the expert reading does not flag it under this lens. That does not necessarily make it wrong. What did you see that the lens illuminated for you?' +
                '</p>' +
              '</div>';
            list.appendChild(li);
          });
          panel.appendChild(list);
        }

        grid.appendChild(panel);
      });

      // Show/hide continue button based on whether there are more passages
      var isLast = window.LensState.currentPassageIndex === window.LensState.passages.length - 1;
      $('#btn-continue').textContent = isLast ? 'Finish reading' : 'Continue to next passage';
    }

    function renderCompletion() {
      var stats = window.aggregateStats();
      var dl = '<dl>' +
        '<dt>Passages developed</dt><dd>' + stats.passagesDeveloped + ' / ' + window.LensState.passages.length + '</dd>' +
        '<dt>Phrases marked</dt><dd>' + stats.totalMarks + '</dd>' +
        '<dt>Marks aligned with expert reading</dt><dd>' + stats.expertMarks + '</dd>' +
        '<dt>Your additions (not in expert reading)</dt><dd>' + stats.falsePositives + '</dd>' +
        '<dt>Justifications written</dt><dd>' + stats.justifications + '</dd>' +
        '<dt>Lenses used</dt><dd>' + stats.lensesUsedCount + ' / 4</dd>' +
        '</dl>';
      $('#complete-stats').innerHTML = dl;
    }

    function updateActionButtons() {
      var idx = window.LensState.currentPassageIndex;
      $('#btn-prev-passage').disabled = idx === 0;
      $('#btn-next-passage').textContent =
        idx === window.LensState.passages.length - 1 ? 'Finish ›' : 'Next passage ›';
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
      });
    }

    return {
      showScreen: showScreen,
      renderLensTray: renderLensTray,
      updateLensTray: updateLensTray,
      renderPassage: renderPassage,
      applyAllMarks: applyAllMarks,
      renderProgressGrid: renderProgressGrid,
      flashLensBrief: flashLensBrief,
      tintSweep: tintSweep,
      showJustifyDialog: showJustifyDialog,
      renderReflection: renderReflection,
      renderCompletion: renderCompletion,
      updateActionButtons: updateActionButtons,
      $: $
    };
  })();

  // ============ Phaser scenes (thin orchestration) ============

  var BootScene = {
    key: 'BootScene',
    create: function () {
      // Data is loaded synchronously by data/passages.js and data/lenses.js
      // (which are <script> tags in index.html, not fetch — so file:// works).
      var passages = window.PASSAGES_DATA;
      var lenses = window.LENSES_DATA;
      if (!passages || !lenses) {
        window.HUD.assertive('Could not load game data. Make sure data/passages.js and data/lenses.js are present.');
        console.error('PASSAGES_DATA or LENSES_DATA missing on window. Check that data/passages.js and data/lenses.js loaded correctly.');
        return;
      }
      window.LensActions.initFromData(passages, lenses);
      DOM.renderLensTray();
      window.HUD.polite('Through the Lens loaded. Press Begin reading to start.');
      this.scene.start('IdleScene');
    }
  };

  var IdleScene = {
    key: 'IdleScene',
    create: function () {
      // Phaser is now idle; all interaction is DOM-driven.
      // We keep this scene alive to host audio context.
    }
  };

  // ============ Phaser game configuration ============

  function bootPhaser() {
    // Use CANVAS explicitly — AUTO can fail in headless / preview contexts
    // and we don't actually render anything (canvas is invisible orchestration).
    new Phaser.Game({
      type: Phaser.CANVAS,
      canvas: document.getElementById('phaser-host'),
      width: 1,
      height: 1,
      backgroundColor: '#E8E8E4',
      scene: [BootScene, IdleScene],
      audio: { disableWebAudio: false },
      banner: false
    });
  }

  // ============ DOM event wiring ============

  function wireDOMEvents() {
    var $ = DOM.$;

    // Title screen — Begin reading uses the default lens (historical-political)
    function startReading(startingLensId) {
      Audio.init();
      Audio.stamp();
      // Set the chosen starting lens BEFORE showing the screen so the rubric is correct
      if (startingLensId && window.LensState.lensById[startingLensId]) {
        var p = window.currentPassageState();
        p.currentLens = startingLensId;
        p.touched[startingLensId] = true;
      }
      DOM.showScreen('reading');
      DOM.renderPassage();
      window.GAME_RUNNING = true;
      var lensLabel = window.LensState.lensById[window.currentPassageState().currentLens].label;
      window.HUD.polite('Reading screen: ' + window.currentPassage().reference + '. Active lens is ' + lensLabel + '.');
    }

    $('#btn-begin').addEventListener('click', function () { startReading(); });

    $('#btn-how').addEventListener('click', function () {
      var dlg = $('#how-dialog');
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    });
    $('#btn-how-close').addEventListener('click', function () {
      $('#how-dialog').close();
      $('#btn-how').focus();
    });

    // Lens-preview chips on title screen — clicking starts the reading with that lens active
    Array.prototype.slice.call(document.querySelectorAll('.lens-chip')).forEach(function (chip) {
      chip.addEventListener('click', function () {
        startReading(chip.dataset.lens);
      });
    });

    // Reading screen — lens tray events wired in renderLensTray()
    $('#btn-hint').addEventListener('click', function () {
      var lens = window.LensState.lensById[window.currentPassageState().currentLens];
      window.LensActions.setHintShown();
      window.HUD.polite('Hint for ' + lens.label + ' lens: ' + lens.hint);
      // Visual flash with the hint text (not the default huntFor)
      DOM.flashLensBrief(lens.id, lens.hint);
    });

    $('#btn-develop').addEventListener('click', function () {
      window.LensActions.markDeveloped();
      DOM.renderReflection();
      DOM.showScreen('reflection');
      Audio.reflectionSwell();
      window.HUD.assertive('Reflection screen for ' + window.currentPassage().reference + '. Showing your marks alongside the expert reading.');
    });

    $('#btn-prev-passage').addEventListener('click', function () {
      var idx = window.LensState.currentPassageIndex;
      if (idx > 0) {
        window.LensActions.setCurrentPassage(idx - 1);
        DOM.renderPassage();
      }
    });
    $('#btn-next-passage').addEventListener('click', function () {
      var idx = window.LensState.currentPassageIndex;
      if (idx < window.LensState.passages.length - 1) {
        window.LensActions.setCurrentPassage(idx + 1);
        DOM.renderPassage();
      } else {
        // End of passages — go to completion
        DOM.renderCompletion();
        DOM.showScreen('complete');
      }
    });

    // Justification dialog
    var justifyText = $('#justify-text');
    justifyText.addEventListener('input', function () {
      $('#justify-counter').textContent = justifyText.value.length + ' / 500 characters';
    });
    $('#btn-justify-submit').addEventListener('click', function () {
      var dlg = $('#justify-dialog');
      var tokenIndex = parseInt(dlg.dataset.tokenIndex, 10);
      var lensId = dlg.dataset.lens;
      var text = justifyText.value.trim();
      if (text.length > 0) {
        window.LensActions.recordJustification(tokenIndex, lensId, text);
        Audio.stamp();
        window.HUD.polite('Justification recorded.');
      }
      dlg.close();
    });
    $('#btn-justify-skip').addEventListener('click', function () {
      $('#justify-dialog').close();
    });

    // Reflection screen
    $('#btn-back-to-reading').addEventListener('click', function () {
      DOM.showScreen('reading');
      DOM.renderPassage();
    });
    $('#btn-continue').addEventListener('click', function () {
      var idx = window.LensState.currentPassageIndex;
      if (idx < window.LensState.passages.length - 1) {
        window.LensActions.setCurrentPassage(idx + 1);
        DOM.showScreen('reading');
        DOM.renderPassage();
        window.HUD.polite('Now reading ' + window.currentPassage().reference);
      } else {
        DOM.renderCompletion();
        DOM.showScreen('complete');
        window.HUD.assertive('All four passages complete. Reading session finished.');
      }
    });

    // Completion screen
    $('#btn-restart').addEventListener('click', function () {
      window.LensActions.restartAll();
      DOM.showScreen('reading');
      DOM.renderPassage();
    });
    $('#btn-debrief').addEventListener('click', function () {
      window.HUD.assertive('Begin class debrief — see teacher.');
    });

    // Pause dialog
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && window.GAME_RUNNING) {
        var dlg = $('#pause-dialog');
        var justifyDlg = $('#justify-dialog');
        var howDlg = $('#how-dialog');
        if (dlg && !dlg.open && !justifyDlg.open && !howDlg.open) {
          dlg.showModal();
        }
      }
    });
    $('#btn-resume').addEventListener('click', function () { $('#pause-dialog').close(); });
    $('#btn-mute').addEventListener('click', function () {
      var muted = window.LensActions.toggleMute();
      $('#btn-mute').textContent = muted ? 'Unmute sound' : 'Mute sound';
      window.HUD.polite(muted ? 'Sound muted.' : 'Sound on.');
    });
    $('#btn-pause-restart').addEventListener('click', function () {
      window.LensActions.restartCurrentPassage();
      DOM.renderPassage();
      $('#pause-dialog').close();
    });
    $('#btn-pause-quit').addEventListener('click', function () {
      $('#pause-dialog').close();
      window.LensActions.restartAll();
      DOM.showScreen('title');
      window.GAME_RUNNING = false;
    });

    // Focus trap for native <dialog> (showModal() does not fully trap)
    document.querySelectorAll('dialog').forEach(function (dlg) {
      dlg.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var focusables = dlg.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });
    });
  }

  // ============ EventBus subscriptions (state → DOM/audio) ============

  function wireEventBus() {
    EventBus.on('lens-switched', function (payload) {
      Audio.init();
      Audio.projectorClick();
      DOM.tintSweep(payload.lens);
      DOM.applyAllMarks();
      DOM.updateLensTray();
      DOM.renderProgressGrid();
      // Update activeLens dataset on passage container to drive dim styling
      var pt = DOM.$('#passage-text');
      if (pt) pt.dataset.activeLens = payload.lens;
      var lens = window.LensState.lensById[payload.lens];
      DOM.flashLensBrief(payload.lens);
      window.HUD.polite('Lens switched to ' + lens.label + '.');
    });

    EventBus.on('mark-placed', function (payload) {
      Audio.thunk();
      DOM.applyAllMarks();
      DOM.updateLensTray();
      var lens = window.LensState.lensById[payload.lens];
      window.HUD.polite('Marked phrase under ' + lens.label + ' lens.');
    });

    EventBus.on('mark-removed', function (payload) {
      Audio.scratch();
      DOM.applyAllMarks();
      DOM.updateLensTray();
      window.HUD.polite('Mark removed.');
    });

    EventBus.on('justification-requested', function (payload) {
      DOM.showJustifyDialog(payload.tokenIndex, payload.lens);
    });

    EventBus.on('passage-changed', function () {
      DOM.renderPassage();
    });

    EventBus.on('passage-restarted', function () {
      DOM.renderPassage();
      window.HUD.polite('Passage reset.');
    });

    EventBus.on('all-restarted', function () {
      DOM.renderPassage();
      window.HUD.polite('All passages reset.');
    });
  }

  // ============ Boot ============

  function bootAll() {
    window.__BOOT_STAGE__ = 'starting';
    try {
      bootPhaser();
      window.__BOOT_STAGE__ = 'phaser-booted';
    } catch (e) {
      window.__BOOT_STAGE__ = 'phaser-failed: ' + e.message;
      console.error('bootPhaser failed:', e);
    }
    try {
      wireDOMEvents();
      window.__BOOT_STAGE__ += ' | dom-wired';
    } catch (e) {
      window.__BOOT_STAGE__ += ' | dom-failed: ' + e.message;
      console.error('wireDOMEvents failed:', e);
    }
    try {
      wireEventBus();
      window.__BOOT_STAGE__ += ' | bus-wired';
    } catch (e) {
      window.__BOOT_STAGE__ += ' | bus-failed: ' + e.message;
      console.error('wireEventBus failed:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAll);
  } else {
    // Body already parsed (script is at end of body) — boot immediately
    bootAll();
  }

  // ============ Save state on blur ============

  function saveSnapshot() {
    try {
      var snapshot = {
        currentPassageIndex: window.LensState.currentPassageIndex,
        perPassage: window.LensState.perPassage,
        muted: window.LensState.muted,
        savedAt: new Date().toISOString()
      };
      sessionStorage.setItem('through-the-lens-state', JSON.stringify(snapshot));
    } catch (e) {
      // sessionStorage may not be available — fail silent
    }
  }
  window.addEventListener('blur', saveSnapshot);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') saveSnapshot();
  });
})();
