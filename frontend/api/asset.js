const DEFAULT_API_ROOT = 'https://railcar-frostbite-alumni.ngrok-free.dev';

const getApiRoot = () => (
  process.env.API_ROOT ||
  process.env.VITE_API_URL ||
  DEFAULT_API_ROOT
).replace(/\/$/, '');

export default async function handler(req, res) {
  const rawSrc = Array.isArray(req.query.src) ? req.query.src[0] : req.query.src;

  if (!rawSrc) {
    res.status(400).send('Missing src');
    return;
  }

  const apiRoot = getApiRoot();
  const apiUrl = new URL(apiRoot);
  let targetUrl;

  try {
    if (rawSrc.startsWith('/api/') || rawSrc.startsWith('/upload-file/')) {
      targetUrl = new URL(rawSrc, apiRoot);
    } else {
      targetUrl = new URL(rawSrc);
    }
  } catch {
    res.status(400).send('Invalid src');
    return;
  }

  if (targetUrl.hostname !== apiUrl.hostname) {
    res.status(400).send('Unsupported asset host');
    return;
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        'ngrok-skip-browser-warning': '69420',
      },
    });

    if (!upstream.ok) {
      res.status(upstream.status).send('Asset fetch failed');
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const body = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
    res.status(200).send(body);
  } catch {
    res.status(502).send('Asset proxy failed');
  }
}
