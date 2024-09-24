import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UpdateMessageForm from './UpdateMessageForm'; // Importera den nya komponenten

const API_URL = 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages';

const Anslagstavla = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null); // Håll reda på vilket meddelande som redigeras
    const [currentMessageText, setCurrentMessageText] = useState(''); // Håller det aktuella meddelandetexten

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}`);
            setMessages(response.data);
            setLoading(false);
        } catch (err) {
            setError('Kunde inte hämta meddelanden');
            setLoading(false);
        }
    };

    const postMessage = async (username, text) => {
        if (username.trim() === '' || text.trim() === '') return;
        try {
            await axios.post(`${API_URL}`, { username, text });
            fetchMessages();
        } catch (err) {
            setError('Kunde inte posta meddelandet');
        }
    };

    const handleUpdate = async (id, newText) => {
        try {
            await axios.put(`${API_URL}/${id}`, { text: newText });
            fetchMessages();
            setEditingMessageId(null); // Stäng formuläret efter uppdatering
        } catch (err) {
            setError('Kunde inte uppdatera meddelandet');
        }
    };

    const openUpdateForm = (id, currentText) => {
        setEditingMessageId(id);
        setCurrentMessageText(currentText);
    };

    const closeUpdateForm = () => {
        setEditingMessageId(null); // Stäng formuläret utan att uppdatera
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    return (
        <div className="tavlan">
            <h1>Anslagstavla</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {loading ? (
                <p>Laddar meddelanden...</p>
            ) : (
                <ul>
                    {messages.map(({ id, username, text, createdAt }) => (
                        <li key={id}>
                            <strong>{username} ({createdAt}):</strong> {text}
                            <button onClick={() => openUpdateForm(id, text)}>Ändra</button>
                        </li>
                    ))}
                </ul>
            )}

            {editingMessageId && (
                <UpdateMessageForm
                    id={editingMessageId}
                    currentText={currentMessageText}
                    onUpdate={handleUpdate}
                    onCancel={closeUpdateForm}
                />
            )}
        </div>
    );
};

export default Anslagstavla;
