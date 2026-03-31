import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Save backup
    const { uuid, data } = req.body;
    if (!uuid || !data) return res.status(400).json({ error: 'Missing uuid or data' });
    await redis.set(`marrow:${uuid}`, JSON.stringify(data), { ex: 60 * 60 * 24 * 365 }); // 1 year TTL
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    // Restore from backup
    const uuid = req.query.uuid;
    if (!uuid) return res.status(400).json({ error: 'Missing uuid' });
    const data = await redis.get(`marrow:${uuid}`);
    if (!data) return res.status(404).json({ error: 'No backup found for this ID' });
    return res.status(200).json({ data: typeof data === 'string' ? JSON.parse(data) : data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
