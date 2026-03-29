/**
 * Answer validation for all 5 missions.
 * Each validate function returns true/false.
 */
const Answers = (() => {
  const correctAnswers = {
    1: '12',
    2: 'steinway',
    5: 'smith',
  };

  const correctOrder3 = [
    'Trust',
    'Customer Success',
    'Innovation',
    'Equality',
    'Sustainability',
  ];

  const correctPhrases4 = {
    a: 'all are welcome',
    b: 'blaze your trail',
  };

  function validate(mission) {
    switch (mission) {
      case 1: return validateText(1);
      case 2: return validateText(2);
      case 3: return validateDragOrder();
      case 4: return validateDualInput();
      case 5: return validateText(5);
      default: return false;
    }
  }

  function validateText(mission) {
    const input = document.querySelector(`[data-answer="${mission}"]`);
    if (!input) return false;
    const value = input.value.trim().toLowerCase();
    return value === correctAnswers[mission];
  }

  function validateDragOrder() {
    const order = DragDrop.getOrder();
    if (order.length !== correctOrder3.length) return false;
    return order.every((val, i) => val === correctOrder3[i]);
  }

  function validateDualInput() {
    const inputA = document.querySelector('[data-answer="4a"]');
    const inputB = document.querySelector('[data-answer="4b"]');
    if (!inputA || !inputB) return false;
    const a = inputA.value.trim().toLowerCase();
    const b = inputB.value.trim().toLowerCase();
    return a === correctPhrases4.a && b === correctPhrases4.b;
  }

  return { validate };
})();
