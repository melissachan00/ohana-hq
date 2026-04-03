/**
 * Answer validation for all 6 missions.
 * Answers are SHA-256 hashed to prevent source-viewing cheats.
 */
const Answers = (() => {
  const H = {
    1: '6b51d431df5d7f141cbececcf79edf3dd861c3b4069f0b11661a3eefacbba918',
    2: 'b1da1c7fc57b77146756ddb0e66d7b3abd795ab27a9f6848b02a719cc4d2f9fe',
    6: '6627835f988e2c5e50533d491163072d3f4f41f5c8b04630150debb3722ca2dd',
    '4a': '10996fa17418a3e0b30a390e016da9a602deedd74a42be1a5a5d197d072519e8',
    '4b': '2cec2d267fce33b4861175eb2a480418a4f40943ce714876afc0599a473be484',
    order3: '7a6acfc97ee93701c8d2b4aec65d4c071db199a91b249ebba8d082357ef5e82e',
    decode: 'f7a7657c9b537ca8c1666cf1416bc5fb760b3a048b2a2642a753851687f8a3a4',
  };

  const DECODE_LENGTH = 9;

  async function validate(mission) {
    switch (mission) {
      case 1: return validateText(1);
      case 2: return validateText(2);
      case 3: return validateDragOrder();
      case 4: return validateDualInput();
      case 5: return validateDecode();
      case 6: return validateText(6);
      default: return false;
    }
  }

  async function validateText(mission) {
    const input = document.querySelector(`[data-answer="${mission}"]`);
    if (!input) return false;
    const value = input.value.trim().toLowerCase();
    return Hash.checkAsync(value, H[mission]);
  }

  async function validateDragOrder() {
    const order = DragDrop.getOrder();
    const joined = order.join('|');
    return Hash.checkAsync(joined, H.order3);
  }

  async function validateDualInput() {
    const inputA = document.querySelector('[data-answer="4a"]');
    const inputB = document.querySelector('[data-answer="4b"]');
    if (!inputA || !inputB) return false;
    const a = inputA.value.trim().toLowerCase();
    const b = inputB.value.trim().toLowerCase();
    const aMatch = await Hash.checkAsync(a, H['4a']);
    const bMatch = await Hash.checkAsync(b, H['4b']);
    return aMatch && bMatch;
  }

  async function validateDecode() {
    const boxes = document.querySelectorAll('.location-box');
    const attempt = Array.from(boxes).map(b => b.value.toUpperCase()).join('');
    return Hash.checkAsync(attempt, H.decode);
  }

  return { validate, DECODE_LENGTH };
})();
