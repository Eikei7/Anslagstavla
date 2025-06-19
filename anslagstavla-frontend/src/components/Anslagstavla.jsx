import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';


const API_URL = 'https://pam9y14ofd.execute-api.eu-north-1.amazonaws.com/dev/messages';

const formatDate = (dateString) => {
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return "Ogiltigt datum";
        }
        
        return date.toLocaleString('sv-SE', {
            timeZone: 'Europe/Stockholm',
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        console.error("Fel vid formatering av datum:", error);
        return "Datum kunde inte visas";
    }
};

const Anslagstavla = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [currentMessageText, setCurrentMessageText] = useState('');
    const [inputMessageId, setInputMessageId] = useState('');
    const [updateError, setUpdateError] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [filterUser, setFilterUser] = useState('');
    const [originalMessages, setOriginalMessages] = useState([]);
    
    // Använd useRef för att bryta cirkulära beroenden
    const closeUpdateFormRef = useRef(() => {});

    // Stäng formulär för uppdatering - definiera först funktionen utan beroenden
    const closeUpdateForm = useCallback(() => {
        setEditingMessageId(null);
        setInputMessageId('');
        setCurrentMessageText('');
        setUpdateError('');
    }, []);

    // Spara referens till closeUpdateForm
    useEffect(() => {
        closeUpdateFormRef.current = closeUpdateForm;
    }, [closeUpdateForm]);

    // Sortera och filtrera meddelanden - nu med useCallback
    const sortAndFilterMessages = useCallback((messagesToProcess = originalMessages) => {
        let sorted = [...messagesToProcess];
        
        // Sortera efter datum
        if (sortOrder === 'newest') {
            sorted = sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
            sorted = sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
        
        // Filtrera efter användarnamn
        if (filterUser) {
            sorted = sorted.filter(message => 
                message.username.toLowerCase().includes(filterUser.toLowerCase())
            );
        }
        
        setMessages(sorted);
    }, [sortOrder, filterUser, originalMessages]);

    // Hämta meddelanden - nu med useCallback
    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(API_URL);
            setOriginalMessages(response.data);
            sortAndFilterMessages(response.data);
            setLoading(false);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Kunde inte hämta meddelanden';
            setError(`Fel: ${errorMessage}`);
            setLoading(false);
        }
    }, [sortAndFilterMessages]); // sortAndFilterMessages är ett beroende här

    // Uppdatera ett meddelande - använd closeUpdateFormRef istället för closeUpdateForm
    const handleUpdate = useCallback(async (id, newText) => {
        if (!newText.trim()) {
            setUpdateError('Meddelandet kan inte vara tomt');
            return;
        }
        
        if (inputMessageId !== id) {
            setUpdateError('Autentiseringsfel: Felaktigt ID');
            return;
        }

        try {
            setUpdateError('');
            await axios.put(`${API_URL}/${id}`, { text: newText });
            await fetchMessages();
            // Använd ref istället för direkt funktion för att bryta cirkeln
            closeUpdateFormRef.current();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Kunde inte uppdatera meddelandet';
            setUpdateError(`Fel: ${errorMessage}`);
        }
    }, [inputMessageId, fetchMessages]);

    // Öppna formulär för att uppdatera meddelande
    const openUpdateForm = useCallback((id, currentText) => {
        setEditingMessageId(id);
        setCurrentMessageText(currentText);
        setInputMessageId('');
        setUpdateError('');
    }, []);

    // Växla sorteringsordning
    const handleSortToggle = useCallback(() => {
        setSortOrder(prevOrder => prevOrder === 'newest' ? 'oldest' : 'newest');
    }, []);

    // Hantera ändringar i filterfält
    const handleFilterChange = useCallback((e) => {
        setFilterUser(e.target.value);
    }, []);

    // Hämta meddelanden vid komponentladdning
    useEffect(() => {
        fetchMessages();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    // Vi använder eslint-disable på denna rad eftersom fetchMessages bara behöver köras vid montering

    // Uppdatera sortering och filtrering när någon av dessa parametrar ändras
    useEffect(() => {
        sortAndFilterMessages();
    }, [sortOrder, filterUser, sortAndFilterMessages]);

    // Hantera tangentbordshändelser för modal
    const handleKeyDown = useCallback((e, id, text) => {
        if (e.key === 'Escape') {
            closeUpdateFormRef.current();
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUpdate(id, text);
        }
    }, [handleUpdate]);

    return (
        <div className="tavlan">
            <h1>Anslagstavlan</h1>
            
            {error && <div className="error-message" role="alert">{error}</div>}
            <div className="header-image">
                <img src="/img/noticeboard.jpeg" width="410" alt="Anslagstavla" />
            </div>
            
            <div className="controls">
                <button 
                    onClick={handleSortToggle}
                    className="sort-button"
                    aria-label={`Sortera efter: ${sortOrder === 'newest' ? 'Nyast först' : 'Äldst först'}`}
                >
                    Sortera efter: {sortOrder === 'newest' ? 'Nyast först' : 'Äldst först'}
                </button>

                <input 
                    type="text"
                    className="filter-input"
                    placeholder="Filtrera efter användarnamn"
                    value={filterUser}
                    onChange={handleFilterChange}
                    aria-label="Filtrera efter användarnamn"
                />
                
                <button 
                    onClick={fetchMessages}
                    className="refresh-button"
                    disabled={loading}
                    aria-label="Uppdatera meddelanden"
                >
                    {loading ? 'Uppdaterar...' : 'Uppdatera'}
                </button>
            </div>

            {loading ? (
                <p className="loading-message">Laddar meddelanden...</p>
            ) : messages.length > 0 ? (
                <ul className="message-list">
                    {messages.map(({ id, username, text, createdAt }) => (
                        <li key={id} className="message-item">
                            <div className="date" title={new Date(createdAt).toISOString()}>
                                {formatDate(createdAt)}
                            </div>
                            <div className="message">{text}</div>
                            <div className="username">{username}</div>

                            <button 
                                onClick={() => openUpdateForm(id, text)}
                                className="edit-button"
                                aria-label={`Ändra meddelande från ${username}`}
                            >
                                Ändra meddelandet
                            </button>

                            {editingMessageId === id && (
                                <div 
                                    className="modal-overlay" 
                                    onClick={(e) => {
                                        if (e.target.className === 'modal-overlay') {
                                            closeUpdateForm();
                                        }
                                    }}
                                >
                                    <div 
                                        className="modal-content"
                                        onKeyDown={(e) => handleKeyDown(e, id, currentMessageText)}
                                    >
                                        <h2>Ändra meddelandet</h2>
                                        
                                        {updateError && (
                                            <div className="error-message" role="alert">
                                                {updateError}
                                            </div>
                                        )}
                                        
                                        <textarea 
                                            placeholder="Ange nytt meddelande"
                                            value={currentMessageText}
                                            onChange={(e) => setCurrentMessageText(e.target.value)}
                                            className="edit-textarea"
                                            autoFocus
                                        />
                                        
                                        <input 
                                            type="text" 
                                            placeholder="Ange meddelandets ID för bekräftelse"
                                            value={inputMessageId}
                                            onChange={(e) => setInputMessageId(e.target.value)}
                                            className="id-input"
                                        />
                                        
                                        <div className="modal-buttons">
                                            <button 
                                                onClick={() => handleUpdate(id, currentMessageText)}
                                                className="save-button"
                                                disabled={!currentMessageText.trim()}
                                            >
                                                Spara
                                            </button>
                                            
                                            <button 
                                                onClick={closeUpdateForm}
                                                className="cancel-button"
                                            >
                                                Avbryt
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="empty-message">Inga meddelanden hittades</p>
            )}
        </div>
    );
};

export default Anslagstavla;