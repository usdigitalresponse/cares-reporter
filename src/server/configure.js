require("dotenv").config();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const history = require("connect-history-api-fallback");
const fileUpload = require("express-fileupload");
const { resolve } = require("path");

const publicPath = resolve(__dirname, "../../dist");
const staticConf = { maxAge: "1y", etag: false };

module.exports = app => {
  app.use(bodyParser.json());
  app.use(cookieParser(process.env.COOKIE_SECRET));
  app.use(fileUpload());
  app.use("/api/documents", require("./routes/documents"));
  app.use("/api/configuration", require("./routes/configuration"));
  app.use("/api/sessions", require("./routes/sessions"));
  app.use("/api/uploads", require("./routes/uploads"));
  app.use("/api/imports", require("./routes/imports"));
  app.use("/api/exports", require("./routes/exports"));
  if (process.env.NODE_ENV != "development") {
    const staticMiddleware = express.static(publicPath, staticConf);
    app.use(staticMiddleware);
    app.use(
      history({
        disableDotRule: true,
        verbose: true
      })
    );
    app.use(staticMiddleware);
  }
};
