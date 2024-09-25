import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages';

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const offset = 120;
    const localDate = new Date(date.getTime() + offset * 60 * 1000);

    return localDate.toLocaleString('sv-SE', {
        timeZone: 'Europe/Stockholm',
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
    const [username, setUsername] = useState(''); // Lägg till state för användarnamn
    const [text, setText] = useState(''); // Lägg till state för text

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
        setEditingMessageId(null);
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    return (
            <div className="tavlan">
            <h1>Anslagstavlan</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {loading ? (
                <p>Laddar meddelanden...</p>
            ) : (
                <ul>
                    {messages.map(({ id, username, text, createdAt }) => (
                        <li key={id}>
                            <div className="date">{formatDate(createdAt)}</div>
                            <div className="message">{text}</div>
                            <div className="username">{username}</div>
                            <button onClick={() => openUpdateForm(id, text)}>Ändra meddelandet</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Anslagstavla;
