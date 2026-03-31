const API_KEY_STORAGE = 'marrow_anthropic_key';

export function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

export function setApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

export function hasApiKey() {
  return !!getApiKey();
}

async function callClaude(systemPrompt, userMessage) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

export async function generateRecallQuestions(bookTitle, chapterTitle, notes) {
  const system = `You are a reading comprehension assistant. Generate exactly 3 recall questions to test understanding of what was read. Return valid JSON only — an array of 3 strings, no other text.`;

  const user = `Book: "${bookTitle}"
Chapter: "${chapterTitle}"
Reader's notes: "${notes}"

Generate 3 questions that test recall of the key ideas from this reading session.`;

  const raw = await callClaude(system, user);
  return JSON.parse(raw);
}

export async function scoreAnswer(question, answer, bookTitle, chapterTitle, notes) {
  const system = `You are a reading comprehension grader. Score the answer from 0.0 to 1.0 based on how well it demonstrates recall of the material. Return valid JSON only: {"score": <number>, "feedback": "<brief feedback>"}`;

  const user = `Book: "${bookTitle}"
Chapter: "${chapterTitle}"
Context from reader's notes: "${notes}"
Question: "${question}"
Answer: "${answer}"

Score this answer.`;

  const raw = await callClaude(system, user);
  return JSON.parse(raw);
}

export async function generateFlashcards(bookTitle, chapterTitle, notes) {
  const system = `You are a study assistant. Generate 2-3 flashcards for spaced repetition based on the key concepts. Return valid JSON only — an array of objects with "concept" and "explanation" fields.`;

  const user = `Book: "${bookTitle}"
Chapter: "${chapterTitle}"
Reader's notes: "${notes}"

Generate flashcards for the key concepts.`;

  const raw = await callClaude(system, user);
  return JSON.parse(raw);
}
