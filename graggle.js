const { io } = require('socket.io-client');
const axios = require('axios');
const fs = require('fs');

const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.amongclawds.com/api/v1';
const WS_URL = 'wss://api.amongclawds.com';

const TASK_FILE = 'amongclawds_task.json';
const RESPONSE_FILE = 'amongclawds_response.json';
const LOG_FILE = 'game.log';
const EVENTS_FILE = 'game_events.log';

function log(msg) {
    const timestamp = new Date().toISOString();
    const text = `[${timestamp}] ` + (typeof msg === 'string' ? msg : JSON.stringify(msg));
    console.log(text);
    fs.appendFileSync(LOG_FILE, text + '\n');
}

function notify(msg) {
    const timestamp = new Date().toISOString();
    const text = `[${timestamp}] NOTIFY: ${msg}`;
    log(text);
    fs.appendFileSync(EVENTS_FILE, text + '\n');
}

let gameContext = {
    myId: null,
    myName: 'Graggle',
    myRole: null,
    myStatus: 'alive',
    gameId: null,
    currentRound: 0,
    currentPhase: null,
    phaseEndsAt: null,
    agents: [],
    traitorTeammates: [],
    chatHistory: [],
    votes: [],
    deaths: [],
    revealedRoles: {}
};

let decisionPending = false;
let initialDecisionDone = false;
let lastJoinEmit = 0;

const socket = io(WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 9999,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
});

setInterval(() => {
    if (socket.connected) {
        socket.emit('ping');
        log('[WS] Sent heartbeat ping');
    }
}, 25000);

socket.on('pong', () => {
    log('[WS] Received heartbeat pong');
});

socket.on('connect_error', (err) => {
    log('[WS] Connect Error: ' + err.message);
});

socket.on('disconnect', (reason) => {
    log('[WS] Disconnected: ' + reason);
});

socket.onAny((eventName, ...args) => {
    if (!['game_state', 'chat_message', 'pong'].includes(eventName)) {
        log(`[WS] Event: ${eventName} data: ${JSON.stringify(args)}`);
    }
});

async function requestDecision(type, data) {
    if (decisionPending) {
        log('[BRAIN] Decision already pending, skipping task...');
        return null;
    }
    
    decisionPending = true;
    const task = {
        type,
        gameContext,
        ...data
    };
    fs.writeFileSync(TASK_FILE, JSON.stringify(task, null, 2));
    log(`[BRAIN] Task (${type}) written to ${TASK_FILE}. Waiting for response...`);
    
    const checkResponse = () => {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (fs.existsSync(RESPONSE_FILE)) {
                    clearInterval(interval);
                    try {
                        const response = JSON.parse(fs.readFileSync(RESPONSE_FILE, 'utf8'));
                        fs.unlinkSync(RESPONSE_FILE);
                        fs.unlinkSync(TASK_FILE);
                        decisionPending = false;
                        resolve(response);
                    } catch (e) {
                        log('[BRAIN] Error reading response: ' + e.message);
                    }
                }
            }, 500);
            
            setTimeout(() => {
                if (decisionPending) {
                    clearInterval(interval);
                    log('[BRAIN] Decision timed out.');
                    decisionPending = false;
                    if (fs.existsSync(TASK_FILE)) fs.unlinkSync(TASK_FILE);
                    resolve(null);
                }
            }, 120000);
        });
    };
    
    return await checkResponse();
}

socket.on('connect', () => {
    log('[WS] Connected to server');
    socket.emit('authenticate', { apiKey: API_KEY });
});

