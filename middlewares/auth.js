import crypto from 'crypto-js';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import LocalStrategy from 'passport-local';

import User from '../models/user';

const {
  HASHING_SECRET_KEY
} = process.env;

const decrypt = (encrypted) => {
  const bytes = crypto.AES.decrypt(encrypted, HASHING_SECRET_KEY);
  const decrypted = bytes.toString(crypto.enc.Utf8);
  return decrypted;
};

const LoginCheck = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (!user) {
      req.error = info.error;
    } else {
      req.user = user;
    }
    next();
  })(req, res, next);
};

const GenerateToken = ({
  userId,
  email,
  expiryTime
}) => ({
  token: jwt.sign({ userId, email }, HASHING_SECRET_KEY, {
    expiresIn: expiryTime
  })
});

const AuthenticateAuthToken = passport.authenticate('jwt', {
  session: false
});

const LocalLoginStrategy = new LocalStrategy(
  {
    usernameField: 'email',
    passReqToCallback: true
  },
  async (req, email, password, done) => {
    try {
      email = decrypt(email);
      password = decrypt(password);

      const user = await User.findOne({ email });
      if (!user) {
        return done(null, false, {
          error: 'Your login details could not be verified. Please try again.'
        });
      }

      const isValid = user.ValidatePassword(password);
      if (!isValid) {
        return done(null, false, {
          error: 'Your login details could not be verified. Please try again.'
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
);

const AuthenticationStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: HASHING_SECRET_KEY
  },
  async (jwtPayload, done) => {
    try {
      const user = await User.findById(jwtPayload.userId);
      if (!user) return done(null, false);

      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
);

export {
  LoginCheck,
  GenerateToken,
  AuthenticateAuthToken,
  LocalLoginStrategy,
  AuthenticationStrategy
};
