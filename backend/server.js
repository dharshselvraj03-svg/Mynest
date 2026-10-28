
import "dotenv/config";
import app from "./src/app.js";
import { connectDatabase } from "./database.js";

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(
        `MyNest AI backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start MyNest backend:", error.message);
    process.exit(1);
  }
}

startServer();
