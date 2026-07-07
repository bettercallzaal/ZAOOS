# ZABAL Games stream overlay

A generic, URL-configured browser-source overlay for ZABAL Games workshop streams.
No login, no database, no data feed - everything is set via URL params, so any host
can drop it into Restream Studio or OBS.

Sibling to `overlay/now-playing` (which is per-user + music-data-bound). This one is
brand-generic on purpose.

## How to add it to a stream

- **Restream Studio:** Add element -> Web page -> paste the overlay URL.
- **OBS:** Sources -> add Browser source -> paste the URL. Set width 1920, height 1080,
  and leave the background transparent (the overlay composites over your scene).

## URL

Base: `https://www.thezao.xyz/overlay/zabal-games`

| Param | Values | Default | Notes |
|-------|--------|---------|-------|
| `style` | `lower-third` \| `banner` \| `scene` | `lower-third` | which layout |
| `title` | text | `ZABAL GAMES` | main line / wordmark |
| `subtitle` | text | (empty) | topic / message |
| `live` | `1` \| `0` | `1` | pulsing LIVE badge (lower-third + banner) |
| `theme` | `dark` \| `light` | `dark` | both readable over video |
| `accent` | hex without `#` | `f5a623` | brand accent (rules, badge) |
| `logo` | image URL | (text wordmark) | optional logo mark |
| `pos` | `left` \| `right` | `left` | lower-third corner |
| `size` | `small` \| `medium` \| `large` | `medium` | overall scale |
| `scene` | `starting` \| `brb` \| `thanks` \| `custom` | `starting` | scene-card preset |

Remember to URL-encode spaces (`%20`).

## Examples

Lower-third for a workshop:
```
/overlay/zabal-games?title=ZABAL%20Games&subtitle=Phase%202%20Workshop&live=1
```

Persistent top banner:
```
/overlay/zabal-games?style=banner&subtitle=Ship%20something%20every%20week
```

"Starting soon" full-screen card:
```
/overlay/zabal-games?style=scene&scene=starting&subtitle=We%20go%20live%20at%206pm%20ET
```

Custom brand color + logo:
```
/overlay/zabal-games?style=banner&accent=e0ddaa&logo=https://.../zabal-mark.png
```
