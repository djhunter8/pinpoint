// Follows a Google Maps short link and returns where it points.
// Only Google hosts are followed, and the final Google page is not fetched.
const OK_HOST = /(^|\.)(goo\.gl|g\.co|share\.google|google\.[a-z.]+)$/i;
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' } });

export default async (req) => {
  let url;
  try { url = new URL(new URL(req.url).searchParams.get('u') || ''); } catch { return json({ error: 'bad url' }, 400); }
  if (url.protocol !== 'https:' || !OK_HOST.test(url.hostname)) return json({ error: 'unsupported host' }, 400);
  for (let hop = 0; hop < 6; hop++) {
    if (/(^|\.)google\.[a-z.]+$/i.test(url.hostname)) return json({ url: url.toString() });
    let res;
    try {
      res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (compatible; Pinpoint)' } });
    } catch { return json({ error: 'fetch failed' }, 502); }
    const loc = res.headers.get('location');
    if (!loc || res.status < 300 || res.status > 399) return json({ url: url.toString() });
    try { url = new URL(loc, url); } catch { return json({ error: 'bad redirect' }, 502); }
    if (url.protocol !== 'https:' || !OK_HOST.test(url.hostname)) return json({ error: 'unsupported redirect' }, 502);
  }
  return json({ url: url.toString() });
};
