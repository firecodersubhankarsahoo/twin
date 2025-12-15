import { useState, useRef, useEffect } from 'react';
import { sendMessage, uploadFile, ingestUrl } from './api';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { role: 'model', text: "Hello. I am your Second Brain. I can recall documents, analyzing audio, and browse the web. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Convert history to Gemini format if needed, but our backend handles it.
      // We pass simplistic history for now or let backend manage context.
      // Backend expects: previousHistory as [{role: 'user'|'model', parts: [{text: '...'}]}]
      // We'll map our state to that.
      const historyPayload = messages.map(m => ({
        role: m.role === 'ai' ? 'model' : m.role, // normalize 'ai' -> 'model'
        parts: [{ text: m.text }]
      }));

      const res = await sendMessage(userMsg.text, historyPayload);
      const aiMsg = { role: 'model', text: res.data.response, sources: res.data.sources };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      let errorText = "Error: Could not retrieve answer.";
      if (err.response && err.response.status === 429) {
        errorText = err.response.data.error || "Rate limit exceeded. Please wait a moment.";
      }
      setMessages(prev => [...prev, { role: 'model', text: errorText }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIngesting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await uploadFile(formData);
      alert("File ingested successfully!");
    } catch (err) {
      alert("Ingestion failed");
    } finally {
      setIngesting(false);
    }
  };

  const handleUrlUpload = async () => {
    const url = prompt("Enter URL to ingest:");
    if (!url) return;
    setIngesting(true);
    try {
      await ingestUrl(url);
      alert("URL ingested successfully!");
    } catch (err) {
      alert("Ingestion failed");
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Second Brain</h1>
        <div className="controls">
          <button disabled={ingesting} onClick={() => fileInputRef.current.click()}>
            {ingesting ? 'Processing...' : '+ Add Document/Audio'}
          </button>
          <button disabled={ingesting} onClick={handleUrlUpload}>
            + Add URL
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".pdf,.txt,.md,.mp3,.m4a,image/*"
          />
        </div>
      </header>

      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="avatar">{msg.role === 'user' ? 'U' : 'AI'}</div>
            <div className="content">
              <div className="text">{msg.text}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="sources">
                  Sources: {msg.sources.map(s => <span key={s.id}>[Doc {s.id}] </span>)}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="message model"><div className="avatar">AI</div>Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask your brain..."
        />
        <button onClick={handleSend} disabled={loading}>Send</button>
      </div>
    </div>
  );
}

export default App;
