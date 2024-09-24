import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages'; // Ersätt med din API URL från serverless deploy

const Anslagstavla = () => {
    const [messages, setMessages] = useState([]);
    const [username, setUsername] = useState('');
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
        if (username.trim() === '' || text.trim() === '') return; // Prevent empty messages
        try {
            await axios.post(`${API_URL}`, { username, text });
            fetchMessages();  // Refresh messages
            setText('');
        } catch (err) {
            setError('Kunde inte posta meddelandet');
        }
    };

    const updateMessage = async (id) => {
        const newText = prompt('Ange ny text').trim();
        if (newText) {
            try {
                await axios.put(`${API_URL}/${id}`, { text: newText });
                fetchMessages();
            } catch (err) {
                setError('Kunde inte uppdatera meddelandet');
            }
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    return (
        <div className='tavlan'>
            <h1>Anslagstavla</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input 
                type="text" 
                placeholder="Användarnamn" 
                className='username'
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
            />
            <input 
                type="text" 
                placeholder="Meddelande"
                className='message' 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
            />
            <button 
                onClick={postMessage} 
                disabled={!username.trim() || !text.trim()} // Disable button if inputs are empty
            >
                Posta meddelande
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
            <button onClick={() => updateMessage(id)}>Ändra meddelande</button>
        </li>
    ))}
</ul>
            )}
        </div>
    );
};

export default Anslagstavla;
