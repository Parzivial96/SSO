const express = require('express');
const session = require('express-session');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const app = express();
const jwt = require('jsonwebtoken');
const { json } = require('body-parser');
var cors = require('cors')
app.use(cors())

app.use(session({
  secret: '577eeb3923cd6b6e2fc5904b70ce596e976c73ba812b48f01f6f355c709e4a4e',
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

const auth0Config = {
  domain: 'cts23.us.auth0.com',
  clientID: 'xMmNUwkF9gFlmKK0zRTODVYRuxcpYzyh',
  clientSecret: 'imdbUvRfhAVKP0rG8e9dIjmLlUCgHxnCQmoJ6DCoM1OPpzwa1oq_UvjoE1OoGKhD',
  callbackURL: 'https://ctssso.onrender.com/callback',
};

passport.use(new Auth0Strategy(auth0Config, (accessToken, refreshToken, extraParams, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get('/login', (req, res) => {
  // Capture the target URL from the query parameter or use a default
  const target = req.query.target;
  passport.authenticate('auth0', {
    scope: 'openid email profile',
    callbackURL: `https://ctssso.onrender.com/callback?target=${encodeURIComponent(target)}`,
  })(req, res);
});

app.get('/callback', passport.authenticate('auth0', {failureRedirect: '/login',}), (req, res) => {
    const payload = req.user.emails[0];
    const target = req.query.target;
    let mydomain = target.split("//")[1];
    const token = jwt.sign(payload, '577eeb3923cd6b6e2fc5904b70ce596e976c73ba812b48f01f6f355c709e4a4e');
    res.cookie('ssoToken', token, {domain: mydomain, maxAge: 3600000 });
    const target = req.query.target;
    res.redirect(target);
});

app.get('/logout', (req, res) => {
  res.clearCookie('ssoToken');
  res.redirect(`https://cts23.us.auth0.com/v2/logout`);
});

app.get('/home', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({'token':req.user.emails[0]});
  } else {
    res.send(`Not Authenticated`);
  }
});

app.get('/getToken', (req, res) => {
    const target = req.query.target;
    if (req.isAuthenticated()) {
        const payload = req.user.emails[0];
        const token = jwt.sign(payload, '577eeb3923cd6b6e2fc5904b70ce596e976c73ba812b48f01f6f355c709e4a4e');
        res.cookie('ssoToken', token, { maxAge: 3600000 });
        res.redirect(target);
    } else {
        res.redirect('https://ctssso.onrender.com/login?target='+target);
    }
  });  

app.listen(3000, () => {
  console.log('Authentication server is running on port 3000');
});
