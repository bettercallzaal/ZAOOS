#!/bin/bash
# Reboot bootstrap - waits for network, then lets watchdog handle the rest.
export PATH=$HOME/.local/bin:$PATH
sleep 30
$HOME/bin/fix-node-pty.sh >> $HOME/fix-node-pty.log 2>&1
$HOME/bin/watchdog.sh >> $HOME/watchdog.log 2>&1
echo "$(date -Iseconds) boot complete" >> $HOME/start-agents.log
