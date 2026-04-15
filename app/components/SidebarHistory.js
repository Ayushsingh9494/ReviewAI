"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SidebarHistory({ chats: initialChats }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pinnedSession, setPinnedSession] = useState(null);
  const [chats, setChats] = useState(initialChats);
  const [chatToDelete, setChatToDelete] = useState(null);

  useEffect(() => {
    setChats(initialChats);
  }, [initialChats]);

  useEffect(() => {
    const checkPinned = () => {
       const stored = localStorage.getItem('pinned_current_session');
       if (stored) {
         try {
           const parsed = JSON.parse(stored);
           setPinnedSession(parsed);
         } catch(e) {
           const legacyTitle = chats?.find(c => c.id === stored)?.title || "Current Chat";
           setPinnedSession({ id: stored, title: legacyTitle });
         }
       } else {
         setPinnedSession(null);
       }
    };
    checkPinned();
    window.addEventListener('storage', checkPinned);
    
    const interval = setInterval(checkPinned, 1000);
    return () => {
      window.removeEventListener('storage', checkPinned);
      clearInterval(interval);
    };
  }, [chats]);

  const match = pathname?.match(/\/c\/(.+)/);
  const activeId = match ? match[1] : null;

  // Determine the "Current Session"
  let currentSession = null;
  if (activeId) {
     const savedActiveChat = chats?.find(c => c.id === activeId);
     if (savedActiveChat) {
       currentSession = savedActiveChat;
     } else if (pinnedSession?.id === activeId) {
       currentSession = pinnedSession;
     }
  } else if (pinnedSession && !chats?.some(c => c.id === pinnedSession.id)) {
     currentSession = pinnedSession;
  }

  // Filter out the current session from history list
  const historyChats = chats?.filter(chat => chat.id !== currentSession?.id) || [];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const handleInitiateDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(id);
  };

  const handleCancelDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(null);
  };

  const handleConfirmDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Close the inline confirmation UI immediately
    setChatToDelete(null);
    
    try {
      const res = await fetch(`/api/chat/${id}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed with status ${res.status}`);
      }
      
      // If they delete the current pinned session
      if (pinnedSession?.id === id) {
        localStorage.removeItem('pinned_current_session');
        setPinnedSession(null);
      }
      
      // Optimistically remove the chat from the local state
      setChats((prev) => prev.filter((c) => c.id !== id));
      
      if (activeId === id) {
        router.push('/');
      }
      router.refresh();
    } catch(err) {
      console.error("Failed to delete chat", err);
      alert(`Failed to delete chat: ${err.message}`);
    }
  };

  const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );

  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  const renderActions = (id) => {
    if (chatToDelete === id) {
      return (
        <div style={{ position: 'absolute', right: '0.5rem', display: 'flex', gap: '0.4rem', alignItems: 'center', background: 'var(--bg-primary)' }}>
          <button 
            onClick={(e) => handleConfirmDelete(e, id)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: '0.2rem', transition: 'transform 0.2s ease' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Confirm"
          >
            <CheckIcon />
          </button>
          <button 
            onClick={handleCancelDelete}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: '0.2rem', transition: 'transform 0.2s ease' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Cancel"
          >
            <XIcon />
          </button>
        </div>
      );
    }
    
    return (
      <button 
        onClick={(e) => handleInitiateDelete(e, id)}
        className="delete-button"
        title="Delete Chat"
      >
        <DeleteIcon />
      </button>
    );
  };

  return (
    <>
      {currentSession && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 className="history-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa' }}>
            <span style={{ height: '8px', width: '8px', background: '#60a5fa', borderRadius: '50%', boxShadow: '0 0 8px #60a5fa' }}></span>
            CURRENT SESSION
          </h3>
          <div className="history-link-container">
            <Link 
              href={`/c/${currentSession.id}`}
              className="history-link spotlight-element" 
              onMouseMove={handleMouseMove}
              style={{ borderLeft: '2px solid #60a5fa', paddingLeft: '0.8rem', background: 'rgba(96, 165, 250, 0.05)', flex: 1, paddingRight: '4rem' }}
            >
              <span style={{ position: 'relative', zIndex: 1 }}>{currentSession.title || "Current Chat"}</span>
            </Link>
            {renderActions(currentSession.id)}
          </div>
        </div>
      )}

      {historyChats.length > 0 && (
        <>
          <h3 className="history-title">HISTORY</h3>
          {historyChats.map((chat) => (
            <div key={chat.id} className="history-link-container">
              <Link 
                href={`/c/${chat.id}`}
                className="history-link spotlight-element"
                onMouseMove={handleMouseMove}
                style={{ flex: 1, paddingRight: '4rem' }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>{chat.title}</span>
              </Link>
              {renderActions(chat.id)}
            </div>
          ))}
        </>
      )}
      
      {historyChats.length === 0 && !currentSession && (
        <>
          <h3 className="history-title">HISTORY</h3>
          <p className="history-empty">No previous chats</p>
        </>
      )}
    </>
  );
}
