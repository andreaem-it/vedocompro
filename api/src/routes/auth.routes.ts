import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { authController, loginValidation, registerValidation } from '../controllers/auth.controller';
import { authService } from '../services/auth.service';
import { config } from '../config';

const router = Router();

// JWT strategy
passport.use(
  new JwtStrategy(
    { jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: config.jwtSecret },
    async (payload, done) => {
      try {
        done(null, payload);
      } catch {
        done(null, false);
      }
    },
  ),
);

// Google OAuth
if (config.google.clientId) {
  passport.use(
    new GoogleStrategy(
      { clientID: config.google.clientId, clientSecret: config.google.clientSecret, callbackURL: config.google.callbackUrl },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'));
          const result = await authService.findOrCreateOAuthUser({
            provider: 'google',
            providerId: profile.id,
            accessToken: _accessToken,
            email,
            name: profile.displayName,
            pic: profile.photos?.[0]?.value,
          });
          done(null, {
            id: result.user.id,
            email: result.user.email,
            username: result.user.username,
            isAdmin: result.user.isAdmin,
            token: result.token,
          });
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );
}

// Facebook OAuth
if (config.facebook.appId) {
  passport.use(
    new FacebookStrategy(
      { clientID: config.facebook.appId, clientSecret: config.facebook.appSecret, callbackURL: config.facebook.callbackUrl, profileFields: ['id', 'emails', 'displayName', 'photos'] },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Facebook'));
          const result = await authService.findOrCreateOAuthUser({
            provider: 'facebook',
            providerId: profile.id,
            accessToken: _accessToken,
            email,
            name: profile.displayName,
            pic: profile.photos?.[0]?.value,
          });
          done(null, {
            id: result.user.id,
            email: result.user.email,
            username: result.user.username,
            isAdmin: result.user.isAdmin,
            token: result.token,
          });
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );
}

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), authController.oauthCallback);

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'], session: false }));
router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/login' }), authController.oauthCallback);

export default router;
