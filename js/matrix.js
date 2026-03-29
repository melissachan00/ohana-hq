/**
 * Matrix rain animation for confirmation screens.
 * Draws falling alphanumeric characters on a canvas.
 */
const Matrix = (() => {
  const chars = '0123456789ABCDEF';
  const activeCanvases = new Map();

  function start(canvas) {
    if (activeCanvases.has(canvas)) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const fontSize = 14;
    const cols = Math.floor(canvas.width / fontSize);
    const drops = new Array(cols).fill(1);

    // Randomize initial positions so it doesn't all start from top
    for (let i = 0; i < drops.length; i++) {
      drops[i] = Math.random() * -20;
    }

    function draw() {
      ctx.fillStyle = 'rgba(10, 22, 40, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(92, 224, 210, 0.7)';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        if (drops[i] < 0) {
          drops[i]++;
          continue;
        }
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Dim older characters
        ctx.fillStyle = `rgba(92, 224, 210, ${0.3 + Math.random() * 0.5})`;
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    const intervalId = setInterval(draw, 50);
    activeCanvases.set(canvas, intervalId);
  }

  function stop(canvas) {
    const intervalId = activeCanvases.get(canvas);
    if (intervalId) {
      clearInterval(intervalId);
      activeCanvases.delete(canvas);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function stopAll() {
    activeCanvases.forEach((id, canvas) => stop(canvas));
  }

  return { start, stop, stopAll };
})();
