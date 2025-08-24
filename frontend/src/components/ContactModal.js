import React, { useState, useEffect } from 'react';
import './ContactModal.css';
import { getContactByNumber, upsertContact } from '../config/contacts';

const ContactModal = ({ isOpen, onClose, phoneNumber, onSave }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [originalName, setOriginalName] = useState('');

  useEffect(() => {
    const loadContact = async () => {
      if (!phoneNumber) return;
      
      setLoading(true);
      try {
        const contact = await getContactByNumber(phoneNumber);
        if (contact) {
          setName(contact.name);
          setOriginalName(contact.name);
        } else {
          setName('');
          setOriginalName('');
        }
      } catch (error) {
        console.error('Error cargando contacto:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && phoneNumber) {
      loadContact();
    }
  }, [isOpen, phoneNumber]);

  const handleSave = async () => {
    if (!name.trim() || name === originalName) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      const result = await upsertContact(phoneNumber, name);
      if (result.success) {
        onSave && onSave(phoneNumber, name);
        onClose();
      } else {
        alert('Error al guardar el contacto: ' + (result.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error guardando contacto:', error);
      alert('Error al guardar el contacto');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar contacto</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="phone-display">
            <span className="phone-label">Número:</span>
            <span className="phone-number">{phoneNumber}</span>
          </div>
          
          <div className="input-group">
            <label htmlFor="contact-name">Nombre:</label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ingrese el nombre del contacto"
              autoFocus
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="button button-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            className="button button-primary" 
            onClick={handleSave}
            disabled={loading || !name.trim()}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;