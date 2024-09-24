import React, { useState } from 'react';

const UpdateMessageForm = ({ id, currentText, onUpdate, onCancel }) => {
    const [newText, setNewText] = useState(currentText);

    const handleUpdate = async () => {
        if (newText.trim() === '') {
            alert('Texten får inte vara tom.');
            return;
        }
        await onUpdate(id, newText.trim());
    };

    return (
        <div className="update-message-form">
            <h3>Ändra Meddelande</h3>
            <textarea 
                value={newText} 
                onChange={(e) => setNewText(e.target.value)} 
                rows="4"
                placeholder="Ange ny text"
            />
            <div className="buttons">
                <button onClick={handleUpdate}>Uppdatera</button>
                <button onClick={onCancel}>Avbryt</button>
            </div>
        </div>
    );
};

export default UpdateMessageForm;
