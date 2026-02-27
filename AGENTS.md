# Engineering Handover: Goldmorr PWA System

## Architecture Overview
The Goldmorr system is a multi-utility PWA designed for field deployment. It uses a **Dual Manifest Strategy** to serve different app experiences from the same codebase.

### 1. Dual Entry Points
- **Public Users (Facility Managers):**
  - URL: `https://gold-app-two.vercel.app/facility.html`
  - Manifest: `manifest.json` (Scoped to `/facility.html`)
  - Experience: Installs only the "Facility Guard" tool.
- **Admin Users (Team):**
  - URL: `https://gold-app-two.vercel.app/admin.html`
  - Manifest: `manifest-admin.json` (Scoped to root `/`)
  - Experience: Installs the full "Goldmorr Hub" with access to all tools.

### 2. Backend & Data
- **Database:** Firebase Firestore (Project: `goldmorr-hub`).
- **Authentication:** None (Open Access via obfuscated URLs).
- **Lead IDs:** Sequential IDs (e.g., `GM-1001`) generated via Firestore transactions in `assets/api.js`.
- **Admin Dashboard:** `dashboard.html` fetches live metrics and provides CSV export/System Reset tools.

### 3. Key Files
- `admin.html`: The Admin Hub landing page.
- `show_links.html`: A digital menu card for easy access to tools during trade shows.
- `sw.js`: Service Worker handling caching for offline use. **Must bump cache version when updating files.**
- `assets/api.js`: Central logic for Firebase interactions.

### 4. Deployment
- **Platform:** Vercel (Auto-deploy on merge to `main`).
- **Critical:** When adding new HTML files, you MUST update `ASSETS` in `sw.js` and bump the `CACHE_NAME` version string to force clients to update.
