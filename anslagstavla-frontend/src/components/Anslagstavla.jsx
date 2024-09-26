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
    const [sortOrder, setSortOrder] = useState('newest'); // Håller reda på sorteringsordning
    const [filterUser, setFilterUser] = useState(''); // Håller reda på vald användare för filtrering

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}`);
            let sortedMessages = response.data;
            
            // Sortera efter valt sorteringsordning
            if (sortOrder === 'newest') {
                sortedMessages = sortedMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else {
                sortedMessages = sortedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            }

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

    const handleSortToggle = () => {
        setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
    };

    const handleFilterChange = (e) => {
        setFilterUser(e.target.value);
    };

    useEffect(() => {
        fetchMessages();
    }, [sortOrder]);

    // Filtrera meddelanden efter användarnamn om ett användarnamn är valt
    const filteredMessages = filterUser 
        ? messages.filter(message => message.username.toLowerCase().includes(filterUser.toLowerCase())) 
        : messages;

    return (
        <div className="tavlan">
            <h1>Shui - Anslagstavlan</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>} {/* Felmeddelande för att hämta meddelanden */}
            <img src="noticeboard.jpeg" width="410" alt="Anslagstavla" />
            {/* Sorterings- och filtreringsfunktioner */}
            <div>
                <button onClick={handleSortToggle}>
                    Sortera efter: {sortOrder === 'newest' ? 'Nyast först' : 'Äldst först'}
                </button>

                <input 
                    type="text"
                    placeholder="Filtrera efter användarnamn"
                    value={filterUser}
                    onChange={handleFilterChange}
                />
            </div>

            {loading ? (
                <p>Laddar meddelanden...</p>
            ) : (
                <ul>
                    {filteredMessages.map(({ id, username, text, createdAt }) => (
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
                                        <button onClick={() => handleUpdate(id, currentMessageText)}>Spara</button>
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
