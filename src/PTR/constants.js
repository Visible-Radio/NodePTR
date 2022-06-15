const fromDoom =
  "You have entered deeply into the <HL>infested <HL>starport, but something is <HL>wrong. The <HL>monsters have brought their own reality with them, and the starport's technology is being <HL>subverted by their presence";

const fromTheThing =
  '<BL><HL>Projection\n if <HL>intruder <HL>organism reaches civilized areas\n <BL>...Entire world population infected <HL>27,000 hours from first contact.';

const fromTheThingGlitchy =
  '<BL><HL>Projection\n if <HL>intruder <HL>organism reaches civilized areas\n <BL>...Entire world population infected <HL>27,000 hours from first <WS>contact. Data Stream Broken';

const defaultColumns = 10;

const defaultRows = 5;

const defaultScale = 5;

const WSTest = 'hello <WS>world error';

const defaultText = fromTheThingGlitchy;

module.exports = {
  defaultText,
  fromDoom,
  fromTheThing,
  defaultColumns,
  defaultRows,
  defaultScale,
};
