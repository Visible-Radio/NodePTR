# Node Pixel Text Renderer

## Overview

A Node.js utility for generating animated gifs, inspired from scrolling text used as context titles in film.
In the 80s and 90s you'd often see this text rendered with a kind of typing effect - as though it were being typed into a console, printed on a teletype, or recieved character by character via some transmission.

NodePTR accepts a sequence of text and writes an animated gif based on it. A simple markup syntax can be used to blink or highlight individual words, or the trigger a screen distortion effect at a specific frame.

## Usage

```javascript
import { nptr } from '../../nodeTextRenderer.js';

nptr("myGif",
  {
    text: "Hello World",
    columns: 10,
    displayRows 5,
    scale: 5
  })
```

## CLI

The project includes a wrapper around `nptr` for usage on the command line.

```shell
node nptrCLI <fileName> <text> <columns> <rows> <scale>
```

## Markup

The text argument supports three flags applied to individual words: `<HL>`, `<BL>`, and `<WS>`, which stand for 'highlight', 'blink', and 'wipe screen'.

The flags can be combined together, must proceed the word to which they apply, and do not have closing tags like HTML/XML.

`'<BL><HL>Projection\n if <HL>intruder <HL>organism reaches civilized areas\n <BL>...Entire world population infected <HL>27,000 hours from first <WS>contact. Data Stream Broken'`

## Example Output

[My image](github.com/Visible-Radio/NodePTR/PTR/PTR_output/neuromancer_pg_1.gif)
