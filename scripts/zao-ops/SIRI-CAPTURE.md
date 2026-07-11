# Siri capture -> Ideas topic (iOS Shortcut)

Say "Hey Siri, ZAO capture" and speak an idea; it lands in your ZAAL BOTZ
**Ideas** topic, filed by ZOE - no unlock, no typing. The phone-native front
door for the second brain.

This is a recipe you install on your phone (Apple can't let a script create a
Shortcut for you). ~3 minutes. Team members do the same pointed at their own bot.

## What you need

- The ZOE bot token (BotFather) - the same one in `~/.zao/private/tg.env`.
- Your ZAAL BOTZ group id and the Ideas topic thread id.
  - Group id: run `/chatid` in the group (ZOE replies with the chat id).
  - Ideas thread id: it's in `~/.zao/zoe/topics.json` on the VPS (key `"Ideas"`).

## Build the Shortcut

1. Shortcuts app -> **+** -> name it **ZAO Capture**.
2. Add action **Dictate Text** (Language: English). This captures your voice.
3. Add action **Text** -> set it to your dictated text: tap the field, pick the
   **Dictated Text** variable.
4. Add action **Get Contents of URL**:
   - URL: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage`
   - Method: **POST**
   - Request Body: **Form**
   - Fields:
     - `chat_id` = your group id (e.g. `-1003813973176`)
     - `message_thread_id` = your Ideas thread id (e.g. `21`)
     - `text` = the **Dictated Text** variable
5. (Optional) Add **Show Notification** -> "Captured" so you get confirmation.
6. Save. In the Shortcut's settings, confirm "Use with Siri" is on.

## Use it

- "Hey Siri, ZAO Capture" -> speak the idea -> it posts to the Ideas topic ->
  ZOE files it as a capture (shows in your cockpit / idea inbox).
- Add it to your Home Screen or Lock Screen for a one-tap version.

## Security note

The bot token lives ONLY inside the Shortcut on your phone (iCloud-Keychain
backed) - same trust level as `tg.env` on your Mac. Do NOT paste the token
anywhere it gets committed or shared. If a phone is lost, rotate the token via
BotFather. This recipe never stores the real token in the repo (the URL above
uses a `<YOUR_BOT_TOKEN>` placeholder).

## Why a Shortcut and not a server

A capture endpoint would be a new authenticated attack surface on the VPS. The
Shortcut hits Telegram's own API directly with your bot - no new server, no new
secret to guard beyond the token you already have.
