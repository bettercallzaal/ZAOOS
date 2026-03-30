# Adding GitHub Secrets for Paperclip Sync

Go to: **Settings → Secrets and variables → Actions**

Add these 3 repository secrets:

| Secret Name | Value |
|------------|-------|
| `PAPERCLIP_API_KEY` | *(get from Paperclip dashboard — rotate if previously exposed)* |
| `PAPERCLIP_COMPANY_ID` | *(get from Paperclip dashboard)* |
| `PAPERCLIP_API_URL` | *(current Cloudflare tunnel URL for Paperclip)* |

**Note:** The `PAPERCLIP_API_URL` changed on 2026-03-29. Update this if Paperclip URL changes.
