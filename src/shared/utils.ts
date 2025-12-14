import crypto from 'node:crypto';
/**Generates a random alphanumeric ID. */
export function generateId(length: number = 6): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

export function generateDisplayNumber() {
  const letter = String.fromCharCode(65 + crypto.randomInt(0, 26)); // A-Z
  const number = crypto.randomInt(0, 100).toString().padStart(2, '0');
  return `${letter}${number}`;
}
