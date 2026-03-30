/**
 * Video playback lifecycle management.
 * Tap-to-play with overlay, pause on screen leave.
 */
const Video = (() => {
  function initOverlays() {
    document.querySelectorAll('.video-overlay').forEach(overlay => {
      overlay.addEventListener('click', () => {
        const container = overlay.closest('.video-container');
        const video = container.querySelector('video');
        overlay.classList.add('hidden');
        video.play().catch(() => {
          overlay.classList.remove('hidden');
        });
      });
    });

    // When video ends, show overlay again so user can replay
    document.querySelectorAll('.video-container video').forEach(video => {
      video.addEventListener('ended', () => {
        const overlay = video.parentElement.querySelector('.video-overlay');
        if (overlay) overlay.classList.remove('hidden');
        video.currentTime = 0;
      });
    });
  }

  function enterScreen(screen) {
    const video = screen.querySelector('video');
    if (!video) return;

    const overlay = screen.querySelector('.video-overlay');

    // Reset: show overlay, rewind if needed
    if (overlay) overlay.classList.remove('hidden');
    video.load(); // ensure the video is ready to play on tap
  }

  function leaveScreen(screen) {
    const video = screen.querySelector('video');
    if (!video) return;
    video.pause();
  }

  return { initOverlays, enterScreen, leaveScreen };
})();
