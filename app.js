// Load the dotfiles.
require("dotenv").load({ silent: true });

var express = require("express");

// Middleware!
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var morgan = require("morgan");
var multer = require("multer");

var mongoose = require("mongoose");
var port = process.env.PORT || 3000;
var database =
  process.env.DATABASE ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017";

var settingsConfig = require("./config/settings");
var adminConfig = require("./config/admin");
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

var app = express();

// Sentry
Sentry.init({
  dsn: process.env.SENTRY_BACKEND,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// Connect to mongodb
mongoose.connect(database);

app.use(morgan("dev"));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(
  bodyParser.json({
    limit: "2mb",
  })
);

app.use(methodOverride());

app.use(express.static(__dirname + "/app/client"));

// Routers =====================================================================

var apiRouter = express.Router();
require("./app/server/routes/api")(apiRouter, multer);
app.use("/api", apiRouter);

var authRouter = express.Router();
require("./app/server/routes/auth")(authRouter);
app.use("/auth", authRouter);

require("./app/server/routes")(app);

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// listen (start app with node server.js) ======================================
module.exports = app.listen(port);
console.log("App listening on port " + port);
