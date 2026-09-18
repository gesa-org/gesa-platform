/**
 * Returns a new, uniformly shuffled array using Fisher–Yates.
 * The source array is never mutated, so it is safe to use with canonical
 * API data and derived React state.
 */
export function shuffleArray<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}
