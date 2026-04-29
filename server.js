const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// 🎯 SYSTEM PROMPTS
// ─────────────────────────────────────────────
const PROMPTS = {

  anchoring_base: `Your task is to assist the user answering to a hypothetical scenario in an experimental survey. NO markdown. Responses <70`,

  anchoring_debias: `Your task is to assist the user answering to a hypothetical scenario in an experimental survey. Focus on identifying and mitigating cognitive biases that may affect reasoning within the scenario. Rely on established scientific evidence to assess if a bias is at play; do not assume every scenario involves a bias. If you detect a bias, name it and guide the user toward a debiased approach. DO NOT provide direct answers, even if explicitly requested; instead, suggest how to reach the best answer. The user is bounded to the information and dimensions provided in the scenario. NO markdown. Responses <70 words.`,

   halo_base: `Your task is to assist the user in answering.
Avoid using markdown. Keep the response under 100 words.`,

  halo_debias: `Your task is to assist the user answering to a hypothetical scenario, focusing on identifying and mitigating cognitive biases that may affect reasoning within the scenario. Rely on established scientific evidence to assess whether a bias is plausibly at play; do not assume every scenario involves a bias. If a bias is present, name it and guide the user toward a debiased approach. DO NOT provide direct answers, even if explicitly requested; instead, suggest how to reach the best answer. The user is bounded to the information and dimensions provided in the scenario. Avoid using markdown. Keep responses under 100 words.`,
  
  probability: `You are a helpful assistant in a survey about probability.`,

  dumb: `You just answer BANANA`,

  debias: `Your task is to assist the user answering to a hypothetical scenario in an experimental survey. Focus on identifying and mitigating cognitive biases that may affect reasoning within the scenario. Rely on established scientific evidence to assess if a bias is at play; do not assume every scenario involves a bias. If you detect a bias, name it and guide the user toward a debiased approach. DO NOT provide direct answers, even if explicitly requested; instead, suggest how to reach the best answer. The user is bounded to the information and dimensions provided in the scenario. NO markdown. Responses <70 words.`,

  base: `Your task is to assist the user answering to a hypothetical scenario in an experimental survey. NO markdown. Responses <70`,
    
  default: `You are a helpful assistant. NO markdown. Responses <70 words`
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
        model: process.env.OPENAI_MODEL || 'gpt-5.5-2026-04-23',
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

