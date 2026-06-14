import { Request, Response } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { signToken } from '../utils/jwt.js';
import { env } from '../config/env.js';

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const oauthStateCookie = 'google_oauth_state';

const sendAuthResponse = (res: Response, statusCode: number, user: InstanceType<typeof User>) => {
  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    data: { user },
  });
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) {
    throw ApiError.badRequest('Email is already registered');
  }

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    authProvider: 'local',
  });

  sendAuthResponse(res, 201, user);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.unauthorized('User account is deactivated');
  }

  sendAuthResponse(res, 200, user);
});

export const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    data: null,
  });
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

// ============ GOOGLE OAUTH ============

function getGoogleClient() {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return null;
  }

  const redirectUri = env.GOOGLE_REDIRECT_URI || `http://localhost:${env.PORT}/api/auth/google/callback`;

  return new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, redirectUri);
}

/**
 * GET /api/auth/google
 * Redirects the browser to Google's consent screen.
 */
export const googleRedirect = catchAsync(async (_req: Request, res: Response) => {
  const client = getGoogleClient();
  if (!client) {
    return res.redirect(`${env.CLIENT_URL}/login?error=google_not_configured`);
  }

  const state = crypto.randomBytes(24).toString('hex');

  const authorizeUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    prompt: 'select_account',
    state,
  });

  res.cookie(oauthStateCookie, state, {
    ...cookieOptions,
    maxAge: 10 * 60 * 1000,
  });

  res.redirect(authorizeUrl);
});

/**
 * GET /api/auth/google/callback
 * Handles the redirect from Google after consent.
 * Exchanges code for tokens, finds-or-creates user, sets JWT cookie, redirects to client.
 */
export const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, error, state } = req.query;
  const expectedState = req.cookies?.[oauthStateCookie];

  res.clearCookie(oauthStateCookie);

  if (error) {
    return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_cancelled`);
  }

  if (
    !code ||
    typeof code !== 'string' ||
    !state ||
    typeof state !== 'string' ||
    !expectedState ||
    state !== expectedState
  ) {
    return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
  }

  const client = getGoogleClient();
  if (!client) {
    return res.redirect(`${env.CLIENT_URL}/login?error=google_not_configured`);
  }

  // Exchange authorization code for tokens
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  if (!tokens.id_token) {
    return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
  }

  // Verify the ID token and extract user info
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email || payload.email_verified === false) {
    return res.redirect(`${env.CLIENT_URL}/login?error=google_auth_failed`);
  }

  const { sub: googleId, email, name, picture } = payload;

  // Find existing user by googleId or email
  let user = await User.findOne({
    $or: [{ googleId }, { email }],
  });

  if (user) {
    // Link Google account if user exists by email but not yet linked
    if (!user.googleId) {
      user.googleId = googleId;
      if (picture && !user.avatar) user.avatar = picture;
      await user.save();
    }

    if (!user.isActive) {
      return res.redirect(`${env.CLIENT_URL}/login?error=account_deactivated`);
    }
  } else {
    // Create new user from Google profile
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      googleId,
      avatar: picture,
      authProvider: 'google',
    });
  }

  // Set JWT cookie and redirect to client homepage
  const token = signToken({ userId: user._id.toString(), role: user.role });
  res.cookie('token', token, cookieOptions);
  res.redirect(env.CLIENT_URL);
});
