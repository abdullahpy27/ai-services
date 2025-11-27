import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

app.post("/symptom-triage", async (req, res) => {
  try {
    const userText = req.body.text || "";

    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a medical triage assistant. Return JSON only: {speciality:'', advice:'', emergency:true/false}"
          },
          {
            role: "user",
            content: userText
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

    const reply = response.data.choices[0].message.content;

    res.json({ success: true, reply });
  } catch (err) {
    console.error("SERVER ERROR:", err.response?.data || err.message);

    res.status(500).json({
      success: false,
      error: "AI server error"
    });
  }
});

app.listen(8080, () =>
  console.log("🚀 DeepSeek AI server running on port 8080")
);
