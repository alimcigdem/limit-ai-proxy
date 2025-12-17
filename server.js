import express from "express";
import cors from "cors";
import "dotenv/config";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// __dirname (ESM için)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Basic Auth (site + API kilidi)
function requireBasicAuth(req, res, next) {
  // Render health check için açık kalsın
  if (req.path === "/health") return next();

  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Protected"');
    return res.status(401).send("Auth required");
  }

  const base64 = auth.slice("Basic ".length);
  const decoded = Buffer.from(base64, "base64").toString("utf8");
  const [user, pass] = decoded.split(":");

  // ENV yoksa bile patlamasın diye güvenli kontrol
  const okUser = process.env.BASIC_USER || "";
  const okPass = process.env.BASIC_PASS || "";

  if (user === okUser && pass === okPass) {
    return next();
  }

  res.setHeader("WWW-Authenticate", 'Basic realm="Protected"');
  return res.status(401).send("Auth required");
}

// 🔒 En üste koy: static + tüm route'lar bundan sonra korunsun
app.use(requireBasicAuth);

// Static dosyalar
app.use(express.static(path.join(__dirname, "public")));

// OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Routes
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/solve", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "question gerekli" });
    }

    const prompt = `
Sadece ve sadece nihai matematiksel sonucu yaz.
Açıklama, adım, verilenler, metin, madde işareti YAZMA.
LaTeX, \\( \\), \\[ \\], \\boxed{}, \\text{} KULLANMA.

Çıktı formatı:
Cevap: ...

Örnek:
Cevap: R(x) = (300 - 25x)(40 + 5x)

Soru:
${question}
`.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      temperature: 0.2,
    });

    const answer =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "";

    return res.json({ answer });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
