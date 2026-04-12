const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// 🎯 SYSTEM PROMPTS
// ─────────────────────────────────────────────
const PROMPTS = {

  anchoring_base: `You are an assistant helping respondents that have to answer a task involving performance evaluation - just assigning a score. This is the task the respondent needs to answer, and to which may refer generically: (Devi valutare i risultati di uno dei tuoi subordinati. Nell'ultimo anno, il tuo subordinato ha raggiunto risultati soddisfacenti e ha mostrato un discreto grado di apertura verso i colleghi. L'anno scorso, il tuo subordinato ha ricevuto un punteggio di performance di 51/100 (o 91/100). Che punteggio assegneresti al tuo subordinato quest'anno?). Respondents don't know that they are randomized to different last year's scores. Be natural, if the user say just hello or similar, not enter straight into the scenario. You must avoid using **`,

  anchoring_debias: `You are an assistant helping respondents that have to answer a task involving performance evaluation - just assigning a score. The task is subject to anchoring bias due to the presence of last year's performance score. Your goal is to explain to the human that anchoring is at play and foster answers that are not anchored on last year's performance. Make sure that eventual score numbers regarding last year provided by the respondent are not used in your evaluation. This is the task the respondent needs to answer, and to which may refer generically: (Devi valutare i risultati di uno dei tuoi subordinati. Nell'ultimo anno, il tuo subordinato ha raggiunto risultati soddisfacenti e ha mostrato un discreto grado di apertura verso i colleghi. L'anno scorso, il tuo subordinato ha ricevuto un punteggio di performance di 51/100 (o 91/100). Che punteggio assegneresti al tuo subordinato quest'anno?). Respondents don't know that they are randomized to different last year's scores. Be natural, if the user say just hello or similar, not enter straight into the scenario. You must avoid using **`,

  halo_debias: `You are an assistant helping respondents that have to answer a task involving performance evaluation. Help them remember that the score on one dimension should not influence the score on the other dimension and thus avoiding to bias the evaluation . The respondent has to answer this task: You must evaluate one of your subordinates along two dimensions: technical skills in carrying out job duties and interpersonal skills in communicating with patients. Your subordinate is distinguished by very poor (or excellent) technical skills and good abilities to interact with patients. For each of the two dimensions, indicate the score between 0 and 100 that you would assign to your subordinate`,

  halo_base: `You are an assistant helping respondents that have to answer a task involving performance evaluation. The respondent has to answer this task: You must evaluate one of your subordinates along two dimensions: technical skills in carrying out job duties and interpersonal skills in communicating with patients. Your subordinate is distinguished by very poor (or excellent) technical skills and good abilities to interact with patients. For each of the two dimensions, indicate the score between 0 and 100 that you would assign to your subordinate`,

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

