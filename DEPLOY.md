# Personal Portfolio — Deployment Documentation

This is a static portfolio website using pure **HTML5, CSS3 (Vanilla Custom Properties), and ES Module JavaScript**. It has no build step and can be served by any static web server (such as Vercel, Netlify, GitHub Pages, or Cloudflare Pages).

---

## 1. Hosting on Vercel

The portfolio is optimized for deployment to **Vercel** as a static project.

### Automatic Git Deployment
1. Push the repository to GitHub.
2. In the Vercel Dashboard, click **Add New** → **Project**.
3. Select your repository.
4. Keep the default settings:
   - **Framework Preset**: Other (Vercel automatically detects a static index.html)
   - **Build Command**: None (leave empty)
   - **Output Directory**: `.` (root directory)
5. Click **Deploy**.

---

## 2. Custom Domain Configuration (`vardh.me`)

To connect your custom domain `vardh.me`, configure the following DNS records at your registrar or DNS provider (e.g., Namecheap, Cloudflare, Google Domains):

| Type | Name | Value | TTL | Purpose |
|---|---|---|---|---|
| **A** | `@` | `76.76.21.21` | Auto / 1 Hour | Points root domain (`vardh.me`) to Vercel's edge network |
| **CNAME** | `www` | `cname.vercel-dns.com.` | Auto / 1 Hour | Points subdomain (`www.vardh.me`) to Vercel |

After updating the records, add `vardh.me` and `www.vardh.me` in your **Vercel Project Settings → Domains** dashboard. Vercel will automatically provision SSL certificates.

---

## 3. Email Routing

Vardh's email is designated as `vardh@vardh.me`. To handle inbound emails:

1. Configure an email forwarding service (such as **Cloudflare Email Routing**, **ImprovMX**, or **ForwardEmail**).
2. Set up MX records pointing to the forwarder at your DNS registrar:
   - For example, if using Cloudflare Email Routing, follow the Cloudflare dashboard guides to auto-inject the routing MX and TXT validation records.
3. Configure the forwarding destination to redirect incoming `vardh@vardh.me` messages directly to your personal inbox.

---

## 4. Local Development

To run the project locally without any bundle installation:
1. Open the project in VS Code.
2. Click **Go Live** via the **Live Server** extension.
3. Alternatively, run using Node.js:
   ```bash
   npx serve
   ```
4. Open `http://localhost:3000` (or the port specified by serve).
