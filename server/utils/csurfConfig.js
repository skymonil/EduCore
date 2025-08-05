// csurfConfig.js
import { csrfSync } from 'csrf-sync';

export const {
  generateToken,
  csrfSynchronisedProtection,
  invalidCsrfTokenError
} = csrfSync({
  getTokenFromRequest: (req) => {
    return (
      req.body?._csrf || 
      req.body?.csrfToken || 
      req.headers['x-csrf-token'] || 
      req.headers['xsrf-token']
    );
  },
  cookie: {
    key: '_csrf',     // cookie name
    httpOnly: true,   // prevents JavaScript access
    secure: process.env.NODE_ENV === 'production', // set to true in production
    sameSite: 'strict', // mitigates CSRF from cross-site contexts
  },
  size: 128,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});
