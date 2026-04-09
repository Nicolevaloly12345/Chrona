import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/youtube-search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query is required" });
      }
      
      const ytSearch = (await import("yt-search")).default;
      const r = await ytSearch(query);
      
      // Filter out VEVO and official channels as they usually block embedding
      let videos = r.videos.filter(v => {
        const authorName = v.author.name.toLowerCase();
        return !authorName.includes('vevo') && 
               !authorName.includes('official') &&
               !authorName.includes('topic');
      });
      
      // If all videos were filtered out, fallback to the original list
      if (videos.length === 0) {
        videos = r.videos;
      }
      
      if (videos && videos.length > 0) {
        // Return the first video that is likely to be embeddable
        res.json({ videoId: videos[0].videoId });
      } else {
        res.status(404).json({ error: "No videos found" });
      }
    } catch (error) {
      console.error("YouTube search error:", error);
      res.status(500).json({ error: "Failed to search YouTube" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
