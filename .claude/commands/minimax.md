---
name: minimax
description: Call Minimax LLM via the local API
parameters:
  - name: prompt
    type: string
    required: true
    description: The prompt to send to Minimax
  - name: system
    type: string
    required: false
    description: Optional system message
  - name: temperature
    type: number
    required: false
    description: Optional temperature (0-1)
  - name: max_tokens
    type: number
    required: false
    description: Optional max tokens
---

Call Minimax LLM through the local /api/chat/minimax endpoint.

Usage:
  /minimax "What is Farcaster?"
  /minimax "Explain frame specs" --system "You are a Farcaster expert"
  /minimax "Write a short poem" --temperature 0.9 --max_tokens 100
