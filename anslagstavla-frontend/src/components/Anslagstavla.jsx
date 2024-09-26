import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages';

const formatDate = (dateString) => {
    const date = new Date(dateString);

    return date.toLocaleString('sv-SE', {
        timeZone: 'Europe/Stockholm', // Svensk tidzon (CET/CEST)
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};


const Anslagstavla = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [currentMessageText, setCurrentMessageText] = useState('');
    const [inputMessageId, setInputMessageId] = useState(''); // För inmatning av ID
    const [updateError, setUpdateError] = useState(''); // För uppdateringsfel

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}`);
            const sortedMessages = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setMessages(sortedMessages);
            setLoading(false);
        } catch (err) {
            setError('Kunde inte hämta meddelanden');
            setLoading(false);
        }
    };

    const handleUpdate = async (id, newText) => {
        if (inputMessageId !== id) {
            setUpdateError('Autentiseringsfel: Felaktigt ID');
            return;
        }

        try {
            await axios.put(`${API_URL}/${id}`, { text: newText });
            fetchMessages();
            setEditingMessageId(null); // Stäng formuläret efter uppdatering
            setUpdateError(''); // Återställ eventuella felmeddelanden
        } catch (err) {
            setUpdateError('Kunde inte uppdatera meddelandet'); // Visar fel i modalen
        }
    };

    const openUpdateForm = (id, currentText) => {
        setEditingMessageId(id);
        setCurrentMessageText(currentText);
    };

    const closeUpdateForm = () => {
        setEditingMessageId(null);
        setInputMessageId(''); // Återställ inputfältet
        setUpdateError(''); // Återställ eventuella fel
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    return (
        <div className="tavlan">
            <h1>Anslagstavlan</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>} {/* Felmeddelande för att hämta meddelanden */}

            {loading ? (
                <p>Laddar meddelanden...</p>
            ) : (
                <ul>
                    {messages.map(({ id, username, text, createdAt }) => (
                        <li key={id}>
                            <div className="date">{formatDate(createdAt)}</div>
                            <div className="message">{text}</div>
                            <div className="username">{username}</div>

                            {/* Visa uppdateringsformulär i en modal om det aktuella meddelandet redigeras */}
                            {editingMessageId === id && (
                                <div className="modal-overlay">
                                    <div className="modal-content">
                                        <h2>Ändra meddelandet</h2>
                                        {updateError && <p style={{ color: 'red' }}>{updateError}</p>} {/* Visar fel i modalen */}
                                        <input 
                                            type="text" 
                                            placeholder="Ange nytt meddelande"
                                            value={currentMessageText}
                                            onChange={(e) => setCurrentMessageText(e.target.value)}
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Ange meddelandets ID"
                                            value={inputMessageId}
                                            onChange={(e) => setInputMessageId(e.target.value)} // Spara inmatat ID
                                        />
                                        <button onClick={() => handleUpdate(id, currentMessageText)}>Spara ändringar</button>
                                        <button onClick={closeUpdateForm}>Avbryt</button>
                                    </div>
                                </div>
                            )}

                            <button onClick={() => openUpdateForm(id, text)}>Ändra meddelandet</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Anslagstavla;
