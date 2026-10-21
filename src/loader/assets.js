// Images worth having ready before each page is shown (paths inside /public).
const HOME = ['home/head.webp', 'home/whites.webp', 'home/pupils.webp', 'home/lashes.webp', 'home/brows.webp', 'home/mouth.webp', 'home/bubble.webp', 'home/grid.webp',
  'home/eyes.webp', 'home/star.webp', 'home/megaphone.webp', 'home/folder.webp', 'home/emoji.webp']
const ABOUT = ['brand/about/outline.webp', 'brand/about/monitor-plain.webp', 'brand/layers/desk.webp', 'brand/layers/lamp.webp', 'brand/layers/book-labels.webp', 'brand/layers/fire-character.webp',
  'brand/about/table/mat.webp', 'brand/about/table/card.webp', 'brand/about/table/scA.webp', 'brand/about/table/scB.webp', 'brand/about/footer-letters.webp']
const BRAND = ['brand/banner.webp', 'brand/card.webp', 'brand/strap-top.webp', 'brand/pol1.webp', 'brand/pol2.webp', 'brand/pol3.webp', 'brand/layers/desk.webp', 'brand/layers/fire-character.webp']
const CONTACT = ['contact/face-0-empty.png', 'contact/face-1-worried.png', 'contact/face-2-wide-eyes.png', 'contact/face-3-hands-over-eyes.png', 'contact/sticker-panel.png']
const PROJECTS = ['projects/g-top.webp', 'projects/g-bottom.webp', 'projects/ui-top.webp', 'projects/pk-top.webp', 'projects/ed-bottom.webp']

export function preloadFor(route) {
  const r = route.split('/')[0]
  if (r === 'about') return ABOUT
  if (r === 'brand') return BRAND
  if (r === 'contact') return CONTACT
  if (r === 'projects' || r === 'project') return PROJECTS
  return HOME
}
