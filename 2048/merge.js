export function canMergeValues(sourceValue, targetValue, targetAlreadyMerged = false) {
  return sourceValue !== 0 && sourceValue === targetValue && !targetAlreadyMerged;
}

export function getMergedValue(value) {
  return value * 2;
}

export function processRowLeft(row) {
  let score = 0;
  const rowSize = row.length;
  let compact = row.filter((value) => value !== 0);

  for (let index = 0; index < compact.length - 1; index += 1) {
    if (compact[index] === compact[index + 1]) {
      compact[index] *= 2;
      score += compact[index];
      compact[index + 1] = 0;
      index += 1;
    }
  }

  compact = compact.filter((value) => value !== 0);

  while (compact.length < rowSize) {
    compact.push(0);
  }

  return { row: compact, score };
}
