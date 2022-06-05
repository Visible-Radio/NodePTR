/*
blink and highlight can appear on their own or in combindation, in whatever order
 <BL>word
 <HL>word
 <BL><HL>word
 <HL><BL>word
 */

/* try to match a flag at the beginning of the word
 if it is there, trim it off. return an object with the remaining string
 and a flags object width a boolean for the flag set
 the string may still contain another flag at the beginning
 try again to match a flag */

// const testString = '<HL><BL>HI';

const defaultFlags = {
  highlightFlag: false,
  blinkFlag: false,
};
const checkBlinkFlag = makeCheckFlag(/^<BL>/, 'blinkFlag');
const checkHighlightFlag = makeCheckFlag(/^<HL>/, 'highlightFlag');
const checkAll = (...args) =>
  compose(getAllFlags, checkHighlightFlag, checkBlinkFlag)(...args);

function getFlags(fullWordText) {
  return getAllFlags([fullWordText, defaultFlags]);
}

function getAllFlags([fullWordText, flags]) {
  return done(fullWordText)
    ? [fullWordText, flags]
    : checkAll([fullWordText, { ...flags }]);
}

function done(fullWordText) {
  return !/^<\w\w>/.test(fullWordText);
}

function makeCheckFlag(pattern, flagName) {
  return ([fullWordText, flags]) => {
    const flag = pattern.test(fullWordText);
    const trimmed = flag ? fullWordText.slice(4) : fullWordText;
    return done(fullWordText)
      ? [trimmed, flags]
      : [trimmed, { ...flags, [flagName]: flag }];
  };
}

function compose(...functions) {
  return (...args) => functions.reduceRight((acc, fn) => fn(acc), ...args);
}

module.exports = {
  getFlags,
};
