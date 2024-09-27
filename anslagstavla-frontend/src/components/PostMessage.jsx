import React, { useState } from 'react';
import axios from 'axios';
import '../App.css';

const API_URL = 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages';

const PostMessage = ({ onPostSuccess }) => {
    const [username, setUsername] = useState('');
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [charCount, setCharCount] = useState(0);

    const postMessage = async () => {
        if (username.trim() === '' || text.trim() === '') return;
        try {
            const response = await axios.post(`${API_URL}`, { username, text });
            const { id } = response.data;

            setUsername('');
            setText('');
            setCharCount(0);

            setConfirmation(`Meddelandet har publicerats! Ange detta ID om du behöver ändra ditt inlägg: ${id}`);

            if (onPostSuccess) onPostSuccess();

        } catch (err) {
            setError('Kunde inte posta meddelandet');
        }
    };

    const handleTextChange = (e) => {
        const value = e.target.value;
        if (value.length <= 75) {
            setText(value);
            setCharCount(value.length);
        }
    };

    return (
        <div className="tavlan">
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {confirmation && <p className="confirmation-message">{confirmation}</p>}

            <input 
                type="text" 
                placeholder="Användarnamn" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
            />
            <textarea 
                className='message-input'
                placeholder="Skriv ditt meddelande här..." 
                value={text}
                onChange={handleTextChange}
                maxLength={75}
            />
            <p style={{ color: 'white' }}>{charCount}/75 tecken</p>

            <button onClick={postMessage} disabled={!username.trim() || !text.trim()}>
                Publicera
            </button>
        </div>
    );
};

export default PostMessage;
