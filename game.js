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

  // ============ PDF Export (pdfmake) ============
  // Builds a structured PDF of the student's marks + justifications across
  // all four passages. Triggered by the Save my Work button. Uses pdfmake
  // loaded from CDN (defer-loaded; fall back to print dialog if unavailable).
  window.PDFExport = (function () {

    // Lens colours mirrored for PDF rendering
    var LENS_COLOURS = {
      'historical-political': '#8B0000',
      'feminist': '#6B4226',
      'class-power': '#1B4332',
      'reader-response': '#3D405B'
    };

    function ready() {
      return typeof window.pdfMake !== 'undefined' && window.pdfMake.createPdf;
    }

    function promptStudentName() {
      // Use a tiny prompt — students can leave blank.
      var existing = sessionStorage.getItem('through-the-lens-student-name') || '';
      var name = window.prompt('Your name (so the PDF has it on the cover). You can leave this blank.', existing);
      if (name === null) return null;  // cancelled
      name = (name || '').trim();
      if (name) sessionStorage.setItem('through-the-lens-student-name', name);
      return name;
    }

    function buildDocDefinition(studentName) {
      var passages = window.LensState.passages;
      var lenses = window.LensState.lenses;
      var perPassage = window.LensState.perPassage;
      var today = new Date().toISOString().slice(0, 10);

      var content = [];

      // Cover
      content.push({ text: 'Through the Lens', style: 'title' });
      content.push({ text: 'Reading Animal Farm with four critical lenses', style: 'subtitle' });
      content.push({ text: ' ', margin: [0, 8] });
      if (studentName) {
        content.push({ text: studentName, style: 'studentName' });
      }
      content.push({ text: 'Date: ' + today, style: 'metaLine' });
      content.push({ text: 'Year 10 English -- Animal Farm Novel Study', style: 'metaLine' });
      content.push({ canvas: [{ type: 'line', x1: 0, y1: 8, x2: 515, y2: 8, lineWidth: 2, lineColor: '#0D1B2A' }] });
      content.push({ text: ' ', margin: [0, 8] });
      content.push({
        text: 'In this booklet you will find the four passages from Animal Farm, the lines you marked under each lens, the notes you wrote, and what an expert noticed. Use it when you write your essay.',
        style: 'introBlurb'
      });

      // Lens key
      content.push({ text: 'The four lenses', style: 'h2', pageBreak: 'before' });
      lenses.forEach(function (lens) {
        content.push({
          stack: [
            { text: lens.letter + '  ' + lens.label, style: 'lensName', color: LENS_COLOURS[lens.id] },
            { text: lens.definition, style: 'lensDef' }
          ],
          margin: [0, 0, 0, 14]
        });
      });

      // One section per passage
      passages.forEach(function (passage, pi) {
        var ps = perPassage[pi];
        content.push({ text: passage.reference, style: 'h2', pageBreak: 'before' });
        content.push({ text: passage.context, style: 'context' });

        // The passage text with marker letters before phrases
        var passageRich = [];
        passage.tokens.forEach(function (token, ti) {
          var lensesOnToken = ps.playerMarks
            .filter(function (m) { return m.tokenIndex === ti; })
            .map(function (m) { return m.lens; });
          if (lensesOnToken.length > 0) {
            // Insert lens letters before the phrase
            lensesOnToken.forEach(function (lensId) {
              var L = window.LensState.lensById[lensId];
              passageRich.push({ text: '[' + L.letter + '] ', color: LENS_COLOURS[lensId], bold: true });
            });
          }
          passageRich.push({ text: token + ' ', color: '#0D1B2A' });
        });
        content.push({ text: passageRich, style: 'passageBody' });

        // Per-lens marks + notes
        lenses.forEach(function (lens) {
          var expertMarksForLens = passage.expertMarks.filter(function (em) { return em.lens === lens.id; });
          var playerMarksForLens = ps.playerMarks.filter(function (m) { return m.lens === lens.id; });
          if (expertMarksForLens.length === 0 && playerMarksForLens.length === 0) return;

          content.push({ text: lens.letter + '  ' + lens.label + ' lens', style: 'lensSection', color: LENS_COLOURS[lens.id] });

          // Expert marks (found / missed)
          expertMarksForLens.forEach(function (em) {
            var foundIt = playerMarksForLens.some(function (pm) { return pm.tokenIndex === em.tokenIndex; });
            var studentNote = ps.justifications.find(function (j) {
              return j.tokenIndex === em.tokenIndex && j.lens === lens.id;
            });
            content.push({
              stack: [
                { text: (foundIt ? '[V] You spotted: ' : '[ ] Expert spotted: ') + '"' + passage.tokens[em.tokenIndex] + '"', style: 'markQuote', italics: true },
                { text: 'Expert reading: ' + em.justification, style: 'expertReading' },
                studentNote && studentNote.text
                  ? { text: 'Your note: ' + studentNote.text, style: 'studentNote' }
                  : null
              ].filter(function (x) { return x; }),
              margin: [12, 4, 0, 8]
            });
          });

          // Student's own marks not in expert reading
          playerMarksForLens.forEach(function (pm) {
            var inExpert = expertMarksForLens.some(function (em) { return em.tokenIndex === pm.tokenIndex; });
            if (inExpert) return;
            var studentNote = ps.justifications.find(function (j) {
              return j.tokenIndex === pm.tokenIndex && j.lens === lens.id;
            });
            content.push({
              stack: [
                { text: '[+] You marked (not in expert reading): "' + passage.tokens[pm.tokenIndex] + '"', style: 'markQuote', italics: true, color: '#525B66' },
                studentNote && studentNote.text
                  ? { text: 'Your note: ' + studentNote.text, style: 'studentNote' }
                  : null
              ].filter(function (x) { return x; }),
              margin: [12, 4, 0, 8]
            });
          });
        });
      });

      return {
        content: content,
        defaultStyle: { font: 'Roboto', fontSize: 10, color: '#0D1B2A' },
        pageMargins: [54, 60, 54, 60],
        styles: {
          title: { fontSize: 32, bold: true, color: '#0D1B2A', margin: [0, 0, 0, 4] },
          subtitle: { fontSize: 14, italics: true, color: '#525B66', margin: [0, 0, 0, 16] },
          studentName: { fontSize: 18, bold: true, color: '#0D1B2A', margin: [0, 8, 0, 4] },
          metaLine: { fontSize: 10, color: '#525B66', margin: [0, 0, 0, 4] },
          introBlurb: { fontSize: 11, italics: true, margin: [0, 8, 0, 8] },
          h2: { fontSize: 20, bold: true, color: '#0D1B2A', margin: [0, 0, 0, 8] },
          context: { fontSize: 10, italics: true, color: '#525B66', margin: [0, 0, 0, 12] },
          passageBody: { fontSize: 12, lineHeight: 1.5, margin: [0, 0, 0, 16] },
          lensName: { fontSize: 13, bold: true, margin: [0, 0, 0, 4] },
          lensDef: { fontSize: 10, color: '#2A3848' },
          lensSection: { fontSize: 13, bold: true, margin: [0, 12, 0, 6] },
          markQuote: { fontSize: 11, color: '#0D1B2A' },
          expertReading: { fontSize: 10, color: '#2A3848', margin: [0, 2, 0, 0] },
          studentNote: { fontSize: 10, color: '#0D1B2A', italics: true, background: '#F5F5EE', margin: [0, 4, 0, 0] }
        }
      };
    }

    function run() {
      if (!ready()) {
        window.HUD.assertive('Could not save as PDF. The PDF tool failed to load. Try refreshing the page.');
        window.alert('The PDF tool has not finished loading. Please wait a few seconds and try again.\n\nIf that does not work, refresh the page (F5) and try once more.');
        return;
      }
      var name = promptStudentName();
      if (name === null) return;  // cancelled
      var docDef;
      try {
        docDef = buildDocDefinition(name);
      } catch (err) {
        console.error('PDF build failed:', err);
        window.HUD.assertive('Could not build the PDF. Try again.');
        return;
      }
      var fileName = 'animal-farm-lens-reading' +
        (name ? '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '') +
        '.pdf';
      try {
        window.pdfMake.createPdf(docDef).download(fileName);
        window.HUD.polite('PDF saved as ' + fileName);
      } catch (err) {
        console.error('PDF download failed:', err);
        window.HUD.assertive('Could not save the PDF. Try again.');
      }
    }

    return { run: run, ready: ready };
  })();

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

    var SCREEN_INSTRUCTIONS = {
      reading: 'Click any line that the lens helps you see. Click again on the same line to remove the mark. Click a coloured letter (H, F, C, R) to remove just that lens\'s mark. Switch lens any time using the buttons on the right.',
      reflection: 'Compare your marks with what the expert noticed. A tick means you both spotted it. A dot means the expert spotted it but you didn\'t -- that\'s OK. A faded line is one you marked that the expert didn\'t -- you might be seeing something they missed.',
      complete: 'Well done! You can save all your work as a PDF to use when you write your essay.'
    };

    function showScreen(name) {
      screens.forEach(function (s) {
        var el = document.getElementById('screen-' + s);
        if (el) el.classList.toggle('visible', s === name);
      });
      // Show / hide app-bar (everywhere except title)
      var appBar = document.getElementById('app-bar');
      if (appBar) {
        if (name === 'title') {
          appBar.setAttribute('hidden', '');
        } else {
          appBar.removeAttribute('hidden');
          var instr = document.getElementById('app-bar-instruction-text');
          if (instr) instr.textContent = SCREEN_INSTRUCTIONS[name] || '';
        }
      }
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
          '<span class="rubric-label">You are using:</span> ' +
          '<span class="rubric-name">' + escapeHtml(lens.label) + ' lens</span>';
      }
      // Update "what this lens helps you see"
      var huntFor = $('#active-lens-huntfor');
      if (huntFor) huntFor.textContent = lens.huntFor;
      // Update progress summary
      var progSummary = $('#progress-summary');
      if (progSummary) {
        progSummary.textContent = 'passage ' + (window.LensState.currentPassageIndex + 1) +
          ' of ' + window.LensState.passages.length;
      }
    }

    function renderPassage() {
      var passage = window.currentPassage();
      var p = window.currentPassageState();

      $('#passage-reference').textContent = passage.reference;
      $('#passage-context').textContent = passage.context;
      // Switch passage art via data attribute (CSS-bound to image)
      var art = $('#passage-art');
      if (art) art.dataset.passage = passage.id;

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
        btn.addEventListener('click', function (e) {
          // If the click landed on a chip, remove THAT lens's mark instead of toggling active.
          var chipEl = e.target.closest && e.target.closest('.phrase-chip');
          if (chipEl) {
            e.stopPropagation();
            var chipLens = chipEl.dataset.lens;
            window.LensActions.removeMark(i, chipLens);
            return;
          }
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
      var passage = window.currentPassage();

      // Clear all marks AND any chip elements
      $$('.phrase').forEach(function (el) {
        el.removeAttribute('data-active-marked');
        el.removeAttribute('data-other-marks');
        // Remove any chip wrappers we previously added
        var chips = el.querySelector('.phrase-chips');
        if (chips) chips.remove();
        // Reset to plain token text
        var idx = parseInt(el.dataset.tokenIndex, 10);
        var token = passage.tokens[idx];
        el.textContent = token;
        el.setAttribute('aria-label', 'Phrase ' + (idx + 1) + ': ' + token + '. Click or press Enter to mark with the ' + window.LensState.lensById[p.currentLens].label + ' lens.');
      });

      // Build per-token lens lists
      var marksByToken = {};
      p.playerMarks.forEach(function (m) {
        if (!marksByToken[m.tokenIndex]) marksByToken[m.tokenIndex] = [];
        marksByToken[m.tokenIndex].push(m.lens);
      });

      // Apply: active lens drives underline; other lenses appear as before-phrase chips
      Object.keys(marksByToken).forEach(function (tokIdx) {
        var lensesOnToken = marksByToken[tokIdx];
        var el = document.querySelector('.phrase[data-token-index="' + tokIdx + '"]');
        if (!el) return;

        var hasActiveMark = lensesOnToken.indexOf(p.currentLens) >= 0;
        if (hasActiveMark) {
          el.dataset.activeMarked = p.currentLens;
        }

        // Other-lens chips — show every lens mark EXCEPT the active one
        var otherLenses = lensesOnToken.filter(function (id) { return id !== p.currentLens; });
        if (otherLenses.length > 0) {
          var chipsWrap = document.createElement('span');
          chipsWrap.className = 'phrase-chips';
          chipsWrap.setAttribute('aria-hidden', 'true');
          // Order chips by lens display order
          window.LensState.lenses.forEach(function (lens) {
            if (otherLenses.indexOf(lens.id) >= 0) {
              var chip = document.createElement('span');
              chip.className = 'phrase-chip';
              chip.dataset.lens = lens.id;
              chip.textContent = lens.letter;
              chipsWrap.appendChild(chip);
            }
          });
          // Insert chips at the START of the phrase button
          el.insertBefore(chipsWrap, el.firstChild);
        }

        // aria-label lists ALL active lens marks
        var token = passage.tokens[parseInt(tokIdx, 10)];
        var lensLabels = lensesOnToken.map(function (id) {
          return window.LensState.lensById[id].label;
        }).join(', ');
        var activeLensLabel = window.LensState.lensById[p.currentLens].label;
        el.setAttribute('aria-label',
          'Phrase ' + (parseInt(tokIdx, 10) + 1) + ': ' + token +
          '. Currently marked with: ' + lensLabels + '. ' +
          (hasActiveMark
            ? 'Click to remove the ' + activeLensLabel + ' mark.'
            : 'Click to add a ' + activeLensLabel + ' mark.')
        );
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
          cell.setAttribute('role', 'img');
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

    // ===== App bar (Home / Save PDF / Help) — present on all non-title screens =====
    $('#btn-home').addEventListener('click', function () {
      window.GAME_RUNNING = false;
      DOM.showScreen('title');
      window.HUD.polite('Back to start screen.');
    });

    $('#btn-app-help').addEventListener('click', function () {
      var dlg = $('#how-dialog');
      if (typeof dlg.showModal === 'function') dlg.showModal();
    });

    function triggerPdfExport() {
      window.PDFExport.run();
    }
    $('#btn-save-pdf').addEventListener('click', triggerPdfExport);
    $('#btn-save-pdf-final').addEventListener('click', triggerPdfExport);

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
