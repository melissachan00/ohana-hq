/**
 * Core navigation and state management for the Ohana HQ spy game.
 * Manages screen transitions, button states, and game flow.
 */
(() => {
  const TOTAL_SCREENS = 28; // screens 0-27
  const MISSION_SELECT_SCREEN = 3;
  const TASK_SCREENS = [6, 10, 14, 18, 22, 26]; // screens that require answer validation
  const LAST_SCREEN = TOTAL_SCREENS - 1;

  let currentScreen = 0;
  const completedMissions = new Set();

  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  const screens = document.querySelectorAll('.screen');

  function init() {
    Video.initOverlays();
    DragDrop.init();
    initDecodePuzzle();

    btnBack.addEventListener('click', goBack);
    btnNext.addEventListener('click', goNext);

    // Submit buttons (missions 1-5)
    document.querySelectorAll('[data-submit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mission = parseInt(btn.dataset.submit);
        handleSubmit(mission);
      });
    });

    // Allow Enter key on inputs to submit
    document.querySelectorAll('.input-field').forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const card = input.closest('.card');
          const submitBtn = card.querySelector('[data-submit]');
          if (submitBtn) submitBtn.click();
        }
      });
    });

    // Mission select buttons
    const btnHQ = document.getElementById('btn-hq-intruder');
    const btnBuzzer = document.getElementById('btn-missing-buzzer');
    if (btnHQ) btnHQ.addEventListener('click', () => goToScreen(MISSION_SELECT_SCREEN + 1));
    if (btnBuzzer) btnBuzzer.addEventListener('click', () => { window.location.href = 'golden-buzzer.html'; });

    updateNav();

    // Debug: jump to screen via ?screen=N or #N
    const debugScreen = new URLSearchParams(window.location.search).get('screen')
      || (window.location.hash && window.location.hash.slice(1));
    if (debugScreen) {
      for (let m = 1; m <= 6; m++) completedMissions.add(m);
      goToScreen(parseInt(debugScreen));
    }
  }

  // --- Decode puzzle (Mission 5) ---
  function initDecodePuzzle() {
    const boxes = document.querySelectorAll('.location-box');
    const feedback = document.getElementById('puzzle-feedback');
    if (!boxes.length) return;

    boxes.forEach((box, i) => {
      box.addEventListener('input', () => {
        box.value = box.value.toUpperCase();
        if (box.value && i < boxes.length - 1) {
          boxes[i + 1].focus();
        }
        checkDecode(boxes, feedback);
      });

      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && i > 0) {
          boxes[i - 1].focus();
          boxes[i - 1].value = '';
          e.preventDefault();
        }
      });
    });
  }

  async function checkDecode(boxes, feedback) {
    const attempt = Array.from(boxes).map(b => b.value.toUpperCase()).join('');
    if (attempt.length < Answers.DECODE_LENGTH) {
      feedback.textContent = '';
      feedback.className = 'puzzle-feedback';
      return;
    }

    if (await Answers.validate(5)) {
      completedMissions.add(5);
      feedback.textContent = 'Location decoded!';
      feedback.className = 'puzzle-feedback feedback--success';
      boxes.forEach(b => b.classList.add('correct'));
      updateNav();
      btnNext.classList.add('glow-pulse');
    } else {
      feedback.textContent = 'Incorrect. Try again, Agent.';
      feedback.className = 'puzzle-feedback feedback--error';
      boxes.forEach(b => {
        b.classList.add('error');
        setTimeout(() => b.classList.remove('error'), 400);
      });
    }
  }

  // --- Navigation ---
  function goToScreen(n) {
    if (n < 0 || n >= TOTAL_SCREENS) return;

    const prevScreen = screens[currentScreen];
    const nextScreen = screens[n];

    // Leave current screen
    Video.leaveScreen(prevScreen);
    stopMatrixOnScreen(prevScreen);

    prevScreen.classList.remove('active');
    nextScreen.classList.add('active');

    currentScreen = n;

    // Enter new screen
    const type = nextScreen.dataset.type;
    if (type === 'video') {
      Video.enterScreen(nextScreen);
    } else if (type === 'confirmation') {
      startMatrixOnScreen(nextScreen);
      // Handle video on confirmation screen (finale)
      const overlay = nextScreen.querySelector('.video-overlay');
      if (overlay) overlay.classList.remove('hidden');
      const vid = nextScreen.querySelector('video');
      if (vid) vid.load();
    } else if (type === 'task' && nextScreen.dataset.mission === '5') {
      // Focus first empty decode box
      setTimeout(() => {
        const firstEmpty = nextScreen.querySelector('.location-box:not(.correct)');
        if (firstEmpty) firstEmpty.focus();
      }, 300);
    }

    updateNav();
    nextScreen.scrollTop = 0;
  }

  function goBack() {
    if (currentScreen > 0) {
      goToScreen(currentScreen - 1);
    }
  }

  function goNext() {
    if (currentScreen === LAST_SCREEN) {
      window.location.href = 'golden-buzzer.html';
      return;
    }
    if (currentScreen < TOTAL_SCREENS - 1 && isNextAllowed()) {
      goToScreen(currentScreen + 1);
    }
  }

  function isNextAllowed() {
    const screen = screens[currentScreen];
    const mission = parseInt(screen.dataset.mission);

    if (TASK_SCREENS.includes(currentScreen)) {
      return completedMissions.has(mission);
    }

    return true;
  }

  async function handleSubmit(mission) {
    const feedbackEl = document.querySelector(`[data-feedback="${mission}"]`);

    if (await Answers.validate(mission)) {
      completedMissions.add(mission);
      if (feedbackEl) {
        feedbackEl.textContent = 'Correct! Report accepted.';
        feedbackEl.className = 'feedback feedback--success';
      }
      const screen = screens[currentScreen];
      const card = screen.querySelector('.card');
      if (card) card.classList.add('success');

      updateNav();
      btnNext.classList.add('glow-pulse');
    } else {
      if (feedbackEl) {
        feedbackEl.textContent = 'Incorrect. Try again, Agent.';
        feedbackEl.className = 'feedback feedback--error';
      }
      const screen = screens[currentScreen];
      screen.querySelectorAll('.input-field').forEach(input => {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 400);
      });
      if (mission === 3) {
        const dragList = document.getElementById('drag-list');
        if (dragList) {
          dragList.style.animation = 'shake 0.4s ease';
          setTimeout(() => dragList.style.animation = '', 400);
        }
      }
    }
  }

  function updateNav() {
    // Back button
    btnBack.style.display = currentScreen === 0 ? 'none' : '';

    // Hide Next on mission select (mission buttons handle navigation)
    if (currentScreen === MISSION_SELECT_SCREEN) {
      btnNext.style.display = 'none';
      return;
    }

    // Next / Ohana HQ button
    if (currentScreen === LAST_SCREEN) {
      btnNext.style.display = '';
      btnNext.textContent = 'Next Mission';
      btnNext.disabled = false;
      btnNext.classList.add('glow-pulse');
    } else {
      btnNext.textContent = 'Next';
      btnNext.style.display = '';
      const allowed = isNextAllowed();
      btnNext.disabled = !allowed;
      if (!allowed) {
        btnNext.classList.remove('glow-pulse');
      }
    }

    // On splash, make NEXT full width
    if (currentScreen === 0) {
      btnNext.classList.add('btn--full');
    } else {
      btnNext.classList.remove('btn--full');
    }
  }

  function startMatrixOnScreen(screen) {
    const canvas = screen.querySelector('.matrix-canvas');
    if (canvas) Matrix.start(canvas);
  }

  function stopMatrixOnScreen(screen) {
    const canvas = screen.querySelector('.matrix-canvas');
    if (canvas) Matrix.stop(canvas);
  }

  // Boot
  init();
})();
