#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "==> Deploying Decap OAuth Worker (jeff-decap-oauth)"
echo "    When prompted, paste your GitHub OAuth Client Secret:"
echo "    fa890915cd5caaaf095321e400222728d5ea0ef1"
echo
npx wrangler secret put GITHUB_CLIENT_SECRET

echo "==> Deploying worker..."
npx wrangler deploy

echo
echo "==> Done. Note your worker URL (https://jeff-decap-oauth.<subdomain>.workers.dev)."
echo "   Next steps:"
echo "   1) GitHub OAuth App -> Authorization callback URL = <worker-url>/callback"
echo "   2) admin/config.yml -> base_url = <worker-url>"
echo "   3) wrangler.toml    -> CMS_BASE = your live site URL (custom domain recommended)"
echo "   4) Redeploy + push:  npx wrangler deploy && git add -A && git commit -m 'wire oauth' && git push"
