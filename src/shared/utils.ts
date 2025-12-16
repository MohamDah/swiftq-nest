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

/**
 * Calculate actual position in queue for an entry
 * Position is dynamic based on how many ACTIVE entries are ahead
 */
export function calculateActualPosition(
  entryStoredPosition: number,
  allActiveEntries: Array<{ position: number }>,
): number {
  // Count how many active entries have position < this entry's position
  const peopleAhead = allActiveEntries.filter(
    (e) => e.position < entryStoredPosition,
  ).length;

  return peopleAhead + 1;
}

/**
 * Enrich entries with actual positions
 * Transforms raw entries into display-ready format
 */
export function enrichEntriesWithPositions<T extends { position: number }>(
  entries: T[],
): Array<T & { actualPosition: number }> {
  // Sort by stored position
  const sorted = [...entries].sort((a, b) => a.position - b.position);

  // Assign actual positions (1, 2, 3...)
  return sorted.map((entry, index) => ({
    ...entry,
    actualPosition: index + 1,
  }));
}
