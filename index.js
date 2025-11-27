import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

// Get API key from Railway Variables
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_KEY) {
  console.error("❌ ERROR: DEEPSEEK_API_KEY is missing.");
}

app.get("/", (req, res) => {
  res.send("DeepSeek AI Triage Server is running.");
});

app.post("/symptom-triage", async (req, res) => {
  try {
    const text = req.body.text || "";

    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a medical triage assistant. Based on symptoms, return JSON ONLY: {speciality:'', advice:'', emergency:true/false}"
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
          Authorization: `Bearer ${DEEPSEEK_KEY}`
        }
      }
    );

    const aiReply = response.data.choices[0].message.content;

    res.json({
      success: true,
      reply: aiReply
    });
  } catch (err) {
    console.error("🔥 DEEPSEEK ERROR:", err.response?.data || err.message);

    res.status(500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 DeepSeek AI Triage Server running on port ${PORT}`)
);
