/**
 * Touch-based drag-and-drop reorder for Mission 3.
 * Uses touch events with a ghost element that follows the finger.
 */
const DragDrop = (() => {
  let dragItem = null;
  let ghost = null;
  let placeholder = null;
  let startY = 0;
  let list = null;

  function init() {
    list = document.getElementById('drag-list');
    if (!list) return;

    list.addEventListener('touchstart', onTouchStart, { passive: false });
    list.addEventListener('touchmove', onTouchMove, { passive: false });
    list.addEventListener('touchend', onTouchEnd);

    // Mouse fallback for desktop testing
    list.addEventListener('mousedown', onMouseDown);
  }

  function onTouchStart(e) {
    const handle = e.target.closest('.drag-handle');
    if (!handle) return;
    e.preventDefault();

    const item = handle.closest('.drag-item');
    const touch = e.touches[0];
    startDrag(item, touch.clientX, touch.clientY);
  }

  function onTouchMove(e) {
    if (!dragItem) return;
    e.preventDefault();
    const touch = e.touches[0];
    moveDrag(touch.clientX, touch.clientY);
  }

  function onTouchEnd() {
    if (!dragItem) return;
    endDrag();
  }

  function onMouseDown(e) {
    const handle = e.target.closest('.drag-handle');
    if (!handle) return;
    e.preventDefault();

    const item = handle.closest('.drag-item');
    startDrag(item, e.clientX, e.clientY);

    const moveHandler = (ev) => moveDrag(ev.clientX, ev.clientY);
    const upHandler = () => {
      endDrag();
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  }

  function startDrag(item, x, y) {
    dragItem = item;
    startY = y;

    // Create ghost
    ghost = item.cloneNode(true);
    ghost.classList.add('drag-ghost');
    const rect = item.getBoundingClientRect();
    ghost.style.width = rect.width + 'px';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    document.body.appendChild(ghost);

    // Create placeholder
    placeholder = document.createElement('div');
    placeholder.classList.add('drag-placeholder');
    placeholder.style.height = rect.height + 'px';
    item.parentNode.insertBefore(placeholder, item);

    // Hide original
    item.classList.add('dragging');
  }

  function moveDrag(x, y) {
    if (!ghost) return;

    const deltaY = y - startY;
    const rect = dragItem.getBoundingClientRect();
    ghost.style.top = (rect.top + deltaY) + 'px';

    // Find drop target
    const items = Array.from(list.querySelectorAll('.drag-item:not(.dragging)'));
    let target = null;

    for (const item of items) {
      const r = item.getBoundingClientRect();
      const midY = r.top + r.height / 2;
      if (y < midY) {
        target = item;
        break;
      }
    }

    // Move placeholder
    if (target) {
      list.insertBefore(placeholder, target);
    } else {
      list.appendChild(placeholder);
    }
  }

  function endDrag() {
    if (!dragItem || !placeholder) return;

    // Move item to placeholder position
    list.insertBefore(dragItem, placeholder);
    dragItem.classList.remove('dragging');

    // Clean up
    if (ghost) ghost.remove();
    if (placeholder) placeholder.remove();

    ghost = null;
    placeholder = null;
    dragItem = null;
  }

  function getOrder() {
    if (!list) return [];
    return Array.from(list.querySelectorAll('.drag-item')).map(
      item => item.dataset.value
    );
  }

  return { init, getOrder };
})();
