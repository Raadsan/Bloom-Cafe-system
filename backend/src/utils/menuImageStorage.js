import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MENU_UPLOAD_DIR = path.join(__dirname, '../../uploads/menu')

export async function ensureMenuUploadDir() {
  await fs.mkdir(MENU_UPLOAD_DIR, { recursive: true })
}

/** Save base64 menu image to disk; return public path like /uploads/menu/item-5.jpg */
export async function persistMenuImageUrl(imageUrl, itemId) {
  if (!imageUrl || typeof imageUrl !== 'string') return null

  if (imageUrl.startsWith('/uploads/menu/')) return imageUrl

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  if (!imageUrl.startsWith('data:image/')) return null

  const match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/s)
  if (!match) return null

  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.length > 2_500_000) return null

  await ensureMenuUploadDir()
  const filename = `item-${itemId}.${ext}`
  await fs.writeFile(path.join(MENU_UPLOAD_DIR, filename), buffer)
  return `/uploads/menu/${filename}`
}

/** Ensure DB/base64 images become a storable path; verify upload files exist. */
export async function resolveMenuItemImageUrl(imageUrl, itemId) {
  if (!imageUrl || typeof imageUrl !== 'string') return null

  if (imageUrl.startsWith('data:')) {
    return persistMenuImageUrl(imageUrl, itemId)
  }

  if (imageUrl.startsWith('/uploads/menu/')) {
    const filepath = path.join(__dirname, '../../', imageUrl.replace(/^\//, ''))
    try {
      await fs.access(filepath)
      return imageUrl
    } catch {
      return null
    }
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl.length <= 600 ? imageUrl : null
  }

  return null
}

/** Strip base64 from POS catalog — only short file paths or external URLs. */
export function sanitizeMenuImageUrlForPos(url) {
  if (!url || typeof url !== 'string') return null
  if (url.startsWith('/uploads/')) return url
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.length <= 600 ? url : null
  }
  return null
}

export function getApiPublicOrigin(req) {
  if (process.env.API_PUBLIC_URL) return process.env.API_PUBLIC_URL.replace(/\/$/, '')
  const host = req.get('host')
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http'
  return `${protocol}://${host}`
}

/** Full browser-ready URL for menu images on every API response. */
export function toAbsoluteMenuImageUrl(url, origin) {
  if (!url || typeof url !== 'string') return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads/')) return `${origin}${url}`
  return null
}

export async function deleteMenuImageFile(imageUrl) {
  if (!imageUrl?.startsWith('/uploads/menu/')) return
  const filepath = path.join(__dirname, '../../', imageUrl.replace(/^\//, ''))
  await fs.unlink(filepath).catch(() => {})
}

/** Resolve + absolute URL for one menu item (POS / public / admin list). */
export async function formatMenuItemImageForApi(imageUrl, itemId, origin) {
  const resolved = await resolveMenuItemImageUrl(imageUrl, itemId)
  return toAbsoluteMenuImageUrl(resolved, origin)
}
