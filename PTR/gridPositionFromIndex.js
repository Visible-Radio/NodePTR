export function gridPositionFromIndex({ index, columns }) {
  if (index >= 0) {
    const row = Math.floor(index / columns);
    const col = index % columns;
    return {
      col,
      row,
    };
  }
  if (index < 0) {
    const row = Math.floor(index / columns);
    const col =
      index % columns === 0 ? index % columns : (index % columns) + columns;

    return {
      col,
      row,
    };
  }
}
