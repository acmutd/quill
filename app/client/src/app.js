const $ = require("jquery");

var angular = require("angular");
var uiRouter = require("angular-ui-router");
import * as Sentry from "@sentry/browser";
import { Angular as AngularIntegration } from "@sentry/integrations";

Sentry.init({
  dsn: process.env.SENTRY_FRONTEND,
  integrations: [new AngularIntegration()],
  tracesSampleRate: 1.0,
});

var app = angular.module("reg", ["ui.router", "ngSentry"]);

const constants = require("./constants.js");

var AuthService = require("./services/AuthService.js");
var AuthInterceptor = require("./interceptors/AuthInterceptor.js");
var Session = require("./modules/Session.js");

var routes = require("./routes.js");

app
  .config([
    "$httpProvider",
    function ($httpProvider) {
      // Add auth token to Authorization header
      $httpProvider.interceptors.push("AuthInterceptor");
    },
  ])
  .run([
    "AuthService",
    "Session",
    function (AuthService, Session) {
      // Startup, login if there's  a token.
      var token = Session.getToken();
      if (token) {
        AuthService.loginWithToken(token);
      }
    },
  ]);
