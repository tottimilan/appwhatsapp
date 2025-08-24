import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { normalizePhoneNumber } from '../utils/phoneUtils';
import './DebugPanel.css';

const DebugPanel = () => {
  const [messages, setMessages] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const loadAllMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('timestamp', { desc: true })
        .limit(20);
      
      setMessages(data || []);
    };

    if (showDebug) {
      loadAllMessages();
    }
  }, [showDebug]);

  if (!showDebug) {
    return (
      <button 
        className="debug-toggle"
        onClick={() => setShowDebug(true)}
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="debug-panel">
      <button 
        className="debug-close"
        onClick={() => setShowDebug(false)}
      >
        ✕
      </button>
      <h3>Debug Panel - Últimos 20 mensajes</h3>
      <table>
        <thead>
          <tr>
            <th>From (Original)</th>
            <th>From (Normalizado)</th>
            <th>To (Original)</th>
            <th>To (Normalizado)</th>
            <th>Body</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {messages.map(msg => (
            <tr key={msg.id}>
              <td>{msg.from_number}</td>
              <td>{normalizePhoneNumber(msg.from_number)}</td>
              <td>{msg.to_number}</td>
              <td>{normalizePhoneNumber(msg.to_number)}</td>
              <td>{msg.body?.substring(0, 30)}...</td>
              <td>{msg.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DebugPanel;
