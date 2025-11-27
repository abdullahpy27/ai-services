import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

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
- Sadece JSON formatında cevap ver.

Branşlar:
["Cardiology","Dermatology","ENT","Family Medicine","General Surgery","Neurology","Obstetrics & Gynecology","Orthopedics","Pediatrics","Radiology","Psychiatry","Internal Medicine","Urology","Gastroenterology"]

Format:
{
  "speciality": "...",
  "advice": "...",
  "emergency": true/false
}

Kullanıcı metni: "${userText}"
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    let data;
    try {
      data = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      data = {
        speciality: null,
        advice:
          "Belirtilerinizi tam anlayamadım, lütfen danışma ile iletişime geçin.",
        emergency: false,
      };
    }

    res.json(data);
  } catch (e) {
    res.status(500).json({
      speciality: null,
      advice: "Sistem hatası. Lütfen danışmaya başvurunuz.",
      emergency: false,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("AI server running on port " + PORT));
