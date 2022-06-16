const fromDoom =
  "You have entered deeply into the <HL>infested <HL>starport, but something is <HL>wrong. The <HL>monsters have brought their own reality with them, and the starport's technology is being <HL>subverted by their presence";

const fromTheThing =
  '<BL><HL>Projection\n if <HL>intruder <HL>organism reaches civilized areas\n <BL>...Entire world population infected <HL>27,000 hours from first contact.';

const fromTheThingGlitchy =
  '<BL><HL>Projection\n if <HL>intruder <HL>organism reaches civilized areas\n <BL>...Entire world population infected <HL>27,000 hours from first <WS>contact. Data Stream Broken';

const fromNeuroMancer =
  'the sky above the port was the color of television tuned to a <HL>dead <WS>channel \n \n \n <HL>Neuromancer';

const defaultColumns = 10;

const defaultRows = 5;

const defaultScale = 5;

const WSTest = 'hello <WS>world error';

const defaultText = fromNeuroMancer;

module.exports = {
  defaultText,
  fromDoom,
  fromTheThing,
  defaultColumns,
  defaultRows,
  defaultScale,
};
