const fromDoom =
  "You have entered deeply into the <HL>infested <HL>starport, but something is <HL>wrong. The <HL>monsters have brought their own reality with them, and the starport's technology is being <HL>subverted by their presence";

const fromTheThing =
  '<BL><HL>Projection\n if <HL>intruder <HL>organism reaches civilized areas\n <BL>...Entire world population infected <HL>27,000 hours from first contact.';

const fromTheThingGlitchy =
  '<BL><HL>Projection\n if <HL>intruder <HL>organism reaches civilized areas\n <BL>...Entire world population infected <HL>27,000 hours from first <WS>contact. Data Stream Broken';

const fromNeuroMancer =
  'the sky above the port was the color of television tuned to a <HL>dead <WS>channel \n \n \n <HL>Neuromancer';

export const text = {
  fromDoom,
  fromTheThing,
  fromTheThingGlitchy,
  fromNeuroMancer,
};
export const defaultColumns = 10;
export const defaultRows = 5;
export const defaultScale = 1;
export const WSTest = 'hello <WS>world error';
export const defaultText = fromNeuroMancer;
