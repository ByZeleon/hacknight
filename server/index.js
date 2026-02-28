const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Game state in memory
const rooms = {};

// Sample questions
const questions = [
    "¿Cuál sería un lugar terrible para una primera cita?",
    "Algo que no quieres escuchar mientras estás en el dentista.",
    "Un nombre horrible para un gato.",
    "¿Qué es lo peor que podrías decir en un funeral?",
    "El título de una película de terror sobre profesores.",
    "¿Cuál es el peor superpoder del mundo?",
    "Algo que no deberías decir en una entrevista de trabajo.",
    "Un ingrediente secreto que arruinaría cualquier pizza.",
    "¿Qué hace Santa Claus durante el verano?",
    "Lo primero que dirías si te encontraras con un alien."
];

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // --- HOST EVENTS ---

    socket.on('createRoom', () => {
        const roomId = generateRoomCode();
        rooms[roomId] = {
            hostId: socket.id,
            players: [],
            status: 'LOBBY',
            currentQuestion: '',
            responses: [], // { playerId, playerName, text, votes: 0 }
            votesReceived: 0
        };
        socket.join(roomId);
        socket.emit('roomCreated', roomId);
        console.log(`Room created: ${roomId}`);
    });

    socket.on('startGame', (roomId) => {
        const room = rooms[roomId];
        if (room && socket.id === room.hostId) {
            room.status = 'QUESTION';
            room.currentQuestion = questions[Math.floor(Math.random() * questions.length)];
            room.responses = [];
            room.votesReceived = 0;

            // Emit to everyone in the room
            io.to(roomId).emit('gameStarted', {
                question: room.currentQuestion,
                status: room.status
            });
        }
    });

    socket.on('nextRound', (roomId) => {
        const room = rooms[roomId];
        if (room && socket.id === room.hostId) {
            room.status = 'QUESTION';
            room.currentQuestion = questions[Math.floor(Math.random() * questions.length)];
            room.responses = [];
            room.votesReceived = 0;

            io.to(roomId).emit('newRound', {
                question: room.currentQuestion,
                status: room.status
            });
        }
    });

    // --- PLAYER EVENTS ---

    socket.on('joinRoom', ({ roomId, playerName }) => {
        const room = rooms[roomId];
        if (room) {
            if (room.status !== 'LOBBY') {
                socket.emit('error', 'El juego ya ha comenzado');
                return;
            }

            const player = { id: socket.id, name: playerName };
            room.players.push(player);
            socket.join(roomId);

            socket.emit('joinedRoom', { roomId, playerName });
            // Notify the host
            io.to(room.hostId).emit('playerJoined', room.players);
        } else {
            socket.emit('error', 'Sala no encontrada');
        }
    });

    socket.on('submitResponse', ({ roomId, text }) => {
        const room = rooms[roomId];
        if (room && room.status === 'QUESTION') {
            const player = room.players.find(p => p.id === socket.id);
            if (player) {
                // Prevent double submission
                if (room.responses.find(r => r.playerId === socket.id)) return;

                room.responses.push({
                    playerId: socket.id,
                    playerName: player.name,
                    text: text.substring(0, 60),
                    votes: 0
                });

                // Notify host about the submission progress
                io.to(room.hostId).emit('responseReceived', {
                    playerName: player.name,
                    totalResponses: room.responses.length,
                    totalPlayers: room.players.length
                });

                // If everyone responded, move to voting
                if (room.responses.length === room.players.length) {
                    room.status = 'VOTING';
                    // Shuffle responses for anonymity
                    const shuffled = [...room.responses].sort(() => Math.random() - 0.5);
                    io.to(roomId).emit('startVoting', {
                        responses: shuffled.map(r => ({ id: r.playerId, text: r.text })),
                        status: room.status
                    });
                }
            }
        }
    });

    socket.on('submitVote', ({ roomId, votedPlayerId }) => {
        const room = rooms[roomId];
        if (room && room.status === 'VOTING') {
            // Players can't vote for themselves
            if (socket.id === votedPlayerId) return;

            const response = room.responses.find(r => r.playerId === votedPlayerId);
            if (response) {
                response.votes += 1;
                room.votesReceived += 1;

                // Notify host
                io.to(room.hostId).emit('voteReceived', {
                    totalVotes: room.votesReceived,
                    totalPlayers: room.players.length
                });

                // If everyone voted, move to results
                if (room.votesReceived === room.players.length) {
                    room.status = 'RESULTS';
                    // Sort responses by votes
                    const results = [...room.responses].sort((a, b) => b.votes - a.votes);
                    io.to(roomId).emit('showResults', {
                        results,
                        status: room.status
                    });
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        // Basic cleanup could go here, but for a party game it's often better 
        // to let players rejoin or keep the room alive if the host is still there.
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
