import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Hash, CheckCircle } from 'lucide-react';

const PlayerView = ({ socket }) => {
    const [playerName, setPlayerName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [gameStatus, setGameStatus] = useState('JOIN'); // JOIN, LOBBY, QUESTION, VOTING, WAITING
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [possibleAnswers, setPossibleAnswers] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        socket.on('joinedRoom', () => {
            setIsJoined(true);
            setGameStatus('LOBBY');
        });

        socket.on('gameStarted', ({ question, status }) => {
            setQuestion(question);
            setGameStatus(status);
            setAnswer('');
        });

        socket.on('startVoting', ({ responses, status }) => {
            // Filter out own answer
            const choices = responses.filter(r => r.id !== socket.id);
            setPossibleAnswers(choices);
            setGameStatus(status);
        });

        socket.on('showResults', ({ status }) => {
            setGameStatus('RESULTS');
        });

        socket.on('newRound', ({ question, status }) => {
            setQuestion(question);
            setGameStatus(status);
            setAnswer('');
        });

        socket.on('error', (msg) => setError(msg));

        return () => {
            socket.off('joinedRoom');
            socket.off('gameStarted');
            socket.off('startVoting');
            socket.off('showResults');
            socket.off('newRound');
            socket.off('error');
        };
    }, [socket]);

    const joinRoom = (e) => {
        e.preventDefault();
        if (playerName && roomId) {
            socket.emit('joinRoom', { roomId: roomId.toUpperCase(), playerName });
        }
    };

    const submitResponse = (e) => {
        e.preventDefault();
        if (answer) {
            socket.emit('submitResponse', { roomId: roomId.toUpperCase(), text: answer });
            setGameStatus('WAITING');
        }
    };

    const submitVote = (votedPlayerId) => {
        socket.emit('submitVote', { roomId: roomId.toUpperCase(), votedPlayerId });
        setGameStatus('WAITING');
    };

    return (
        <div className="min-h-screen p-6 flex flex-col items-center">
            <AnimatePresence mode="wait">
                {gameStatus === 'JOIN' && (
                    <motion.div
                        key="join"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="w-full max-w-sm mt-12 bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-2xl"
                    >
                        <h1 className="text-3xl font-black mb-8 text-center uppercase tracking-tighter">
                            Únete a la <span className="text-neonCyan">FIESTA</span>
                        </h1>
                        <form onSubmit={joinRoom} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} className="text-neonFuchsia" /> Nombre
                                </label>
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    className="input-neon w-full"
                                    placeholder="Ej: Juan"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Hash size={14} className="text-neonCyan" /> Código Room
                                </label>
                                <input
                                    type="text"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    className="input-neon w-full uppercase"
                                    placeholder="EX: A4X2"
                                    maxLength={4}
                                    required
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
                            <button type="submit" className="btn-neon-cyan w-full mt-4">
                                Entrar
                            </button>
                        </form>
                    </motion.div>
                )}

                {gameStatus === 'LOBBY' && (
                    <motion.div
                        key="lobby-player"
                        className="text-center mt-20 space-y-4"
                    >
                        <div className="w-24 h-24 bg-neonCyan/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse shadow-neon-cyan">
                            <CheckCircle size={48} className="text-neonCyan" />
                        </div>
                        <h2 className="text-2xl font-bold">¡Estás dentro, {playerName}!</h2>
                        <p className="text-gray-400">Mira la pantalla principal. El juego empezará pronto...</p>
                    </motion.div>
                )}

                {gameStatus === 'QUESTION' && (
                    <motion.div
                        key="question-player"
                        className="w-full max-w-sm flex flex-col items-center gap-8 mt-12 text-center"
                    >
                        <div className="p-4 bg-gray-800 rounded-2xl border border-gray-700 w-full mb-4">
                            <p className="text-sm font-bold text-neonFuchsia uppercase mb-2">LA PREGUNTA:</p>
                            <h2 className="text-xl font-bold italic">"{question}"</h2>
                        </div>

                        <form onSubmit={submitResponse} className="w-full space-y-4">
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                className="input-neon w-full h-32 resize-none"
                                placeholder="Escribe tu respuesta graciosa..."
                                maxLength={60}
                                required
                            />
                            <p className="text-right text-xs text-gray-500">{answer.length}/60</p>
                            <button type="submit" className="btn-neon-fuchsia w-full flex items-center justify-center gap-2">
                                Enviar <Send size={18} />
                            </button>
                        </form>
                    </motion.div>
                )}

                {gameStatus === 'VOTING' && (
                    <motion.div
                        key="voting-player"
                        className="w-full max-w-sm flex flex-col items-center gap-6 mt-12"
                    >
                        <h2 className="text-2xl font-black text-neonCyan italic mb-4 uppercase">¿Cuál es mejor?</h2>
                        <div className="w-full space-y-4">
                            {possibleAnswers.map((choice) => (
                                <button
                                    key={choice.id}
                                    onClick={() => submitVote(choice.id)}
                                    className="w-full text-left p-6 bg-gray-800 border-2 border-gray-700 rounded-2xl hover:border-neonCyan transition-all active:scale-95 font-bold"
                                >
                                    "{choice.text}"
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {gameStatus === 'WAITING' && (
                    <motion.div
                        key="waiting"
                        className="text-center mt-32 space-y-4"
                    >
                        <div className="flex justify-center gap-2">
                            <div className="w-4 h-4 bg-neonCyan rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-4 h-4 bg-neonCyan rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-4 h-4 bg-neonCyan rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <h2 className="text-xl font-bold">Esperando a los demás...</h2>
                    </motion.div>
                )}

                {gameStatus === 'RESULTS' && (
                    <div className="text-center mt-32 space-y-4">
                        <h2 className="text-3xl font-black text-neonYellow">¡Resultados en pantalla!</h2>
                        <p className="text-gray-400">Prepárate para la siguiente ronda</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlayerView;
