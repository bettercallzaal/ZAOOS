/**
 * The Following home feed (GET /api/chat/following + the Following tab in
 * ChatRoom). DEFAULT OFF: on only when NEXT_PUBLIC_FARCASTER_FOLLOWING_FEED is
 * exactly `1`. NEXT_PUBLIC_ so the server route and the client tab read one flag.
 */
export function followingFeedEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FARCASTER_FOLLOWING_FEED === '1';
}
