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
 *
 * Security note: we issue a random `state` per auth request, store it in an
 * HttpOnly cookie, and require it to match on the callback (CSRF protection).
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const CMS_BASE = env.CMS_BASE || '';
    const cookie = request.headers.get('Cookie') || '';
    const readState = () => (cookie.match(/decap_state=([^;]+)/) || [])[1];

    // Step 1: start auth
    if (url.pathname === '/auth') {
      const state = crypto.randomUUID();
      const redirectUri = `${url.origin}/callback`;
      const gh = 'https://github.com/login/oauth/authorize?client_id=' +
        encodeURIComponent(env.GITHUB_CLIENT_ID) +
        '&redirect_uri=' + encodeURIComponent(redirectUri) +
        '&scope=' + encodeURIComponent('repo') +
        '&state=' + state;
      return new Response(null, {
        status: 302,
        headers: {
          'Location': gh,
          'Set-Cookie': `decap_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
        },
      });
    }

    // Step 2: GitHub calls back with a code; exchange for a token, then hand off to CMS
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const stateParam = url.searchParams.get('state');
      const cookieState = readState();
      if (!code) return new Response('Missing code', { status: 400 });
      if (!stateParam || !cookieState || stateParam !== cookieState) {
        return new Response('Invalid state (possible CSRF)', { status: 400 });
      }

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

      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${CMS_BASE}/#/access_token=${access}`,
          'Set-Cookie': `decap_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
        },
      });
    }

    return new Response('Decap OAuth provider.\nVisit /auth to begin.', { status: 200 });
  },
};
