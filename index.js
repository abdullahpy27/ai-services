import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { DeepSeek } from "@deepseek-ai/sdk";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Load DeepSeek API Key from Railway Variables
const deepseek = new DeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY });

app.post("/symptom-triage", async (req, res) => {
  try {
    const userText = req.body.text;

    if (!userText) {
      return res.status(400).json({
        error: "Missing 'text' field in request body",
      });
    }

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content:
            "You are a medical triage assistant. Extract the medical speciality (e.g., Cardiology, Dermatology, ENT, Neurology, Pediatrics, etc) and indicate if it is an emergency. Reply ONLY in JSON: { speciality: '', advice: '', emergency: true/false }",
        },
        { role: "user", content: userText },
      ],
    });

    const aiText = response.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(aiText);
    } catch (e) {
      return res.status(500).json({
        speciality: null,
        advice: "Model JSON parse error.",
        emergency: false,
      });
    }

    res.json(parsed);
  } catch (error) {
    console.error("SERVER ERROR:", error);

    res.status(500).json({
      speciality: null,
      advice: "Sistem hatası. Lütfen daha sonra tekrar deneyin.",
      emergency: false,
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("DeepSeek AI service running on port", PORT));
