import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

// Ortam değişkenini kontrol edin
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

// Endpoint'in çalışıp çalışmadığını test etmek için
app.get("/", (req, res) => {
  res.send("OpenRouter DeepSeek Turkish Triage AI Server is running.");
});

app.post("/symptom-triage", async (req, res) => {
  // Gelen veriyi kontrol etme
  const symptom = req.body.symptom || req.body.text || "";
  
  if (!symptom) {
    return res.status(400).json({
      success: false,
      error: "Symptom (şikayet) alanı boş olamaz."
    });
  }

  if (!OPENROUTER_KEY) {
    console.error("🔥 HATA: OPENROUTER_API_KEY ortam değişkeni ayarlanmadı.");
    return res.status(500).json({
      success: false,
      error: "Sunucu hatası: API anahtarı eksik."
    });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "system",
            content: `
Sen bir Tıbbi Triage Asistanısın.
HER ZAMAN geçerli, tek bir JSON objesi döndüreceksin.
AÇIKLAMA, MARKDOWN, BACKTICK, METİN, EKSTRA KELİME DÖNDÜRME.
YANITIN SADECE JSON OLMALI.

Sadece şu formatta yanıt ver (örnek):

{
  "speciality": "<uzmanlık alanı>",
  "advice": "<hastaya uygun tavsiye>",
  "emergency": false
}

Uzmanlık alanları TÜRKÇE olmalıdır: "Nöroloji", "Dahiliye", "Kardiyoloji", "Dermatoloji", "Ortopedi", "Kadın Doğum", "Göz", "KBB", "Pediatri", "Psikiyatri", "Endokrinoloji", "Onkoloji".

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
        },
        timeout: 12000 // 12 saniye zaman aşımı (Flutter'daki 10 saniyeden uzun olmalı)
      }
    );

    const raw = response.data.choices[0].message.content;

    // *** GÜÇLENDİRİLMİŞ JSON TEMİZLİĞİ ***
    let clean = raw.trim();
    
    // Markdown sarmalayıcılarını daha agresif temizle
    clean = clean.replace(/^```(json)?\s*|s*```$/gs, '').trim();

    let jsonResponse;

    try {
      jsonResponse = JSON.parse(clean);
    } catch (e) {
      console.log(`⚠️ JSON parse edilemedi. Ham Yanıt: "${raw}". Temizlenmiş Hali: "${clean}"`, e);

      // JSON parse edilemezse bile Flutter'ın çökmemesi için geçerli bir JSON döndür
      return res.json({
        success: true,
        speciality: "Dahiliye", // Güvenli varsayılan
        advice: clean || "Yapay zeka yanıtı alınamadı.",
        emergency: false
      });
    }

    return res.json({
      success: true,
      ...jsonResponse
    });

  } catch (err) {
    const errorData = err.response?.data || { message: err.message };
    console.error("🔥 OPENROUTER HATA:", JSON.stringify(errorData));

    res.status(500).json({
      success: false,
      error: errorData.message || "Bilinmeyen API hatası."
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 Turkish Triage AI Server running on port ${PORT}`)
);