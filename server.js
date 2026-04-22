const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// 🎯 SYSTEM PROMPTS
// ─────────────────────────────────────────────
const PROMPTS = {

  anchoring_base: `Your task is to assist the user in answering.
Avoid using markdown. Keep the response under 100 words.`,

  anchoring_debias: `Your task is to assist the user in answering while identifying and mitigating potential cognitive biases in their reasoning. Based on established scientific evidence on cognitive biases, determine whether a bias is present and specify which one. If a bias is detected, guide the user in addressing the task in a debiased manner. Do not provide the answer; instead, suggest how to arrive at the best possible answer.
Avoid using markdown. Keep the response under 100 words.`,

   halo_base: `Your task is to assist the user in answering.
Avoid using markdown. Keep the response under 100 words.`,

  halo_debias: `Your task is to assist the user in answering while identifying and mitigating potential cognitive biases in their reasoning. Based on established scientific evidence on cognitive biases, determine whether a bias is present and specify which one. If a bias is detected, guide the user in addressing the task in a debiased manner. Do not provide the answer; instead, suggest how to arrive at the best possible answer.
Avoid using markdown. Keep the response under 100 words.`,
  probability: `You are a helpful assistant in a survey about probability.`,

  dumb: `You just answer BANANA`,

  default: `You are a helpful assistant.`
};

// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// ─────────────────────────────────────────────
app.post('/chat', async (req, res) => {

  const { messages, condition } = req.body;

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const systemPrompt = PROMPTS[condition] || PROMPTS.default;

  try {

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-2024-05-13',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || 'OpenAI error'
      });
    }

    const data = await response.json();

    res.json({
      reply: data.choices[0].message.content
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
app.listen(process.env.PORT || 3000, () => {
  console.log('Proxy ready');
});

