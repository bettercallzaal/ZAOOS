import { HindsightClient } from '@vectorize-io/hindsight-client';

const HINDSIGHT_BASE_URL = process.env.HINDSIGHT_API_URL || 'http://localhost:8888';

export const hindsight = new HindsightClient({
  baseUrl: HINDSIGHT_BASE_URL,
});

export default hindsight;
