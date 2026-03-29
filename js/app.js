/**
 * Core navigation and state management for the Ohana HQ spy game.
 * Manages screen transitions, button states, and game flow.
 */
(() => {
  const TOTAL_SCREENS = 23; // screens 0-22
  const TASK_SCREENS = [5, 9, 13, 17, 21]; // screens that require answer validation

  let currentScreen = 0;
  const completedMissions = new Set();

  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  const screens = document.querySelectorAll('.screen');

  function init() {
    Video.initOverlays();
    DragDrop.init();

    btnBack.addEventListener('click', goBack);
    btnNext.addEventListener('click', goNext);

    // Submit buttons
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

    updateNav();
  }

  function goToScreen(n) {
    if (n < 0 || n >= TOTAL_SCREENS) return;

    const prevScreen = screens[currentScreen];
    const nextScreen = screens[n];

    // Leave current screen
    Video.pauseOnScreen(prevScreen);
    stopMatrixOnScreen(prevScreen);

    prevScreen.classList.remove('active');
    nextScreen.classList.add('active');

    currentScreen = n;

    // Enter new screen
    const type = nextScreen.dataset.type;
    if (type === 'video') {
      Video.playOnScreen(nextScreen);
    } else if (type === 'confirmation') {
      startMatrixOnScreen(nextScreen);
    }

    updateNav();

    // Scroll to top of new screen
    nextScreen.scrollTop = 0;
  }

  function goBack() {
    if (currentScreen > 0) {
      goToScreen(currentScreen - 1);
    }
  }

  function goNext() {
    if (currentScreen < TOTAL_SCREENS - 1 && isNextAllowed()) {
      goToScreen(currentScreen + 1);
    }
  }

  function isNextAllowed() {
    const screen = screens[currentScreen];
    const mission = parseInt(screen.dataset.mission);

    // Task screens require completed mission
    if (TASK_SCREENS.includes(currentScreen)) {
      return completedMissions.has(mission);
    }

    return true;
  }

  function handleSubmit(mission) {
    const feedbackEl = document.querySelector(`[data-feedback="${mission}"]`);

    if (Answers.validate(mission)) {
      completedMissions.add(mission);
      if (feedbackEl) {
        feedbackEl.textContent = 'Correct! Report accepted.';
        feedbackEl.className = 'feedback feedback--success';
      }
      // Flash the card
      const screen = screens[currentScreen];
      const card = screen.querySelector('.card');
      if (card) card.classList.add('success');

      updateNav();

      // Enable NEXT with a glow
      btnNext.classList.add('glow-pulse');
    } else {
      if (feedbackEl) {
        feedbackEl.textContent = 'Incorrect. Try again, Agent.';
        feedbackEl.className = 'feedback feedback--error';
      }
      // Shake the input(s)
      const screen = screens[currentScreen];
      screen.querySelectorAll('.input-field').forEach(input => {
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 400);
      });
      // Shake drag list if mission 3
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
    if (currentScreen === 0) {
      btnBack.style.display = 'none';
    } else {
      btnBack.style.display = '';
    }

    // Next button
    const isLast = currentScreen === TOTAL_SCREENS - 1;
    if (isLast) {
      btnNext.style.display = 'none';
    } else {
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
