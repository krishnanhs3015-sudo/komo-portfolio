// public files (images, fonts) must respect the base path when the site is hosted in a sub-folder (GitHub Pages)
export const asset = (path) => import.meta.env.BASE_URL + path.replace(/^\//, '')
