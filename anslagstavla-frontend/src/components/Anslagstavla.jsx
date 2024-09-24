import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages';

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
            setMessages(response.data);
            setLoading(false);
        } catch (err) {
            setError('Kunde inte hämta meddelanden');
            setLoading(false);
        }
    };

    const postMessage = async () => {
        if (username.trim() === '' || text.trim() === '') return;
        try {
            await axios.post(`${API_URL}`, { username, text });
            fetchMessages();
            setUsername(''); // Rensa input efter lyckad post
            setText('');
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
        setEditingMessageId(null);
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    return (
        <div className="tavlan">
            <h1>Anslagstavla</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input 
                type="text" 
                placeholder="Användarnamn" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
            />
            <input 
                type="text" 
                placeholder="Meddelande" 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
            />
            <button 
                onClick={postMessage} 
                disabled={!username.trim() || !text.trim()}
            >
                Posta Meddelande
            </button>

            {loading ? (
                <p>Laddar meddelanden...</p>
            ) : (
                <ul>
                    {messages.map(({ id, username, text, createdAt }) => (
                        <li key={id}>
                            <div className="date">{createdAt}</div>
                            <div className="message">{text}</div>
                            <div className="username">{username}</div>
                            <button onClick={() => openUpdateForm(id, text)}>Ändra</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Anslagstavla;
