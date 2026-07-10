import rateLimit from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many AI requests. Please wait a minute.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many auth requests. Please try again later.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRegisterRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Please try again later.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Post limit disabled — users can post freely
export const feedRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 0, // 0 = unlimited
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Post limit reached.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});


export const sightingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 sightings per hour
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Sighting limit reached. 20 sightings per hour.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const flagRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 flags per hour
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Flag limit reached. 5 flags per hour.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const voteRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many votes. Please slow down.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const officialAlertRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Official alert limit reached. 5 per hour.' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
