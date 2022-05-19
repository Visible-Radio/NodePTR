function makeWords(text, columns, defs) {
  // break the string into words, none of which are longer than the number of columns
  const parsedWords = parseWords(text.toUpperCase(), columns);

  // assign each word a row and column value
  return parsedWords.reduce(
    (acc, word) => {
      word.segments.forEach((segment, segmentIndex) => {
        /* We actually need to forward \n chars as words, and when they are encountered cause
        a scroll by calling the method designed to do this.
        */
        if (/[\n\s]/.test(segment)) {
          if (segment === '\n') {
            acc.row += 1;
            acc.col = 0;
          }
          return acc;
        }

        let color = 'rgb(0,190,187)';
        if (acc.getRemaining() >= segment.length) {
          acc.words.push({
            word,
            segment,
            segmentIndex,
            row: acc.row,
            col: acc.col,
            chars: makeChars({
              color,
              segment,
              segmentIndex,
              word,
              row: acc.row,
              col: acc.col,
              defs,
            }),
          });
          acc.col += segment.length + 1;
          // +1 is to add a space
        } else {
          acc.row += 1;
          acc.col = 0;
          acc.words.push({
            word,
            segment,
            segmentIndex,
            row: acc.row,
            col: acc.col,
            color,
            chars: makeChars({
              segment,
              segmentIndex,
              word,
              row: acc.row,
              col: acc.col,
              defs,
            }),
          });
          acc.col += segment.length + 1;
        }
      });
      return acc;
    },
    {
      words: [],
      getRemaining() {
        return columns - this.col;
      },
      row: 0,
      col: 0,
    },
  );
}
