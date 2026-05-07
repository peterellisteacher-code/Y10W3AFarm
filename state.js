/* ============================================================
   THROUGH THE LENS — game state
   Plain JS object on window.LensState. Scenes read it; mutations
   go through the reducer functions. EventBus broadcasts changes.
   ============================================================ */

(function () {
  'use strict';

  // EventBus — single Phaser EventEmitter shared across scenes/DOM
  window.EventBus = window.EventBus || new Phaser.Events.EventEmitter();

  // -------- Initial state --------

  function freshPassageState() {
    return {
      currentLens: 'historical-political',
      // playerMarks: array of { tokenIndex, lens } for THIS passage
      playerMarks: [],
      // justifications: array of { tokenIndex, lens, text }
      justifications: [],
      // markCount per lens (drives the "every 3rd mark" prompt)
      markCount: {
        'historical-political': 0,
        'feminist': 0,
        'class-power': 0,
        'reader-response': 0
      },
      // touched: lens has been activated at least once
      touched: {
        'historical-political': false,
        'feminist': false,
        'class-power': false,
        'reader-response': false
      },
      developed: false,   // has the Reflection screen been viewed?
      hintShown: false,
      muted: false
    };
  }

  window.LensState = {
    // Loaded data
    passages: [],
    lenses: [],
    lensById: {},

    // Session-wide
    currentPassageIndex: 0,
    perPassage: [],   // freshPassageState() per passage

    // Settings
    muted: false,
    audioReady: false
  };

  // -------- Reducer-style mutations --------

  window.LensActions = {

    initFromData: function (passagesJson, lensesJson) {
      window.LensState.passages = passagesJson.passages;
      window.LensState.lenses = lensesJson.lenses;
      window.LensState.lensById = {};
      lensesJson.lenses.forEach(function (l) {
        window.LensState.lensById[l.id] = l;
      });
      // Initialise per-passage state
      window.LensState.perPassage = passagesJson.passages.map(function () {
        return freshPassageState();
      });
      // First lens is touched by default for the first passage
      window.LensState.perPassage[0].touched['historical-political'] = true;
      EventBus.emit('state-initialised');
    },

    setCurrentPassage: function (index) {
      if (index < 0 || index >= window.LensState.passages.length) return;
      window.LensState.currentPassageIndex = index;
      var p = window.LensState.perPassage[index];
      p.touched[p.currentLens] = true;
      EventBus.emit('passage-changed', { index: index });
    },

    setActiveLens: function (lensId) {
      if (!window.LensState.lensById[lensId]) return;
      var p = currentPassageState();
      var prev = p.currentLens;
      if (prev === lensId) return;
      p.currentLens = lensId;
      p.touched[lensId] = true;
      EventBus.emit('lens-switched', { lens: lensId, previous: prev });
    },

    toggleMark: function (tokenIndex) {
      var p = currentPassageState();
      var lens = p.currentLens;
      var existingIdx = p.playerMarks.findIndex(function (m) {
        return m.tokenIndex === tokenIndex && m.lens === lens;
      });
      if (existingIdx >= 0) {
        p.playerMarks.splice(existingIdx, 1);
        EventBus.emit('mark-removed', { tokenIndex: tokenIndex, lens: lens });
      } else {
        var mark = { tokenIndex: tokenIndex, lens: lens };
        p.playerMarks.push(mark);
        // Determine correctness for adaptive prompt frequency
        var isExpert = isExpertMark(tokenIndex, lens);
        if (isExpert) {
          p.markCount[lens] = (p.markCount[lens] || 0) + 1;
        }
        EventBus.emit('mark-placed', {
          tokenIndex: tokenIndex,
          lens: lens,
          isExpert: isExpert,
          markCountForLens: p.markCount[lens] || 0
        });
        // Prompt for justification every 3rd EXPERT mark for this lens (1st, 4th, 7th)
        var lensExpertCount = p.playerMarks.filter(function (m) {
          return m.lens === lens && isExpertMark(m.tokenIndex, m.lens);
        }).length;
        if (isExpert && lensExpertCount > 0 && lensExpertCount % 3 === 1 && !hasJustification(tokenIndex, lens)) {
          // Defer prompt to allow visual underline to render first
          setTimeout(function () {
            EventBus.emit('justification-requested', {
              tokenIndex: tokenIndex,
              lens: lens
            });
          }, 350);
        }
      }
    },

    recordJustification: function (tokenIndex, lens, text) {
      var p = currentPassageState();
      // Replace if exists
      var existing = p.justifications.findIndex(function (j) {
        return j.tokenIndex === tokenIndex && j.lens === lens;
      });
      var entry = { tokenIndex: tokenIndex, lens: lens, text: text };
      if (existing >= 0) p.justifications[existing] = entry;
      else p.justifications.push(entry);
      EventBus.emit('justification-recorded', entry);
    },

    markDeveloped: function () {
      var p = currentPassageState();
      p.developed = true;
      EventBus.emit('passage-developed', { index: window.LensState.currentPassageIndex });
    },

    setHintShown: function () {
      currentPassageState().hintShown = true;
      EventBus.emit('hint-shown', { lens: currentPassageState().currentLens });
    },

    toggleMute: function () {
      window.LensState.muted = !window.LensState.muted;
      EventBus.emit('mute-toggled', { muted: window.LensState.muted });
      return window.LensState.muted;
    },

    restartCurrentPassage: function () {
      var idx = window.LensState.currentPassageIndex;
      window.LensState.perPassage[idx] = freshPassageState();
      window.LensState.perPassage[idx].touched['historical-political'] = true;
      EventBus.emit('passage-restarted', { index: idx });
    },

    restartAll: function () {
      window.LensState.currentPassageIndex = 0;
      window.LensState.perPassage = window.LensState.passages.map(function () {
        return freshPassageState();
      });
      window.LensState.perPassage[0].touched['historical-political'] = true;
      EventBus.emit('all-restarted');
    }
  };

  // -------- Selectors --------

  function currentPassageState() {
    return window.LensState.perPassage[window.LensState.currentPassageIndex];
  }
  window.currentPassageState = currentPassageState;

  function currentPassage() {
    return window.LensState.passages[window.LensState.currentPassageIndex];
  }
  window.currentPassage = currentPassage;

  function isExpertMark(tokenIndex, lens) {
    var passage = currentPassage();
    if (!passage) return false;
    return passage.expertMarks.some(function (em) {
      return em.tokenIndex === tokenIndex && em.lens === lens;
    });
  }
  window.isExpertMark = isExpertMark;

  function hasJustification(tokenIndex, lens) {
    return currentPassageState().justifications.some(function (j) {
      return j.tokenIndex === tokenIndex && j.lens === lens;
    });
  }
  window.hasJustification = hasJustification;

  // Aggregate stats across all passages (for the Completion screen)
  window.aggregateStats = function () {
    var totalMarks = 0;
    var expertMarks = 0;
    var falsePos = 0;
    var justifications = 0;
    var passagesDeveloped = 0;
    var lensesUsed = new Set();

    window.LensState.perPassage.forEach(function (ps, pi) {
      var passage = window.LensState.passages[pi];
      if (ps.developed) passagesDeveloped += 1;
      ps.playerMarks.forEach(function (m) {
        totalMarks += 1;
        lensesUsed.add(m.lens);
        var isExpert = passage.expertMarks.some(function (em) {
          return em.tokenIndex === m.tokenIndex && em.lens === m.lens;
        });
        if (isExpert) expertMarks += 1;
        else falsePos += 1;
      });
      justifications += ps.justifications.length;
    });

    return {
      totalMarks: totalMarks,
      expertMarks: expertMarks,
      falsePositives: falsePos,
      justifications: justifications,
      passagesDeveloped: passagesDeveloped,
      lensesUsedCount: lensesUsed.size
    };
  };
})();
