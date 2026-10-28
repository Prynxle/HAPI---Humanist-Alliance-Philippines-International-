import type { WorksWheelBioImage, WorksWheelItem } from "./types";

function nameTokens(value: string) {
  const basename = value.split(/[\\/]/).pop() ?? value;
  const stem = basename.replace(/\.[^.]+$/, "");
  return (
    stem
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((token) => token.length > 1 && !/^(ii|iii|iv|jr|sr)$/.test(token)) ?? []
  );
}

function differsByOneCharacter(first: string, second: string) {
  if (Math.abs(first.length - second.length) > 1) return false;
  let firstIndex = 0;
  let secondIndex = 0;
  let differences = 0;

  while (firstIndex < first.length && secondIndex < second.length) {
    if (first[firstIndex] === second[secondIndex]) {
      firstIndex++;
      secondIndex++;
      continue;
    }
    differences++;
    if (differences > 1) return false;
    if (first.length > second.length) firstIndex++;
    else if (second.length > first.length) secondIndex++;
    else {
      firstIndex++;
      secondIndex++;
    }
  }

  return differences + Number(firstIndex < first.length || secondIndex < second.length) <= 1;
}

/** Match by normalized filename tokens, allowing partial/one-character name variations. */
export function findMatchingBioImage(
  item: WorksWheelItem,
  images: WorksWheelBioImage[],
) {
  const sourceTokens = new Set([
    ...nameTokens(item.title),
    ...nameTokens(item.fileName ?? ""),
  ]);

  const scored = images.map((image) => {
    const tokens = nameTokens(image.fileName);
    let matched = 0;
    let fuzzy = 0;

    for (const token of tokens) {
      if (sourceTokens.has(token)) {
        matched++;
        continue;
      }
      const nearMatch =
        token.length >= 6 &&
        [...sourceTokens].some(
          (sourceToken) =>
            sourceToken.length >= 6 && differsByOneCharacter(token, sourceToken),
        );
      if (nearMatch) {
        matched++;
        fuzzy++;
      }
    }

    // Prefer images whose tokens are fully covered, but allow partial matches
    // (e.g. "Hannah Valerie" -> "Hannah Zama") when no exact full match exists.
    const score = matched * 100 + (matched === tokens.length ? 25 : 0) - fuzzy * 5;
    return { image, score, matched };
  });

  const bestScore = Math.max(...scored.map((entry) => entry.score));
  if (bestScore <= 0) return null;

  const bestMatches = scored.filter((entry) => entry.score === bestScore);
  return bestMatches.length === 1 ? bestMatches[0].image : null;
}