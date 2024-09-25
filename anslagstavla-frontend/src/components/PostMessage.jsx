import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';
import { Link } from 'react-router-dom';

const API_URL = 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages';

const PostMessage = ({ onPostSuccess }) => {
    const [username, setUsername] = useState('');
    const [text, setText] = useState('');
    const [error, setError] = useState('');

    const postMessage = async () => {
        if (username.trim() === '' || text.trim() === '') return;
        try {
            await axios.post(`${API_URL}`, { username, text });
            setUsername('');
            setText('');
            if (onPostSuccess) onPostSuccess();  // Kalla en callback efter lyckad post
        } catch (err) {
            setError('Kunde inte posta meddelandet');
        }
    };

    return (
        <div className="tavlan">
            <h1>Skriv ett meddelande</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <input 
                type="text" 
                placeholder="Användarnamn" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
            />
            <input 
                type="text" 
                className='message-input'
                placeholder="Meddelande" 
                value={text} 
                onChange={(e) => setText(e.target.value)} 
            />
            <button onClick={postMessage} disabled={!username.trim() || !text.trim()}>
                Skicka meddelande
            </button>
        </div>
    );
};

export default PostMessage;
