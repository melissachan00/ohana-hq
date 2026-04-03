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

  // Answer hashes
  const H = {
    a1: '05fa0965c7c35c471dd1e8474b76870be2ec1ce535c2b169ab4f3554ab17e436',
    a2: 'c006c7e3ab14d686f63524136f1ec7c5e553d839bc01c851e4dc9de2bdbfc589',
    a3: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    a4: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    a5: '2c624232cdd221771294dfbb310aca000a0df6ac8b66b696d90ef06fdefb64a3',
    a6: 'ee2aa44805b51b10883781d6754e94fd6c69bcaff7948f8f2b00c2ca02bc53e1',
    a7: '7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451',
    a8: 'e629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d8bdb',
    a9: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
    a10: 'f5ca38f748a1d6eaf726b8a42fb575c3c71f1864a8143301782de13da2d9202b',
    a11: 'b6e09142c9b187ff70f975531fbf1d4f6cfc479fb41360f41233b48b942774b6',
    a12: 'c945e4cd2c8fdb3ef98759a480b723619ca976f724ab95798cf63dfc04653afe',
    a13: '07af35cdeb34f7336911bcdb7adcc641c893f0bc77c6baea28f902d4368d5561',
  };

  const ANSWERS = {
    1: async () => {
      const shape = getVal('shape');
      const color = getVal('color');
      const sOk = await Hash.checkAsync(shape, H.a1);
      const cOk = await Hash.checkAsync(color, H.a2);
      return sOk && cOk;
    },
    2: async () => {
      const t = await Hash.checkAsync(getVal('towers'), H.a3);
      const l = await Hash.checkAsync(getVal('lanes'), H.a4);
      return t && l;
    },
    3: async () => Hash.checkAsync(getVal('windows'), H.a5),
    4: async () => Hash.checkAsync(getVal('c4').replace(/\s/g, ''), H.a6),
    5: async () => Hash.checkAsync(getVal('floor'), H.a7),
    6: async () => Hash.checkAsync(getVal('cables'), H.a8),
    7: async () => Hash.checkAsync(getVal('towers-gg'), H.a9),
    8: async () => Hash.checkAsync(getVal('mosaic'), H.a10),
    9: async () => {
      const note = getVal('note');
      const a = await Hash.checkAsync(note.replace(/\s/g, ''), H.a11);
      const b = await Hash.checkAsync(note, H.a12);
      return a || b;
    },
    10: async () => {
      const boxes = document.querySelectorAll('.decode-box');
      const attempt = Array.from(boxes).map(b => b.value.toUpperCase()).join('');
      return Hash.checkAsync(attempt, H.a13);
    }
  };

  // Puzzle status reveals use encoded values
  const R = [
    [66,76,65,67,75,32,67,89,76,73,78,68,69,82],
    [52],[53],[56],[54],[71],[79],[65],[84]
  ];
  const dec = arr => arr.map(c => String.fromCharCode(c)).join('');
  const REVEALS = {
    1: { object: dec(R[0]) },
    2: { c1: dec(R[1]), c2: dec(R[2]) },
    3: { c3: dec(R[3]) },
    4: { c4: dec(R[4]) },
    5: { l1: dec(R[5]) },
    6: { l2: dec(R[6]) },
    7: { l3: dec(R[7]) },
    8: { l4: dec(R[8]) }
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
    const clue4Input = document.querySelector('[data-answer="c4"]');
    const letterCountEl = document.getElementById('letter-count');
    if (clue4Input && letterCountEl) {
      const updateCount = () => {
        const len = clue4Input.value.trim().replace(/\s/g, '').length;
        letterCountEl.textContent = len > 0 ? `Letter count: ${len}` : '';
      };
      clue4Input.addEventListener('input', updateCount);
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

  async function handleSubmit(clue) {
    const feedbackEl = document.querySelector(`[data-feedback="${clue}"]`);
    const validator = ANSWERS[clue];

    if (validator && await validator()) {
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
