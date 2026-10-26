#!/bin/bash
# Open /tmp/clipboard.html in a SINGLE tab GLOBALLY.
# 1. Close every clipboard tab in every browser (Brave/Chrome/Arc/Safari)
# 2. Open one fresh tab in the default browser
# Result: exactly one clipboard tab anywhere, ever.

TARGET="file:///private/tmp/clipboard.html"

close_all_in() {
  local app="$1"
  osascript 2>/dev/null <<APPLESCRIPT
tell application "$app"
  if not (exists window 1) then return 0
  set closed to 0
  repeat with w in windows
    set tabsToClose to {}
    repeat with t in tabs of w
      try
        set u to URL of t
        if u contains "clipboard.html" or u contains "/tmp/clipboard" then
          set end of tabsToClose to t
        end if
      end try
    end repeat
    repeat with ti from (count of tabsToClose) to 1 by -1
      try
        close (item ti of tabsToClose)
        set closed to closed + 1
      end try
    end repeat
  end repeat
  return closed
end tell
APPLESCRIPT
}

# Nuke clipboard tabs in every Chromium-family browser + Safari
total=0
for app in "Brave Browser" "Google Chrome" "Arc" "Safari"; do
  n=$(close_all_in "$app")
  [ -n "$n" ] && [ "$n" -gt 0 ] && echo "$app: closed $n" && total=$((total + n))
done
echo "Total closed: $total"

# Open one fresh tab in the default browser
open "$TARGET"
echo "opened single tab in default browser"
