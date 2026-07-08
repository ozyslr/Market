// ─── Typesense Provisioning Guide ─────────────────────────────────────────
// Run: node scripts/provision-typesense.mjs
// Prerequisites: TYPESENSE_HOST, TYPESENSE_API_KEY, TYPESENSE_PROTOCOL env vars

console.log(`
╔══════════════════════════════════════════════════════════╗
║         Typesense Provisioning Guide                     ║
╚══════════════════════════════════════════════════════════╝

Option 1: Typesense Cloud (Recommended)
  1. Go to https://cloud.typesense.org
  2. Create a cluster (2 nodes minimum for HA)
  3. Copy API key from dashboard
  4. Set in .env:
     TYPESENSE_HOST=xxx.a1.typesense.net
     TYPESENSE_PORT=443
     TYPESENSE_PROTOCOL=https
     TYPESENSE_API_KEY=xxx

Option 2: Self-Hosted (Hetzner VPS ~$5/mo)
  1. Provision Ubuntu 22.04 VPS
  2. Install Typesense:
     curl -O https://dl.typesense.org/releases/28.0/typesense-server-28.0-amd64.deb
     sudo dpkg -i typesense-server-28.0-amd64.deb
  3. Configure /etc/typesense/typesense-server.ini:
     api-key = YOUR_SECRET_KEY
     data-dir = /var/lib/typesense
     enable-cors = true
  4. Start: sudo systemctl start typesense-server
  5. Set in .env:
     TYPESENSE_HOST=<VPS_IP>
     TYPESENSE_PORT=8108
     TYPESENSE_PROTOCOL=http
     TYPESENSE_API_KEY=YOUR_SECRET_KEY
     TYPESENSE_SYNC_SECRET=YOUR_SYNC_SECRET

After provisioning:
  1. node scripts/bootstrap-typesense.mjs  (index all products)
  2. Verify: curl http://<host>:8108/health
  3. Search test: curl http://<host>:8108/collections/products_tr/documents/search?q=*
`);

console.log('Typesense provisioning guide complete.');
console.log('Next: node scripts/bootstrap-typesense.mjs');
