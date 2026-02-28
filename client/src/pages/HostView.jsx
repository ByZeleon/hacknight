import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Play, ChevronRight, Trophy } from 'lucide-react';

const HostView = ({ socket }) => {
    const [roomId, setRoomId] = useState('');
    const [players, setPlayers] = useState([]);
    const [gameStatus, setGameStatus] = useState('LOBBY'); // LOBBY, QUESTION, VOTING, RESULTS
    const [question, setQuestion] = useState('');
    const [submissions, setSubmissions] = useState(0);
    const [votes, setVotes] = useState(0);
    const [results, setResults] = useState([]);

    useEffect(() => {
        // Generate room
        socket.emit('createRoom');

        socket.on('roomCreated', (id) => setRoomId(id));

        socket.on('playerJoined', (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        socket.on('gameStarted', ({ question, status }) => {
            setQuestion(question);
            setGameStatus(status);
            setSubmissions(0);
        });

        socket.on('responseReceived', ({ totalResponses }) => {
            setSubmissions(totalResponses);
        });

        socket.on('startVoting', ({ status }) => {
            setGameStatus(status);
            setVotes(0);
        });

        socket.on('voteReceived', ({ totalVotes }) => {
            setVotes(totalVotes);
        });

        socket.on('showResults', ({ results, status }) => {
            setResults(results);
            setGameStatus(status);
        });

        socket.on('newRound', ({ question, status }) => {
            setQuestion(question);
            setGameStatus(status);
            setSubmissions(0);
            setVotes(0);
            setResults([]);
        });

        return () => {
            socket.off('roomCreated');
            socket.off('playerJoined');
            socket.off('gameStarted');
            socket.off('responseReceived');
            socket.off('startVoting');
            socket.off('voteReceived');
            socket.off('showResults');
            socket.off('newRound');
        };
    }, [socket]);

    const startGame = () => {
        socket.emit('startGame', roomId);
    };

    const nextRound = () => {
        socket.emit('nextRound', roomId);
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center p-8 text-center">
            <AnimatePresence mode="wait">
                {gameStatus === 'LOBBY' && (
                    <motion.div
                        key="lobby"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex flex-col items-center gap-8"
                    >
                        <h1 className="text-6xl font-black text-neonCyan mb-4 tracking-tighter uppercase italic">
                            Party Night <span className="text-neonFuchsia">Quip</span>
                        </h1>

                        <div className="card-neon flex flex-col items-center gap-4">
                            <p className="text-xl text-gray-400 uppercase tracking-widest">Código de la Sala</p>
                            <div className="text-8xl font-black text-white px-8 py-4 bg-gray-900 border-4 border-neonCyan rounded-3xl shadow-neon-cyan">
                                {roomId || '....'}
                            </div>
                            <p className="text-gray-400 mt-2">Entra en <span className="text-neonCyan font-bold">party.local</span> para jugar</p>
                        </div>

                        <div className="w-full max-w-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="text-neonFuchsia" />
                                <h2 className="text-2xl font-bold">Jugadores ({players.length})</h2>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4">
                                {players.map((p, i) => (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        key={p.id}
                                        className="px-6 py-3 bg-gray-800 border-2 border-neonFuchsia rounded-full font-bold text-lg"
                                    >
                                        {p.name}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {players.length >= 2 && (
                            <button onClick={startGame} className="btn-neon-cyan flex items-center gap-2 group">
                                <Play className="fill-current" />
                                Empezar Juego
                            </button>
                        )}
                    </motion.div>
                )}

                {gameStatus === 'QUESTION' && (
                    <motion.div
                        key="question"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-12"
                    >
                        <h2 className="text-5xl font-black max-w-4xl leading-tight">
                            {question}
                        </h2>

                        <div className="flex flex-col items-center gap-4">
                            <div className="text-2xl font-bold flex items-center gap-4">
                                Respuestas recibidas:
                                <span className="text-4xl text-neonCyan font-black">{submissions} / {players.length}</span>
                            </div>
                            <div className="w-96 bg-gray-800 h-4 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-neonCyan shadow-neon-cyan transition-all duration-500"
                                    style={{ width: `${(submissions / players.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {gameStatus === 'VOTING' && (
                    <motion.div
                        key="voting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-12"
                    >
                        <h2 className="text-4xl font-bold text-neonFuchsia uppercase italic">¡Fase de Votación!</h2>
                        <h3 className="text-3xl font-black max-w-4xl">{question}</h3>

                        <div className="flex flex-col items-center gap-4">
                            <p className="text-2xl">Votos: <span className="text-neonFuchsia font-black">{votes} / {players.length}</span></p>
                            <div className="w-96 bg-gray-800 h-4 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-neonFuchsia shadow-neon-fuchsia transition-all duration-500"
                                    style={{ width: `${(votes / players.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {gameStatus === 'RESULTS' && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-8 w-full max-w-4xl"
                    >
                        <h2 className="text-5xl font-black text-neonYellow mb-4 flex items-center gap-4 uppercase italic">
                            <Trophy className="w-12 h-12" /> Resultados <Trophy className="w-12 h-12" />
                        </h2>

                        <div className="w-full space-y-4">
                            {results.map((res, i) => (
                                <motion.div
                                    initial={{ x: -100, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.2 }}
                                    key={res.playerId}
                                    className={`flex justify-between items-center p-6 rounded-2xl border-2 ${i === 0 ? 'border-neonYellow bg-neonYellow/10' : 'border-gray-700 bg-gray-800/50'}`}
                                >
                                    <div className="text-left">
                                        <p className="text-2xl font-black">"{res.text}"</p>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest mt-1">Escrito por: <span className="text-white">{res.playerName}</span></p>
                                    </div>
                                    <div className="text-4xl font-black text-neonCyan">{res.votes} <span className="text-sm uppercase block text-gray-500">votos</span></div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-8 p-6 bg-neonFuchsia/20 border-2 border-neonFuchsia rounded-2xl animate-pulse-cyan">
                            <p className="text-2xl font-bold text-white">
                                EL GANADOR DEBE DESARROLLAR SU HISTORIA EN VOZ ALTA DURANTE 30 SEGUNDOS O BEBER 3 TRAGOS
                            </p>
                        </div>

                        <button onClick={nextRound} className="btn-neon-cyan mt-8 flex items-center gap-2">
                            Siguiente Ronda <ChevronRight />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HostView;
