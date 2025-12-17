import express from "express";
import cors from "cors";
import "dotenv/config";
import OpenAI from "openai";

const app = express();
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/solve", async (req, res) => {
  try {
    const { question } = req.body;
 const clientKey = req.headers["x-app-key"];

    if (clientKey !== process.env.APP_KEY) {
      return res.status(401).json({ error: "Yetkisiz erişim" });
    }


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
`;
 const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      temperature: 0.2
    });

const answer =
  response.output_text ||
  response.output?.[0]?.content?.[0]?.text ||
  "";

res.json({ answer });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
