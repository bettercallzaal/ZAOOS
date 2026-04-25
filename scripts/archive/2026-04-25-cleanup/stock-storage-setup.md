# ZAOstock Storage Bucket Setup

One-time setup for Phase 1 attachments (doc 477).

## In Supabase Dashboard

1. Go to Storage -> New bucket
2. Name: `stock-attachments`
3. Public: **OFF** (private bucket)
4. File size limit: 25 MB
5. Allowed MIME types: leave blank (any)
6. Save

That's it. The API routes at `/api/stock/team/attachments` use the service role key to:
- create signed upload URLs (client PUTs directly, bypasses our request body limits)
- create short-lived (10 min) signed download URLs on GET
- remove objects on DELETE

No RLS policies needed on the bucket itself because only server-side code with service role touches it. Clients never get direct bucket access - they only see URLs the server signs for them.

## Verify

After creating the bucket, upload via the dashboard (Sponsors or Artists tab, expand a row, open the "Files" tab). If it errors with `bucket not found`, check the name matches exactly: `stock-attachments`.

## Related

- `scripts/stock-schema.sql` - creates the `stock_attachments` metadata table
- `src/app/api/stock/team/attachments/` - API routes
- `src/app/stock/team/AttachmentPanel.tsx` - UI component
- `research/events/477-zaostock-dashboard-notion-replacement/` - full context
