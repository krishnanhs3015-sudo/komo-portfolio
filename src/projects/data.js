// Layout measured from the Figma pages (design space 1440 x 1024). Tiles are images cropped from Figma at 2x,
// definition cards and the "Latest" card are live text so they stay readable.
const BODY = 'A story that is being told through graphic, art or words this give a communication ground to others that resonates within.'

export const ORANGE = '#e36546'
export const LIME = '#a9cf50'
export const CREAM = '#fff4e2'

export const CATEGORIES = [
  {
    id: 'graphics', rail: 'Graphics', title: 'GRAPHIC DESIGN', gallery: 'GRAPHICS', footer: ['LET’S TALK', 'ABOUT GRAPHIC DESIGN'],
    tiles: [
      { img: 'g-top', x: 88, y: 187, w: 588, h: 317 },
      { img: 'g-bottom', x: 88, y: 504, w: 588, h: 323 },
    ],
    small: { x: 1102, y: 187, w: 250, h: 147, img: 'g-small' },
    def: { x: 696, y: 187, w: 386, h: 147, bg: ORANGE, head: 'DESIGN', body: BODY },
  },
  {
    id: 'ui', rail: 'UI / UX', title: 'USER INTERFACE', gallery: 'UI / UX', footer: ['LET’S TALK', 'ABOUT USER EXPERIENCE AND USER INTERFACE'],
    tiles: [
      { img: 'ui-top', x: 88, y: 187, w: 588, h: 317 },
      { img: 'ui-bottom', x: 88, y: 525, w: 588, h: 312 },
    ],
    small: { x: 1102, y: 187, w: 250, h: 147, color: ORANGE }, // was an off-palette red in Figma
    def: { x: 696, y: 187, w: 386, h: 147, bg: LIME, head: 'USER EXPERIENCES', body: 'To build an overall feeling and perception a person has when users are interacting with a product in the focus of ease of use, efficiency, and emotional responses of the users.' },
  },
  {
    id: 'packaging', rail: 'Packaging', title: 'PACKAGING', gallery: 'PACKAGING', footer: ['LET’S TALK', 'ABOUT PACKAGING DESIGN'],
    tiles: [
      { img: 'pk-top', x: 88, y: 187, w: 588, h: 317 },
      { img: 'pk-bottom', x: 88, y: 525, w: 588, h: 312 },
    ],
    small: { x: 1102, y: 187, w: 250, h: 147, color: CREAM },
    def: { x: 696, y: 187, w: 386, h: 147, bg: ORANGE, head: 'PACKAGING DESIGN', body: BODY },
  },
  {
    id: 'editorial', rail: 'Editorial', title: 'EDITORIAL', gallery: 'EDITORIAL', footer: ['LET’S TALK', 'ABOUT EDITORIAL AND CONTENT'],
    tiles: [
      { color: CREAM, x: 88, y: 187, w: 588, h: 317 },
      { img: 'ed-bottom', x: 88, y: 525, w: 588, h: 312 },
    ],
    small: { x: 690, y: 172, w: 266, h: 196, img: 'ed-small' }, // lime block with the star sticker, as in Figma
    def: { x: 967, y: 187, w: 386, h: 147, bg: ORANGE, head: 'EDITORIAL AND CONTENT', body: BODY },
  },
]

export const RAIL = ['Start', ...CATEGORIES.map((c) => c.rail)]

// scattered polaroid spots for the gallery overlay: x, y, rotation (card 330 x 360, stage 1440 x 1080)
export const SPOTS = [[110, 262, -6], [470, 236, 4], [830, 268, -3], [250, 640, 5], [630, 655, -5], [1010, 640, 6]]
export const SWATCH = ['#e36547', '#a9cf50', '#2e4c8c', '#1c2748', '#e36547', '#a9cf50']
export const NAMES = ['Project one', 'Project two', 'Project three', 'Project four', 'Project five', 'Project six']
