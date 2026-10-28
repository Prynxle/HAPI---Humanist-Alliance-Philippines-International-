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

/** Match by normalized filename tokens, allowing one-character name typos. */
export function findMatchingBioImage(
  item: WorksWheelItem,
  images: WorksWheelBioImage[],
) {
  const sourceTokens = new Set([
    ...nameTokens(item.title),
    ...nameTokens(item.fileName ?? ""),
  ]);
  const matches = images.flatMap((image) => {
    const tokens = nameTokens(image.fileName);
    let exactMatches = 0;
    let fuzzyMatches = 0;

    for (const token of tokens) {
      if (sourceTokens.has(token)) {
        exactMatches++;
        continue;
      }
      const nearMatch =
        token.length >= 6 &&
        [...sourceTokens].some(
          (sourceToken) =>
            sourceToken.length >= 6 && differsByOneCharacter(token, sourceToken),
        );
      if (!nearMatch) return [];
      fuzzyMatches++;
    }

    return [{
      image,
      score: tokens.length * 100 + exactMatches * 10 - fuzzyMatches * 20,
    }];
  });

  if (!matches.length) return null;
  const bestScore = Math.max(...matches.map((match) => match.score));
  const bestMatches = matches.filter((match) => match.score === bestScore);
  return bestMatches.length === 1 ? bestMatches[0].image : null;
}
