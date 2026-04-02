/**
 * Navigation and answer validation for the Golden Buzzer mission.
 */
(() => {
  const TOTAL_SCREENS = 26; // screens 0-25
  const TASK_SCREENS = [3, 6, 9, 12, 15, 17, 19, 21, 22, 24]; // require answer
  const LAST_SCREEN = TOTAL_SCREENS - 1;

  let currentScreen = 0;
  const completedClues = new Set();

  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  const screens = document.querySelectorAll('.screen');

  // Answer definitions: clue number → validator function
  const ANSWERS = {
    1: () => {
      const shape = getVal('shape');
      const color = getVal('color');
      return shape.includes('cylinder') && color.includes('black');
    },
    2: () => getVal('towers') === '4' && getVal('lanes') === '5',
    3: () => getVal('windows') === '8',
    4: () => getVal('palace').replace(/\s/g, '') === 'palace',
    5: () => getVal('floor') === '7',
    6: () => getVal('cables') === '15',
    7: () => getVal('towers-gg') === '1',
    8: () => getVal('mosaic') === '20',
    9: () => {
      const note = getVal('note');
      return note.replace(/\s/g, '').includes('godubs') ||
             note.includes('go dubs');
    },
    10: () => {
      const boxes = document.querySelectorAll('.decode-box');
      const attempt = Array.from(boxes).map(b => b.value.toUpperCase()).join('');
      return attempt === 'GOAT';
    }
  };

  // Puzzle status reveals: clue → what to reveal
  const REVEALS = {
    1: { object: 'BLACK CYLINDER' },
    2: { c1: '4', c2: '5' },
    3: { c3: '8' },
    4: { c4: '6' },
    5: { l1: 'G' },
    6: { l2: 'O' },
    7: { l3: 'A' },
    8: { l4: 'T' }
  };

  function getVal(name) {
    const el = document.querySelector(`[data-answer="${name}"]`);
    return el ? el.value.trim().toLowerCase() : '';
  }

  function init() {
    btnBack.addEventListener('click', goBack);
    btnNext.addEventListener('click', goNext);

    // Submit buttons
    document.querySelectorAll('[data-submit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const clue = parseInt(btn.dataset.submit);
        handleSubmit(clue);
      });
    });

    // Enter key on inputs
    document.querySelectorAll('.input-field').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const card = input.closest('.card');
          const submitBtn = card.querySelector('[data-submit]');
          if (submitBtn) submitBtn.click();
        }
      });
    });

    // Live letter count for Clue 4
    const palaceInput = document.querySelector('[data-answer="palace"]');
    const letterCountEl = document.getElementById('letter-count');
    if (palaceInput && letterCountEl) {
      const updateCount = () => {
        const len = palaceInput.value.trim().replace(/\s/g, '').length;
        letterCountEl.textContent = len > 0 ? `Letter count: ${len}` : '';
      };
      palaceInput.addEventListener('input', updateCount);
    }

    // Decode boxes — auto-advance and uppercase
    const decodeBoxes = document.querySelectorAll('.decode-box');
    decodeBoxes.forEach((box, i) => {
      box.addEventListener('input', () => {
        box.value = box.value.toUpperCase();
        if (box.value && i < decodeBoxes.length - 1) {
          decodeBoxes[i + 1].focus();
        }
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && i > 0) {
          decodeBoxes[i - 1].focus();
          decodeBoxes[i - 1].value = '';
          e.preventDefault();
        }
      });
    });

    // Video overlay tap-to-play
    document.querySelectorAll('.video-overlay').forEach(overlay => {
      overlay.addEventListener('click', () => {
        const vid = overlay.parentElement.querySelector('video');
        if (vid) {
          overlay.classList.add('hidden');
          vid.play();
        }
      });
    });

    updateNav();

    // Debug: jump to screen via ?screen=N or #N
    const debugScreen = new URLSearchParams(window.location.search).get('screen')
      || (window.location.hash && window.location.hash.slice(1));
    if (debugScreen) {
      for (let c = 1; c <= 10; c++) completedClues.add(c);
      updatePuzzleStatus();
      goToScreen(parseInt(debugScreen));
    }
  }

  function updatePuzzleStatus() {
    // Update all reveal spans across all status screens
    document.querySelectorAll('.reveal').forEach(span => {
      const key = span.dataset.reveal;
      for (const [clue, reveals] of Object.entries(REVEALS)) {
        if (reveals[key] && completedClues.has(parseInt(clue))) {
          span.textContent = reveals[key];
          span.style.color = '#C8960C';
        }
      }
    });

    // Build animal word from letters
    if (completedClues.has(5) || completedClues.has(6) ||
        completedClues.has(7) || completedClues.has(8)) {
      const letters = [
        completedClues.has(5) ? 'G' : '_',
        completedClues.has(6) ? 'O' : '_',
        completedClues.has(7) ? 'A' : '_',
        completedClues.has(8) ? 'T' : '_'
      ].join('');
      document.querySelectorAll('[data-reveal="animal"]').forEach(span => {
        span.textContent = letters;
        if (completedClues.has(8)) span.style.color = '#C8960C';
      });
    }
  }

  // --- Navigation ---
  function goToScreen(n) {
    if (n < 0 || n >= TOTAL_SCREENS) return;

    const prevScreen = screens[currentScreen];
    const nextScreen = screens[n];

    stopMatrixOnScreen(prevScreen);
    // Pause video when leaving screen
    const vid = prevScreen.querySelector('video');
    if (vid) vid.pause();
    prevScreen.classList.remove('active');
    nextScreen.classList.add('active');
    currentScreen = n;

    if (nextScreen.dataset.type === 'confirmation') {
      startMatrixOnScreen(nextScreen);
      // Show video overlay and reload video on confirmation screen
      const overlay = nextScreen.querySelector('.video-overlay');
      if (overlay) overlay.classList.remove('hidden');
      const confirmVid = nextScreen.querySelector('video');
      if (confirmVid) confirmVid.load();
    }

    // Update puzzle status on any status screen
    if (nextScreen.dataset.type === 'status') {
      updatePuzzleStatus();
    }

    // Focus first decode box when entering decode screen
    if (nextScreen.dataset.clue === '10') {
      setTimeout(() => {
        const firstBox = nextScreen.querySelector('.decode-box');
        if (firstBox) firstBox.focus();
      }, 300);
    }

    updateNav();
    nextScreen.scrollTop = 0;
  }

  function goBack() {
    if (currentScreen > 0) goToScreen(currentScreen - 1);
  }

  function goNext() {
    if (currentScreen === LAST_SCREEN) {
      window.location.href = 'index.html';
      return;
    }
    if (currentScreen < TOTAL_SCREENS - 1 && isNextAllowed()) {
      goToScreen(currentScreen + 1);
    }
  }

  function isNextAllowed() {
    if (TASK_SCREENS.includes(currentScreen)) {
      const screen = screens[currentScreen];
      const clue = parseInt(screen.dataset.clue);
      return completedClues.has(clue);
    }
    return true;
  }

  function handleSubmit(clue) {
    const feedbackEl = document.querySelector(`[data-feedback="${clue}"]`);
    const validator = ANSWERS[clue];

    if (validator && validator()) {
      completedClues.add(clue);
      if (feedbackEl) {
        feedbackEl.textContent = 'Correct! Report accepted.';
        feedbackEl.className = 'feedback feedback--success';
      }
      const screen = screens[currentScreen];
      const card = screen.querySelector('.card');
      if (card) card.classList.add('success');

      // Mark decode boxes as correct
      if (clue === 10) {
        screen.querySelectorAll('.decode-box').forEach(b => b.classList.add('correct'));
      }

      updatePuzzleStatus();
      updateNav();
      btnNext.classList.add('glow-pulse');
    } else {
      if (feedbackEl) {
        feedbackEl.textContent = 'Incorrect. Try again, Agent.';
        feedbackEl.className = 'feedback feedback--error';
      }
      const screen = screens[currentScreen];
      screen.querySelectorAll('.input-field, .decode-box').forEach(input => {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 400);
      });
    }
  }

  function updateNav() {
    btnBack.style.display = currentScreen === 0 ? 'none' : '';

    if (currentScreen === LAST_SCREEN) {
      btnNext.textContent = 'Ohana HQ';
      btnNext.disabled = false;
      btnNext.classList.add('glow-pulse');
    } else {
      btnNext.textContent = 'Next';
      const allowed = isNextAllowed();
      btnNext.disabled = !allowed;
      if (!allowed) btnNext.classList.remove('glow-pulse');
    }

    btnNext.classList.toggle('btn--full', currentScreen === 0);
  }

  function startMatrixOnScreen(screen) {
    const canvas = screen.querySelector('.matrix-canvas');
    if (canvas && typeof Matrix !== 'undefined') Matrix.start(canvas);
  }

  function stopMatrixOnScreen(screen) {
    const canvas = screen.querySelector('.matrix-canvas');
    if (canvas && typeof Matrix !== 'undefined') Matrix.stop(canvas);
  }

  init();
})();