socket.on('authenticated', async (data) => {
    log('[WS] Authenticated as: ' + data.name);
    gameContext.myId = data.agentId;
    gameContext.myName = data.name;
    
    try {
        const url = `${BASE_URL}/agents/name/${gameContext.myName}`;
        const meRes = await axios.get(url);
        if (meRes.data.currentGame && meRes.data.currentGame.gameId) {
            log('[API] Already in game: ' + meRes.data.currentGame.gameId);
            gameContext.gameId = meRes.data.currentGame.gameId;
            socket.emit('join_game', gameContext.gameId);
            lastJoinEmit = Date.now();
        } else {
            log('[API] Joining lobby queue');
            await axios.post(`${BASE_URL}/lobby/join`, {}, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
        }
    } catch (err) {
        log('[API] Error during init: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message));
    }
});

socket.on('game_matched', (data) => {
    notify(`Game matched! Game ID: ${data.gameId}`);
    gameContext.gameId = data.gameId;
    gameContext.myRole = data.role;
    gameContext.agents = data.agents;
    gameContext.traitorTeammates = data.traitorTeammates || [];
    gameContext.chatHistory = [];
    gameContext.deaths = [];
    gameContext.revealedRoles = {};
    socket.emit('join_game', data.gameId);
    lastJoinEmit = Date.now();
    notify(`Role assigned: ${data.role}`);
    initialDecisionDone = false;
});

socket.on('game_state', async (state) => {
    // Only log state details if phase or round changed, to avoid spam
    if (gameContext.currentPhase !== state.currentPhase || gameContext.currentRound !== state.currentRound) {
        log(`[WS] Game state: Role=${state.yourRole}, Phase=${state.currentPhase}, Round=${state.currentRound}`);
    }
    
    gameContext.currentRound = state.currentRound;
    gameContext.currentPhase = state.currentPhase;
    gameContext.myRole = state.yourRole;
    gameContext.traitorTeammates = state.traitorTeammates || [];
    gameContext.agents = state.agents;
    gameContext.phaseEndsAt = state.phaseEndsAt;
    
    const me = state.agents.find(a => a.id === gameContext.myId);
    if (me) {
        gameContext.myStatus = me.status;
        if (me.status === 'disconnected') {
            const now = Date.now();
            if (now - lastJoinEmit > 5000) { // Throttle rejoin to once every 5s
                log(`[WS] My status: disconnected. Re-emitting join_game...`);
                socket.emit('join_game', gameContext.gameId);
                lastJoinEmit = now;
            }
        }
    }

    if (gameContext.myStatus === 'alive' && !initialDecisionDone) {
        if (state.currentPhase === 'discussion') {
            initialDecisionDone = true;
            const decision = await requestDecision('discuss', { reason: 'Joined mid-discussion' });
            if (decision && decision.message) sendMessage(decision.message);
        } else if (state.currentPhase === 'voting') {
            initialDecisionDone = true;
            const decision = await requestDecision('vote', { reason: 'Joined mid-voting' });
            if (decision && decision.targetId) castVote(decision.targetId, decision.rationale);
        }
    }
});

socket.on('phase_change', async (data) => {
    log(`[WS] Phase change: ${data.phase} (Round ${data.round})`);
    gameContext.currentPhase = data.phase;
    gameContext.currentRound = data.round;
    gameContext.phaseEndsAt = data.endsAt;
    initialDecisionDone = true;

    if (gameContext.myStatus !== 'alive') return;

    if (data.phase === 'discussion') {
        const decision = await requestDecision('discuss', { reason: 'Phase started' });
        if (decision && decision.message) sendMessage(decision.message);
    } else if (data.phase === 'voting') {
        const decision = await requestDecision('vote', {});
        if (decision && decision.targetId) castVote(decision.targetId, decision.rationale);
    } else if (data.phase === 'murder' && gameContext.myRole === 'traitor') {
        const decision = await requestDecision('murder', {});
        if (decision && decision.targetId) castMurder(decision.targetId);
    }
});

socket.on('chat_message', async (data) => {
    gameContext.chatHistory.push(data);
    log(`[CHAT] ${data.agentName}: ${data.message}`);
    if (gameContext.currentPhase === 'discussion' && gameContext.myStatus === 'alive') {
        const mentioned = data.message.toLowerCase().includes(`@${gameContext.myName.toLowerCase()}`);
        if (mentioned || Math.random() < 0.15) {
            const decision = await requestDecision('discuss', { reason: mentioned ? 'Mentioned' : 'Random interaction', newMessage: data });
            if (decision && decision.message) sendMessage(decision.message);
        }
    }
});

socket.on('agent_died', (data) => {
    notify(`Agent died: ${data.agentName} (${data.cause})`);
    const agent = gameContext.agents.find(a => a.id === data.agentId);
    if (agent) agent.status = 'dead';
    gameContext.deaths.push({ ...data, round: gameContext.currentRound });
});

socket.on('agent_banished', (data) => {
    notify(`Agent banished: ${data.agentName} (Role: ${data.role})`);
    const agent = gameContext.agents.find(a => a.id === data.agentId);
    if (agent) { agent.status = 'dead'; agent.role = data.role; }
    gameContext.revealedRoles[data.agentId] = data.role;
    gameContext.deaths.push({ ...data, cause: 'banished', round: gameContext.currentRound });
});

socket.on('you_eliminated', (data) => {
    notify(`I was eliminated! Reason: ${data.reason}`);
    gameContext.myStatus = 'dead';
});

socket.on('game_ended', (data) => {
    notify(`Game ended. Winner: ${data.winner}`);
    
    const summary = `
## Game Summary (${new Date().toISOString()})
- Game ID: ${gameContext.gameId}
- My Role: ${gameContext.myRole}
- Result: ${data.winner === gameContext.myRole || (data.winner === 'innocents' && gameContext.myRole === 'innocent') ? 'Win' : 'Loss'}
- Winner: ${data.winner}
- Deaths: ${gameContext.deaths.map(d => `${d.agentName} (${d.cause || 'banished'})`).join(', ')}
`;
    fs.appendFileSync('game_logs.md', summary + '\n---\n');
    initialDecisionDone = false;
    
    setTimeout(() => {
        axios.post(`${BASE_URL}/lobby/join`, {}, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        }).then(() => log('[API] Rejoined lobby queue'))
          .catch(err => log('[API] Error rejoining lobby: ' + err.message));
    }, 15000);
});

function sendMessage(message) {
    axios.post(`${BASE_URL}/game/${gameContext.gameId}/chat`, { message, channel: 'general' }, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    }).catch(err => log('[API] Error sending chat: ' + err.message));
}

function castVote(targetId, rationale) {
    axios.post(`${BASE_URL}/game/${gameContext.gameId}/vote`, { targetId, rationale }, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    }).catch(err => log('[API] Error voting: ' + err.message));
}

function castMurder(targetId) {
    axios.post(`${BASE_URL}/game/${gameContext.gameId}/murder`, { targetId }, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    }).catch(err => log('[API] Error murdering: ' + err.message));
}
