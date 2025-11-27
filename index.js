import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/symptom-triage", async (req, res) => {
  try {
    const userText = req.body.text ?? "";

    const prompt = `
Sen bir HASTANE DANIŞMA ASİSTANI olarak çalışıyorsun.
Görevin: Hastanın şikayetini dinleyip HANGİ BÖLÜME gitmesi gerektiğini söylemek.

Kurallar:
- KESİNLİKLE teşhis koyma.
- İlaç ismi verme.
- Acil durum varsa "emergency": true de.
- SADECE JSON formatında cevap ver.

Branşlar:
["Cardiology","Dermatology","ENT","Family Medicine","General Surgery",
"Neurology","Obstetrics & Gynecology","Orthopedics",
"Pediatrics","Radiology","Psychiatry","Internal Medicine",
"Urology","Gastroenterology"]

Format:
{
  "speciality": "...",
  "advice": "...",
  "emergency": true/false
}

Kullanıcı metni: "${userText}"
    `;

    // 🔥 NEW RESPONSES API
    const result = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    let output = result.output_text;

    // Try extracting JSON from the output
    const start = output.indexOf("{");
    const end = output.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      output = output.substring(start, end + 1);
    }

    let json;
    try {
      json = JSON.parse(output);
    } catch (err) {
      json = {
        speciality: null,
        advice:
          "Belirtilerinizi tam anlayamadım, lütfen danışma ile iletişime geçin.",
        emergency: false,
      };
    }

    res.json(json);
  } catch (e) {
    console.error("SERVER ERROR:", e);
    res.status(500).json({
      speciality: null,
      advice: "Sistem hatası. Lütfen danışmaya başvurunuz.",
      emergency: false,
    });
  }
});

app.get("/", (req, res) => {
  res.send("AI service running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("AI server running on port " + PORT));
