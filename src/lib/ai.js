// --------------- Provider config ---------------

const PROVIDERS = {
  anthropic: {
    name: 'Anthropic (Claude)',
    placeholder: 'sk-ant-...',
    model: 'claude-haiku-4-5-20251001',
    call: callAnthropic,
  },
  gemini: {
    name: 'Google (Gemini)',
    placeholder: 'AIza...',
    model: 'gemini-2.0-flash',
    call: callGemini,
  },
  openai: {
    name: 'OpenAI (GPT)',
    placeholder: 'sk-...',
    model: 'gpt-4o-mini',
    call: callOpenAI,
  },
};

export function getProviderList() {
  return Object.entries(PROVIDERS).map(([id, p]) => ({ id, name: p.name, placeholder: p.placeholder }));
}

// --------------- Storage helpers ---------------

function storageKey(key) { return `marrow_${key}`; }

export function getProvider() {
  return localStorage.getItem(storageKey('provider')) || 'anthropic';
}

export function setProvider(id) {
  localStorage.setItem(storageKey('provider'), id);
}

export function getApiKey() {
  const provider = getProvider();
  return localStorage.getItem(storageKey(`key_${provider}`)) || '';
}

export function setApiKey(key) {
  const provider = getProvider();
  localStorage.setItem(storageKey(`key_${provider}`), key);
}

export function hasApiKey() {
  return !!getApiKey();
}

// --------------- Provider implementations ---------------

async function callAnthropic(systemPrompt, userMessage, apiKey, model) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content[0].text;
}

async function callGemini(systemPrompt, userMessage, apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 1024 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(systemPrompt, userMessage, apiKey, model) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

// --------------- Unified call ---------------

async function callLLM(systemPrompt, userMessage) {
  const providerId = getProvider();
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key set');
  const raw = await provider.call(systemPrompt, userMessage, apiKey, provider.model);
  // Strip markdown code fences if the model wraps JSON in them
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

// --------------- Public API (unchanged) ---------------

export async function generateRecallQuestions(bookTitle, chapterTitle, notes) {
  const system = `You are a reading comprehension assistant. Generate exactly 3 recall questions to test understanding of what was read. Return valid JSON only — an array of 3 strings, no other text.`;

  const user = `Book: "${bookTitle}"
Chapter: "${chapterTitle}"
Reader's notes: "${notes}"

Generate 3 questions that test recall of the key ideas from this reading session.`;

  const raw = await callLLM(system, user);
  return JSON.parse(raw);
}

export async function scoreAnswer(question, answer, bookTitle, chapterTitle, notes) {
  const system = `You are a thoughtful reading companion. Evaluate the answer and provide a calm gap analysis. Score from 0.0 to 1.0. In "covered" list what the reader got right. In "gaps" list what they might revisit (or empty if nothing). Keep each item to one short sentence. Return valid JSON only: {"score": <number>, "covered": ["..."], "gaps": ["..."]}`;

  const user = `Book: "${bookTitle}"
Chapter: "${chapterTitle}"
Context from reader's notes: "${notes}"
Question: "${question}"
Answer: "${answer}"

Evaluate this answer.`;

  const raw = await callLLM(system, user);
  return JSON.parse(raw);
}

export async function detectChapters(bookTitle, author) {
  const system = `You are a book structure assistant. Given a book title and author, return the list of chapters or major sections. Return valid JSON only — an array of strings, each being a chapter title. If you don't know the book's chapters, return an empty array []. Do not guess or make up chapters.`;

  const user = `Book: "${bookTitle}" by ${author}

List the chapters of this book.`;

  const raw = await callLLM(system, user);
  return JSON.parse(raw);
}

export async function generateFlashcards(bookTitle, chapterTitle, notes) {
  const system = `You are a study assistant. Generate 2-3 flashcards for spaced repetition based on the key concepts. Return valid JSON only — an array of objects with "concept" and "explanation" fields.`;

  const user = `Book: "${bookTitle}"
Chapter: "${chapterTitle}"
Reader's notes: "${notes}"

Generate flashcards for the key concepts.`;

  const raw = await callLLM(system, user);
  return JSON.parse(raw);
}
