import { generateRefreshToken } from './generateToken.js'

export const ACCESS_COOKIE = 'restaurant_access'
export const REFRESH_COOKIE = 'restaurant_refresh'
export const LOGOUT_COOKIE = 'restaurant_logout'
const secure = process.env.NODE_ENV === 'production'
const cookieOptions = (maxAge) => ({ httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge })

export function readCookie(req, name) {
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    if (part.slice(0, separator).trim() === name) return decodeURIComponent(part.slice(separator + 1).trim())
  }
  return null
}

export function setAuthCookies(res, user, accessToken, authContext = 'dashboard') {
  res.clearCookie(LOGOUT_COOKIE, { secure, sameSite: 'lax', path: '/' })
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(15 * 60 * 1000))
  res.cookie(REFRESH_COOKIE, generateRefreshToken(user, authContext), cookieOptions(7 * 24 * 60 * 60 * 1000))
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, cookieOptions(0))
  res.clearCookie(REFRESH_COOKIE, cookieOptions(0))
}
