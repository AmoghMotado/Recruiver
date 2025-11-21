// components/GoogleAuthButton.jsx
import PropTypes from 'prop-types'

/**
 * Server-side Google OAuth button.
 *
 * Uses /api/auth/google (or /api/auth/oauth-login alias) which:
 *  - redirects to Google
 *  - handles callback
 *  - creates user in Firestore
 *  - sets JWT cookie
 *
 * Usage:
 *   <GoogleAuthButton role="CANDIDATE" />
 *   <GoogleAuthButton role="RECRUITER" redirect="/recruiter/dashboard" />
 */
export default function GoogleAuthButton({
  role = 'CANDIDATE',
  label = 'Continue with Google',
  redirect,
  className = '',
}) {
  const handleClick = () => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams({
      role,
      ...(redirect ? { redirect } : {}),
    }).toString()

    // Hit our Express Google OAuth starter endpoint
    // /api/auth/google will then redirect to Google and back
    window.location.href = `/api/auth/google?${params}`
    // (You could also use `/api/auth/oauth-login?${params}` since we aliased it)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-3 px-4 py-2 rounded-md shadow-sm font-semibold ${className}`}
      aria-label={label}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#EA4335" d="M24 9.5c3.9 0 7.3 1.4 9.9 3.6l7.5-7.4C36 1.9 30.5 0 24 0 14.7 0 6.7 4.9 2.5 12.1l8.7 6.7C13.4 14 18.4 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24.5c0-1.4-.1-2.7-.4-4H24v8h12.9c-.6 3-2.6 5.6-5.4 7.2l8.3 6.4c5-4.6 6.7-11.6 6.7-17.6z"/>
        <path fill="#FBBC05" d="M10.2 29.1C9.1 26.9 8.5 24.5 8.5 22c0-2.5.6-4.9 1.7-7l-8.7-6.6C.9 11.9 0 17.8 0 22c0 4.2 1 9.1 2.8 13.3l7.4-6.2z"/>
        <path fill="#34A853" d="M24 48c6.5 0 12-1.9 16.2-5.3l-8.3-6.4C31.3 36.8 27.9 38 24 38c-5.6 0-10.6-4.5-12.8-10.8l-8.7 6.6C6.7 43.1 14.7 48 24 48z"/>
      </svg>
      <span>{label}</span>
    </button>
  )
}

GoogleAuthButton.propTypes = {
  role: PropTypes.string,
  label: PropTypes.string,
  redirect: PropTypes.string,
  className: PropTypes.string,
}
