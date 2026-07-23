/*
 * Decap CMS — GitHub OAuth provider (Cloudflare Worker)
 * No server to manage; deploy with `wrangler deploy` from decap-oauth/.
 *
 * Env / Secrets:
 *   GITHUB_CLIENT_ID     — from your GitHub OAuth App
 *   GITHUB_CLIENT_SECRET — set as a secret: `wrangler secret put GITHUB_CLIENT_SECRET`
 *   CMS_BASE             — your live site URL, e.g. https://jeff.pages.dev
 *
 * GitHub OAuth App settings:
 *   Homepage URL:        https://jeff.pages.dev
 *   Authorization callback URL: https://<worker-subdomain>.workers.dev/callback
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const CMS_BASE = env.CMS_BASE || '';

    // Step 1: start auth
    if (url.pathname === '/auth') {
      const redirectUri = `${url.origin}/callback`;
      const gh = 'https://github.com/login/oauth/authorize?client_id=' +
        encodeURIComponent(env.GITHUB_CLIENT_ID) +
        '&redirect_uri=' + encodeURIComponent(redirectUri) +
        '&scope=' + encodeURIComponent('repo') +
        '&state=' + crypto.randomUUID();
      return Response.redirect(gh, 302);
    }

    // Step 2: GitHub calls back with a code; exchange for a token, then hand off to CMS
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) return new Response('Missing code', { status: 400 });

      const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const tok = await tokenResp.json();
      const access = tok.access_token;
      if (!access) return new Response('Token exchange failed', { status: 400 });

      return Response.redirect(`${CMS_BASE}/#/access_token=${access}`, 302);
    }

    return new Response('Decap OAuth provider.\nVisit /auth to begin.', { status: 200 });
  },
};
