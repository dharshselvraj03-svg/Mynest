
import express from "express";
import cors from "cors";

import planningRoutes from "./routes/planningRoutes.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://mynest-kaltrix.vercel.app",
    ],
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.get("/", (req, res) => {
  res.json({
    name: "MyNest AI Backend",
    status: "running",
    message: "MyNest planning intelligence is ready.",
  });
});

app.use("/api/planning", planningRoutes);

app.use((error, req, res, next) => {
  console.error("Backend error:", error);

  res.status(500).json({
    success: false,
    error:
      error?.message ||
      "An unexpected server error occurred.",
  });
});

export default app;
