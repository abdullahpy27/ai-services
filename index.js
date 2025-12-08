import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

app.get("/", (req, res) => {
  res.send("OpenRouter DeepSeek Turkish Triage AI Server is running.");
});

app.post("/symptom-triage", async (req, res) => {
  try {
    const symptom = req.body.symptom || req.body.text || "";

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
content: `
Sen bir Tıbbi Triage Asistanısın.  
HER ZAMAN geçerli bir JSON döndüreceksin. 

Sadece şu formatta yanıt ver (örnek, Sadece JSON, dinamik olmalı):

{
  "speciality": "<uzmanlık alanı>",
  "advice": "<hastaya uygun tavsiye>",
  "emergency": false
}

AÇIKLAMA, MARKDOWN, BACKTICK, METİN, EKSTRA KELİME YOK. 
Sadece saf JSON.

Uzmanlık alanları TÜRKÇE olmalıdır:
- "Nöroloji"
- "Dahiliye"
- "Kardiyoloji"
- "Dermatoloji"
- "Ortopedi"
- "Kadın Doğum"
- "Göz"
- "KBB"
- "Pediatri"
- "Psikiyatri"
- "Endokrinoloji"
- "Onkoloji"

"emergency": true sadece hayatı tehdit eden bir durum varsa kullanılmalıdır.
`
          },
          {
            role: "user",
            content: `Hastanın şikayeti: ${symptom}`
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": "https://your-app-url.com",
          "X-Title": "Hospital AI Assistant"
        }
      }
    );

    const raw = response.data.choices[0].message.content;

    // Markdown temizliği
    const clean = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let jsonResponse;

    try {
      jsonResponse = JSON.parse(clean);
    } catch (e) {
      console.log("⚠️ JSON parse edilemedi:", clean);

      return res.json({
        success: true,
        speciality: null,
        advice: clean,
        emergency: false
      });
    }

    return res.json({
      success: true,
      ...jsonResponse
    });

  } catch (err) {
    console.error("🔥 OPENROUTER ERROR:", err.response?.data || err.message);

    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 Turkish Triage AI Server running on port ${PORT}`)
);
