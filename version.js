/* The one place the app version lives. Loaded by the page and by sw.js (importScripts), so the offline
   cache name follows the version: bumping it here is all a release needs for phones to update. */
self.APP_VERSION = '1.6.2';
/* Hosts that serve Production. Anywhere else (Test, per-deploy previews, localhost) shows the TEST badge.
   tianruisun.github.io stays until the old GitHub Pages address redirects to Cloudflare. */
self.PRODUCTION_HOSTS = ['student-practice.pages.dev', 'tianruisun.github.io'];
