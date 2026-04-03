/**
 * ClawDown Poker Agent - WebSocket Client for ZOE
 *
 * Usage:
 *   node scripts/clawdown-client.js
 *
 * Expects API key at ~/.clawdown/api_key (chmod 600)
 * Logs to stdout (redirect to ~/.clawdown/ws.log for background)
 *
 * See research/200-clawdown-poker-agent/ for full docs.
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(process.env.HOME, '.clawdown');
const apiKey = fs.readFileSync(path.join(CONFIG_DIR, 'api_key'), 'utf8').trim();
const wsUrl = 'wss://api.clawdown.xyz/ws/agent?api_key=' + apiKey;

let ws;
let reconnectAttempts = 0;
const MAX_RECONNECT = 10;

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

// --- State Normalization ---
// Server sends nested {hand: {...}, match: {...}} or flat state
function normalizeState(raw) {
  const h = raw.hand || raw;
  const m = raw.match || raw;
  return {
    hole_cards: h.hole_cards || h.your_cards || raw.your_cards || [],
    community_cards: h.community_cards || raw.community_cards || [],
    legal_actions: h.legal_actions || raw.legal_actions || [],
    to_call: h.to_call ?? raw.to_call ?? 0,
    pot: h.pot ?? raw.pot ?? 0,
    your_stack: h.your_stack ?? m.your_stack ?? raw.your_stack ?? raw.stack ?? 0,
    opponent_stack: h.opponent_stack ?? m.opponent_stack ?? 0,
    min_raise: h.min_raise ?? raw.min_raise ?? 0,
    max_raise: h.max_raise ?? raw.max_raise ?? 0,
    phase: h.phase || h.round || h.your_position || raw.phase || '',
    blinds: h.blinds || raw.blinds || {},
    position: h.your_position || raw.your_position || '',
  };
}

// --- Poker Decision Engine ---
function evaluatePokerAction(rawState) {
  const state = normalizeState(rawState);
  const hole = state.hole_cards;
  const community = state.community_cards;
  const legal = state.legal_actions;
  const toCall = state.to_call;
  const pot = state.pot;
  const stack = state.your_stack;
  const minRaise = state.min_raise;
  const maxRaise = state.max_raise;

  const ranks = '23456789TJQKA';
  function cardRank(c) { return ranks.indexOf((c[0] || '').toUpperCase()); }
  function cardSuit(c) { return (c[1] || '').toLowerCase(); }

  const r1 = cardRank(hole[0] || '');
  const r2 = cardRank(hole[1] || '');
  const highRank = Math.max(r1, r2);
  const lowRank = Math.min(r1, r2);
  const paired = r1 === r2;
  const suited = hole.length === 2 && cardSuit(hole[0]) === cardSuit(hole[1]);
  const connected = highRank - lowRank <= 1;

  // Preflop hand strength (0-100)
  let handStrength = 0;
  if (paired) {
    if (highRank >= 12) handStrength = 95;      // AA, KK
    else if (highRank >= 10) handStrength = 85;  // QQ, JJ
    else if (highRank >= 8) handStrength = 70;   // TT, 99
    else handStrength = 55;                       // low pairs
  } else if (highRank >= 12 && lowRank >= 11) {
    handStrength = suited ? 88 : 82;             // AK, AQ
  } else if (highRank >= 12 && lowRank >= 9) {
    handStrength = suited ? 75 : 68;             // AT+
  } else if (highRank >= 11 && lowRank >= 9) {
    handStrength = suited ? 65 : 58;             // KQ, KJ, QJ
  } else if (suited && connected && highRank >= 7) {
    handStrength = 55;                            // suited connectors
  } else if (suited && highRank >= 10) {
    handStrength = 50;
  } else if (highRank >= 12) {
    handStrength = 42;                            // Ax offsuit
  } else {
    handStrength = 25;
  }

  // Post-flop adjustments
  if (community.length > 0) {
    const allCards = [...hole, ...community];
    const allRanks = allCards.map(c => cardRank(c));
    const allSuits = allCards.map(c => cardSuit(c));
    const boardRanks = community.map(c => cardRank(c));
    const holeRanks = [r1, r2];
    let madeHand = 0;

    // Pairs/trips with board
    for (const hr of holeRanks) {
      const matches = boardRanks.filter(br => br === hr).length;
      if (matches >= 2) madeHand = Math.max(madeHand, 80);       // trips
      else if (matches === 1) {
        if (hr >= 10) madeHand = Math.max(madeHand, 65);         // top pair high kicker
        else madeHand = Math.max(madeHand, 50);
      }
    }

    // Flush / flush draw
    const suitCounts = {};
    allSuits.forEach(s => { suitCounts[s] = (suitCounts[s] || 0) + 1; });
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    if (maxSuitCount >= 5) madeHand = Math.max(madeHand, 85);
    else if (maxSuitCount === 4) madeHand = Math.max(madeHand, 45);

    // Straight (simplified)
    const uniqueRanks = [...new Set(allRanks)].sort((a, b) => a - b);
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
      if (uniqueRanks[i + 4] - uniqueRanks[i] === 4) madeHand = Math.max(madeHand, 82);
    }

    // Two pair
    if (paired && boardRanks.some(br => holeRanks.includes(br))) {
      madeHand = Math.max(madeHand, 72);
    }

    handStrength = Math.max(handStrength, madeHand);
  }

  // Decision
  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
  let action = 'fold';
  let amount = null;
  let chat = null;

  if (toCall === 0) {
    if (handStrength >= 70 && legal.includes('raise') && minRaise > 0) {
      action = 'raise';
      const raiseSize = handStrength >= 85
        ? Math.min(Math.round(pot * 0.8 + minRaise), maxRaise)
        : minRaise;
      amount = Math.max(minRaise, Math.min(raiseSize, maxRaise));
    } else {
      action = 'check';
    }
  } else {
    if (handStrength >= 80 && legal.includes('raise') && minRaise > 0) {
      action = 'raise';
      const raiseSize = handStrength >= 90
        ? Math.min(Math.round(pot * 1.0 + minRaise), maxRaise)
        : minRaise;
      amount = Math.max(minRaise, Math.min(raiseSize, maxRaise));
      if (handStrength >= 90) chat = "Let's go.";
    } else if (handStrength >= 45 || (handStrength >= 35 && potOdds < 0.25)) {
      action = 'call';
    } else if (handStrength >= 30 && toCall <= stack * 0.05) {
      action = 'call';
    } else {
      action = 'fold';
    }
  }

  // Ensure action is legal
  if (!legal.includes(action)) {
    if (action === 'raise' && legal.includes('call')) action = 'call';
    else if (action === 'check' && legal.includes('call')) action = 'call';
    else if (action === 'fold' && legal.includes('check')) action = 'check';
    else if (legal.includes('check')) action = 'check';
    else if (legal.includes('call')) action = 'call';
    else if (legal.includes('fold')) action = 'fold';
    else action = legal[0];
  }

  return { action, amount, chat };
}

// --- WebSocket Connection ---
function connect() {
  log('Connecting to ClawDown WebSocket...');
  ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    log('Connected!');
    reconnectAttempts = 0;
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    switch (msg.type) {
      case 'connected':
        log(`Authenticated as ${msg.agent_name} (${msg.agent_id})`);
        if (msg.pending_challenges && msg.pending_challenges.length > 0) {
          for (const ch of msg.pending_challenges) {
            const challengeId = ch.challenge_id || ch.id || ch;
            log(`Confirming readiness for challenge ${challengeId}`);
            const readyMsg = { type: 'ready', challenge_id: challengeId };
            if (ch.test_state) {
              const ns = normalizeState(ch.test_state);
              const decision = evaluatePokerAction(ch.test_state);
              readyMsg.readiness_response = { action: decision.action, parsed_cards: ns.hole_cards };
            }
            ws.send(JSON.stringify(readyMsg));
          }
        }
        if (msg.active_session) {
          log(`Active session: ${JSON.stringify(msg.active_session)}`);
        }
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      case 'readiness_check': {
        log(`READINESS CHECK for challenge ${msg.challenge_id}`);
        const readyMsg = { type: 'ready', challenge_id: msg.challenge_id };
        if (msg.test_state) {
          const ns = normalizeState(msg.test_state);
          const decision = evaluatePokerAction(msg.test_state);
          readyMsg.readiness_response = { action: decision.action, parsed_cards: ns.hole_cards };
          log(`Cards: ${ns.hole_cards}, Action: ${decision.action}`);
        }
        ws.send(JSON.stringify(readyMsg));
        log('Readiness confirmed!');
        break;
      }

      case 'session_starting':
        log(`SESSION STARTING: ${JSON.stringify(msg)}`);
        break;

      case 'your_turn': {
        const ns = normalizeState(msg.state);
        log(`MY TURN - Session: ${msg.session_id}, Phase: ${ns.phase}`);
        log(`Cards: ${JSON.stringify(ns.hole_cards)}, Community: ${JSON.stringify(ns.community_cards)}`);
        log(`Pot: ${ns.pot}, To call: ${ns.to_call}, Stack: ${ns.your_stack}, Opp: ${ns.opponent_stack}`);
        log(`Legal: ${JSON.stringify(ns.legal_actions)}, Raise: [${ns.min_raise}, ${ns.max_raise}]`);

        const decision = evaluatePokerAction(msg.state);
        const actionMsg = {
          type: 'action',
          session_id: msg.session_id,
          action: decision.action
        };
        if (decision.amount !== null) actionMsg.amount = decision.amount;
        if (decision.chat) actionMsg.chat = decision.chat;

        log(`ACTION: ${JSON.stringify(actionMsg)}`);
        ws.send(JSON.stringify(actionMsg));
        break;
      }

      case 'action_result':
        log(`Action accepted: ${msg.canonical_action || msg.action}${msg.normalized ? ' (normalized)' : ''}`);
        break;

      case 'round_result':
        log(`ROUND RESULT: winner=${msg.winner}, pot=${msg.pot}, showdown=${msg.showdown}`);
        if (msg.showdown) log(`Cards: ${msg.your_cards} vs ${msg.opponent_cards}, Board: ${msg.final_board}`);
        break;

      case 'session_result':
        log(`SESSION RESULT: winner=${msg.winner}, stack=${msg.your_final_stack}, hands=${msg.hands_played}`);
        try {
          fs.writeFileSync(path.join(CONFIG_DIR, 'last_result.json'), JSON.stringify(msg, null, 2));
        } catch (e) { /* ignore */ }
        break;

      case 'tournament_update':
        log(`TOURNAMENT: placement=${msg.placement}, elo=${msg.elo_change > 0 ? '+' : ''}${msg.elo_change}, prize=${msg.prize_usdc} USDC`);
        break;

      case 'blind_increase':
        log(`Blinds: ${msg.blinds?.small}/${msg.blinds?.big} (level ${msg.level})`);
        break;

      case 'agent_removed':
        log('REMOVED by owner. Exiting.');
        process.exit(0);
        break;

      default:
        log(`[${msg.type}] ${JSON.stringify(msg)}`);
    }
  });

  ws.on('error', (err) => {
    log(`WS Error: ${err.message}`);
  });

  ws.on('close', (code, reason) => {
    log(`Disconnected: code=${code} reason=${reason.toString()}`);
    if (code === 4001) {
      log('Removed by owner, not reconnecting.');
      process.exit(0);
    }
    if (reconnectAttempts < MAX_RECONNECT) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts++;
      log(`Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})...`);
      setTimeout(connect, delay);
    } else {
      log('Max reconnection attempts reached. Exiting.');
      process.exit(1);
    }
  });
}

connect();
