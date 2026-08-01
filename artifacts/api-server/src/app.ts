import express, { type Express, type RequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import router from "./routes";
import { logger } from "./lib/logger";
import { buildPublicSiteUrl } from "./lib/publicSite";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

function redirectLegacyParentConsent(pathname: string): RequestHandler {
  return (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token.trim() : undefined;
    return res.redirect(302, buildPublicSiteUrl(pathname, { token }));
  };
}

app.get(
  ["/stypendium/zgoda-rodzica", "/stypendium/zgoda-rodzica/"],
  redirectLegacyParentConsent("/stypendium/zgoda-rodzica/"),
);
app.get(
  ["/en/scholarship/parent-consent", "/en/scholarship/parent-consent/"],
  redirectLegacyParentConsent("/en/scholarship/parent-consent/"),
);

app.use("/api", router);

app.use((err: any, _req: any, res: any, next: any) => {
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large. Maksymalny rozmiar uploadu to 15 MB." });
  }
  return next(err);
});

export default app;
