/**
 * Authentication middleware for PostHub.
 *
 * Since PostHub is a single-user application, this middleware acts as a
 * pass-through. Platform-level authentication is handled via individual
 * OAuth flows per connected account. This middleware can be extended later
 * to enforce session-based auth if multi-user support is needed.
 */

/**
 * Ensures the request has a valid session.
 * Currently passes through all requests for single-user mode.
 */
export function requireAuth(req, res, next) {
  // In single-user mode, we initialize a default session user if not present
  if (!req.session.user) {
    req.session.user = {
      id: 1,
      role: 'owner',
      createdAt: new Date().toISOString(),
    };
  }
  next();
}

/**
 * Attaches user context to the request object for downstream handlers.
 */
export function attachUser(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  } else {
    req.user = { id: 1, role: 'owner' };
  }
  next();
}

export default { requireAuth, attachUser };
