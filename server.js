import express from "express";
import cors from "cors";
import "dotenv/config";
import OpenAI from "openai";

const app = express();
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

    res.json({ answer: response.output_text });

  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Proxy running on port " + PORT);
});