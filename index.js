import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

app.get("/", (req, res) => {
  res.send("OpenRouter DeepSeek AI Server is running.");
});

app.post("/symptom-triage", async (req, res) => {
  try {
    const text = req.body.text || "";

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",   // <---- FREE DEEPSEEK MODEL
        messages: [
          {
            role: "system",
            content:
              "You are a medical triage assistant. Return JSON ONLY: {speciality:'', advice:'', emergency:true/false}"
          },
          {
            role: "user",
            content: text
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer": "https://your-app-url.com",
          "X-Title": "Hospital AI Assistant"
        }
      }
    );

    res.json({
      success: true,
      reply: response.data.choices[0].message.content
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
  console.log(`🚀 OpenRouter DeepSeek AI Server running on port ${PORT}`)
);
