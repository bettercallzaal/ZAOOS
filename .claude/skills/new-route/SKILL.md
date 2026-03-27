---
name: new-route
description: Use when creating a new API route — scaffolds with ZAO OS conventions (Zod, session, NextResponse, try/catch)
disable-model-invocation: true
argument-hint: "[feature/action] e.g. music/favorites"
---

# New Route — Scaffold a ZAO OS API Route

Creates a new API route following all conventions from `.claude/rules/api-routes.md`.

## Usage

```
/new-route music/favorites
```

## Scaffold Template

Create `src/app/api/$ARGUMENTS/route.ts` with this structure:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/db/supabase';

const RequestSchema = z.object({
  // Define input schema here
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.fid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Implementation here

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] $ARGUMENTS error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Rules

- Always validate with Zod `safeParse` before processing
- Always check session before authenticated operations
- Always return `NextResponse.json()` — never plain Response
- Always wrap in try/catch with sanitized 500 response
- Never expose server-only env vars in responses
- Use `Promise.allSettled` for parallel fault-tolerant operations
- Ask the user what HTTP method and what the route should do before writing
