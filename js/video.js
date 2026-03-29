/**
 * Video playback lifecycle management.
 * Handles autoplay, tap-to-play overlay, and pause on leave.
 */
const Video = (() => {
  function initOverlays() {
    document.querySelectorAll('.video-overlay').forEach(overlay => {
      overlay.addEventListener('click', () => {
        const container = overlay.closest('.video-container');
        const video = container.querySelector('video');
        overlay.classList.add('hidden');
        video.play().catch(() => {
          // If play fails even on tap, show overlay again
          overlay.classList.remove('hidden');
        });
      });
    });
  }

  function playOnScreen(screen) {
    const video = screen.querySelector('video');
    if (!video) return;

    const overlay = screen.querySelector('.video-overlay');

    // Try autoplay
    const playPromise = video.play();
    if (playPromise) {
      playPromise.then(() => {
        // Autoplay succeeded, hide overlay
        if (overlay) overlay.classList.add('hidden');
      }).catch(() => {
        // Autoplay blocked — show tap overlay
        if (overlay) overlay.classList.remove('hidden');
      });
    }
  }

  function pauseOnScreen(screen) {
    const video = screen.querySelector('video');
    if (!video) return;
    video.pause();
  }

  function pauseAll() {
    document.querySelectorAll('video').forEach(v => v.pause());
  }

  return { initOverlays, playOnScreen, pauseOnScreen, pauseAll };
})();
