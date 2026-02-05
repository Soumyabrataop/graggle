const { io } = require('socket.io-client');
const axios = require('axios');
const fs = require('fs');

const API_KEY = process.env.API_KEY;
const BASE_URL = 'https://api.amongclawds.com/api/v1';
const WS_URL = 'wss://api.amongclawds.com';

const TASK_FILE = 'amongclawds_task.json';
const RESPONSE_FILE = 'amongclawds_response.json';
const LOG_FILE = 'game.log';

function log(msg) {
    const timestamp = new Date().toISOString();
    const text = `[${timestamp}] ` + (typeof msg === 'string' ? msg : JSON.stringify(msg));
    console.log(text);
    fs.appendFileSync(LOG_FILE, text + '\n');
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

const socket = io(WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
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
    
    // Non-blocking wait: check every second, but don't block event loop
    const checkResponse = () => {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (fs.existsSync(RESPONSE_FILE)) {
                    clearInterval(interval);
                    const response = JSON.parse(fs.readFileSync(RESPONSE_FILE, 'utf8'));
                    fs.unlinkSync(RESPONSE_FILE);
                    fs.unlinkSync(TASK_FILE);
                    decisionPending = false;
                    resolve(response);
                }
            }, 1000);
            
            // Timeout after 30 seconds to prevent getting stuck
            setTimeout(() => {
                if (decisionPending) {
                    clearInterval(interval);
                    log('[BRAIN] Decision timed out.');
                    decisionPending = false;
                    if (fs.existsSync(TASK_FILE)) fs.unlinkSync(TASK_FILE);
                    resolve(null);
                }
            }, 30000);
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
            setTimeout(() => {
                log('[WS] Emitting join_game: ' + gameContext.gameId);
                socket.emit('join_game', gameContext.gameId);
            }, 1000);
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
    log('[WS] Game matched! Role: ' + data.role);
    gameContext.gameId = data.gameId;
    gameContext.myRole = data.role;
    gameContext.agents = data.agents;
    gameContext.traitorTeammates = data.traitorTeammates || [];
    socket.emit('join_game', data.gameId);
});

socket.on('game_state', async (state) => {
    log('[WS] Game state received. Role: ' + state.yourRole + ', Phase: ' + state.currentPhase);
    gameContext.currentRound = state.currentRound;
    gameContext.currentPhase = state.currentPhase;
    gameContext.myRole = state.yourRole;
    gameContext.traitorTeammates = state.traitorTeammates || [];
    gameContext.agents = state.agents;
    gameContext.phaseEndsAt = state.phaseEndsAt;
    
    const me = state.agents.find(a => a.id === gameContext.myId);
    if (me) {
        log('[WS] My status in state: ' + me.status);
        gameContext.myStatus = me.status;
    }

    if (gameContext.myStatus === 'alive' && state.currentPhase === 'discussion' && gameContext.chatHistory.length === 0) {
        log('[WS] Joining mid-discussion. Requesting initial thought...');
        const decision = await requestDecision('discuss', { reason: 'Joined mid-discussion' });
        if (decision && decision.message) sendMessage(decision.message);
    }
});

socket.on('phase_change', async (data) => {
    log(`[WS] Phase change: ${data.phase} (Round ${data.round})`);
    gameContext.currentPhase = data.phase;
    gameContext.currentRound = data.round;
    gameContext.phaseEndsAt = data.endsAt;

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
        if (data.message.includes(`@${gameContext.myName}`) || Math.random() < 0.1) {
            const decision = await requestDecision('discuss', { reason: 'Reaction', newMessage: data });
            if (decision && decision.message) sendMessage(decision.message);
        }
    }
});

socket.on('agent_died', (data) => {
    log(`[WS] Agent died: ${data.agentName} (${data.cause})`);
    const agent = gameContext.agents.find(a => a.id === data.agentId);
    if (agent) agent.status = 'dead';
    gameContext.deaths.push({ ...data, round: gameContext.currentRound });
});

socket.on('agent_banished', (data) => {
    log(`[WS] Agent banished: ${data.agentName} (Role: ${data.role})`);
    const agent = gameContext.agents.find(a => a.id === data.agentId);
    if (agent) { agent.status = 'dead'; agent.role = data.role; }
    gameContext.revealedRoles[data.agentId] = data.role;
    gameContext.deaths.push({ ...data, cause: 'banished', round: gameContext.currentRound });
});

socket.on('you_eliminated', (data) => {
    log(`[WS] ELIMINATED: ${data.reason}`);
    gameContext.myStatus = 'dead';
    fs.writeFileSync('eliminated.txt', `I was ${data.reason} in round ${data.round}. ${data.message}`);
});

socket.on('game_ended', (data) => {
    log(`[WS] Game ended. Winner: ${data.winner}`);
    fs.writeFileSync('game_result.txt', JSON.stringify(data, null, 2));
    setTimeout(() => {
        axios.post(`${BASE_URL}/lobby/join`, {}, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        }).then(() => log('[API] Rejoined lobby queue'));
    }, 10000);
});

function sendMessage(message) {
    axios.post(`${BASE_URL}/game/${gameContext.gameId}/chat`, { message, channel: 'general' }, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    }).catch(err => log('[API] Error sending chat: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message)));
}

function castVote(targetId, rationale) {
    axios.post(`${BASE_URL}/game/${gameContext.gameId}/vote`, { targetId, rationale }, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    }).catch(err => log('[API] Error voting: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message)));
}

function castMurder(targetId) {
    axios.post(`${BASE_URL}/game/${gameContext.gameId}/murder`, { targetId }, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    }).catch(err => log('[API] Error murdering: ' + (err.response?.data ? JSON.stringify(err.response.data) : err.message)));
}
