import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

app.get("/", (req, res) => {
  res.send("🚀 OpenRouter DeepSeek Turkish Triage AI Server is running.");
});

app.post("/symptom-triage", async (req, res) => {
  try {
    const symptom = req.body.symptom || req.body.text || "";

    if (!symptom) {
      return res.status(400).json({
        success: false,
        error: "Symptom or text is required in the request body."
      });
    }

    // الرسالة الخاصة بالنظام (Multilingual)
    const systemPrompt = `
Sen çok dilli bir Tıbbi Triage Asistanısın.

HER ZAMAN geçerli bir JSON döndüreceksin.  
Açıklama, markdown, backtick veya ekstra metin asla ekleme.  
Sadece saf JSON döndür.

DİL KURALLARI:
- Kullanıcının yazdığı dili otomatik olarak tespit et (Türkçe, Arapça, İngilizce veya diğerleri).
- "advice" alanı, kullanıcının mesajında kullandığı dilde yazılmalıdır.
- "speciality" alanı HER ZAMAN TÜRKÇE olacaktır.
- "emergency": true sadece hayatı ciddi şekilde tehdit eden durumlarda kullanılmalıdır.

KESİN FORMAT (DEĞİŞMEZ):
{
  "speciality": "<uzmanlık alanı Türkçe>",
  "advice": "<kullanıcının diliyle tavsiye>",
  "emergency": false
}

UZMANLIK ALANLARI (sadece Türkçe):
"Nöroloji", "Dahiliye", "Kardiyoloji", "Dermatoloji",
"Ortopedi", "Kadın Doğum", "Göz", "KBB",
"Pediatri", "Psikiyatri", "Endokrinoloji", "Onkoloji"
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Hastanın şikayeti: ${symptom}` }
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

    let raw = response.data.choices?.[0]?.message?.content || "";

    // تنظيف أي Markdown أو backticks
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(raw);
    } catch (e) {
      console.warn("⚠️ JSON parse failed:", raw);
      return res.json({
        success: true,
        speciality: null,
        advice: raw,
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
