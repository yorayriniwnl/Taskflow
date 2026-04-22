export function compactParams(params = {}) {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      acc[key] = value;
    }

    return acc;
  }, {});
}
