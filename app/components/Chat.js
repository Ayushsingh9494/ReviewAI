"use client";

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLoader } from './PrismLoader';

export default function Chat({ id, initialMessages }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Create a stable local ID if neither was provided. MUST be a valid UUIDv4 for Supabase!
  const [chatId] = useState(() => {
    if (id) return id;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  });
  
  // Robustly handle stringified JSON from database
  let parsedInitial = initialMessages;
  if (typeof initialMessages === 'string') {
    try {
      parsedInitial = JSON.parse(initialMessages);
    } catch (e) {
      console.error("Failed to parse initialMessages", e);
    }
  }

  // Ensure initialMessages is a valid array and precisely formatted for Vercel AI SDK
  const validInitial = Array.isArray(parsedInitial) ? parsedInitial.map((m, i) => ({
    id: m.id || `msg-${i}`,
    role: m.role || 'user',
    content: m.content || (m.parts ? m.parts.map(p => p.type === 'text' ? p.text : '').join('') : ''),
  })) : parsedInitial;

  const { messages, setMessages, sendMessage, status, error } = useChat({
    id: chatId,
    initialMessages: validInitial || [
      { id: 'initial', role: 'assistant', content: "Hi! I am your AI Product Review Aggregator. Ask me to lookup a product, summarize reviews, or compare two gadgets!" }
    ],
    body: { id: chatId },
    onFinish: () => {
      if (pathname === '/') {
        router.replace(`/c/${chatId}`);
        // Ensure the Sidebar forcibly re-fetches the Supabase database to populate 
        // the History list organically the moment the first generation concludes.
        setTimeout(() => {
          router.refresh();
        }, 300);
      } else {
        router.refresh();
      }
    }
  });

  // HIGH-SPEED CACHE BRIDGE: Synchronize active chat state into sessionStorage
  useEffect(() => {
    if (messages && messages.length > 0) {
      sessionStorage.setItem(`chat_cache_${chatId}`, JSON.stringify(messages));
    }
  }, [messages, chatId]);

  // FORCE HYDRATION directly to state to bypass any global cache rejection in Vercel AI SDK
  useEffect(() => {
    // If DB provided empty messages (due to Race Condition with Supabase upsert), try grabbing from our synchronous browser cache!
    if (!validInitial || validInitial.length === 0) {
      const cached = sessionStorage.getItem(`chat_cache_${chatId}`);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.length > 0) {
            setMessages(parsedCache);
            return;
          }
        } catch (e) {}
      }
    }
    
    // Otherwise rely on valid DB fetch
    if (validInitial && validInitial.length > 0) {
      setMessages(validInitial);
    }
  }, [chatId]);

  console.log("Chat.js messages state array:", messages);
  
  const [input, setInput] = useState("");
  const isLoading = status === 'submitted' || status === 'streaming';

  // Track unsaved input drafts locally
  useEffect(() => {
    if (input && input.length > 0) {
      sessionStorage.setItem('draft_input', input);
    } else {
      sessionStorage.removeItem('draft_input');
    }
  }, [input]);

  // Restore unsaved draft on load if on new chat page
  useEffect(() => {
    if (pathname === '/') {
      const draft = sessionStorage.getItem('draft_input');
      if (draft) {
        setInput(draft);
      }
    }
  }, [pathname]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Natively pin the actively generated chat as the primary "Current Session" 
    // including the true title so that it survives soft-navigations perfectly before Server sync!
    let chatTitle = input;
    if (messages && messages.length > 0) {
      const firstUser = messages.find(m => m.role === 'user');
      if (firstUser) {
        chatTitle = typeof firstUser.content === 'string' ? firstUser.content : input;
      }
    }
    chatTitle = chatTitle.substring(0, 40) + '...';
    localStorage.setItem('pinned_current_session', JSON.stringify({ id: chatId, title: chatTitle }));

    sendMessage({ role: 'user', content: input });
    sessionStorage.removeItem('draft_input');
    setInput("");
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Auto-scroll as messages stream in
  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  return (
    <div className="chat-container glass-panel">
      <div className="chat-history">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
            <div className={`message-bubble ${msg.role === 'ai' ? 'markdown-body' : ''}`}>
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.parts && msg.parts.length > 0 
                    ? msg.parts.map(p => p.type === 'text' ? p.text : '').join('')
                    : msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="chat-message ai">
            <div className="message-bubble" style={{ minHeight: '48px', display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', paddingLeft: 0 }}>
              <PrismLoader />
            </div>
          </div>
        )}
        {error && (
          <div className="chat-message ai">
            <div className="message-bubble" style={{ background: '#ff4d4f', color: '#fff' }}>
              <strong>API Error:</strong> {error.message || "Failed to fetch response."}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleFormSubmit} className="chat-input-area">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask e.g. 'Compare iPhone 15 vs Pixel 8'"
          className="chat-input"
          disabled={isLoading}
        />
        <button type="submit" className="chat-submit-btn" disabled={isLoading || !(input || "").trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
