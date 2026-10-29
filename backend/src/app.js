
import express from "express";
import cors from "cors";

import planningRoutes from "./routes/planningRoutes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://mynest-kaltrix.vercel.app",
];

const corsOptions = {
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https:\/\/mynest-kaltrix-[a-z0-9-]+-ka-l-trix\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }

    console.error("Blocked by CORS:", origin);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "MyNest AI Backend",
    status: "running",
    message: "MyNest planning backend is available.",
  });
});

app.use("/api/planning", planningRoutes);

app.use((error, req, res, next) => {
  console.error("Backend error:", error);

  if (error.message?.startsWith("Origin not allowed by CORS:")) {
    return res.status(403).json({
      success: false,
      error: error.message,
    });
  }

  res.status(500).json({
    success: false,
    error: error?.message || "An unexpected server error occurred.",
  });
});

export default app;
