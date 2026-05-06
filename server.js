const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────
const PROMPTS = {

  debias: `Your task is to help the user respond to a hypothetical scenario presented in a randomized experimental survey. Drawing on the most current cognitive and behavioral science, first assess whether any bias is at play. Only if you detect a bias, use a debiasing strategy to prevent the user from making mistakes caused by phenomena such as bias, noise, selective attention, selective memory, belief instability, multimodality of beliefs, heterogeneity of beliefs, and related phenomena. NO markdown. Responses <75 words`,

  base: `Your task is to help the user respond to a hypothetical scenario presented in a randomized experimental survey. NO markdown. Responses <75 words`,

  debias_nn: `Your task is to help the user respond to a hypothetical scenario presented in a randomized experimental survey. Drawing on most current cognitive and behavioral science, first assess whether any bias is at play. Only if you detect a bias, use a debiasing strategy to prevent the user from making mistakes caused by phenomena such as bias, noise, selective attention, selective memory, belief instability, multimodality of beliefs, heterogeneity of beliefs, and related phenomena. If the response is objectively deterministic, for instance beacause it is based on a formula, provide the deterministic answer and keep helping the user to identify and overcome any biases. If the response is not objectively deterministic, for instance a subjective judgment, DO NOT provide the answer yourself and DO NOT include any numbers in the response. NO markdown. Responses <75 words.`,
  
  default: `Your task is to help the user respond to a hypothetical scenario presented in a randomized experimental survey. NO markdown. Responses <75 words`
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

