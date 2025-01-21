export function extractEnumEntries<ENUM extends object>(targetEnum: ENUM) {
  const allEntries = Object.entries(targetEnum);
  return allEntries.slice(allEntries.length / 2);
}
