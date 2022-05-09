import { useEffect, useRef } from 'react';
import { asyncTextRenderer } from './PTR/wrapperFunctions';
import defs from './PTR/customDefs_charWidth_7.json';

const fromTheThing =
  '<HL>Projection:\n if <HL>intruder <HL>organism reaches civilized areas ...Entire world population infected <HL>27,000 hours from first contact.';

function App() {
  const didMountRef = useRef(null);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      asyncTextRenderer({
        columns: 10,
        displayRows: 5,
        scale: 5,
        text: fromTheThing,
        defs,
      });
    }
  }, []);

  return null;
}

export default App;
