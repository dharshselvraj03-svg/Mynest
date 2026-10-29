
import express from "express";
import cors from "cors";

import planningRoutes from "./routes/planningRoutes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://mynest-kaltrix.vercel.app",
  "https://mynest-kaltrix-5z4ehgswg-ka-l-trix.vercel.app",
];

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https:\/\/mynest-kaltrix-[a-z0-9-]+-ka-l-trix\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origin not allowed by CORS: ${origin}`)
      );
    },
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "MyNest AI Backend",
    status: "running",
  });
});

app.use("/api/planning", planningRoutes);

app.use((error, req, res, next) => {
  console.error("Backend error:", error);

  res.status(500).json({
    success: false,
    error: error?.message || "An unexpected server error occurred.",
  });
});

export default app;
