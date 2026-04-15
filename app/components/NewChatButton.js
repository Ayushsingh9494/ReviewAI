"use client";
import { useRouter } from "next/navigation";

export function NewChatButton() {
  const router = useRouter();

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <button
      className="new-chat-btn spotlight-element"
      onMouseMove={handleMouseMove}
      onClick={() => {
        sessionStorage.removeItem('draft_input');
        localStorage.removeItem('pinned_current_session');
        // Use Next.js soft navigation instead of hard reload to prevent the white screen flash
        router.push('/');
        router.refresh();
      }}
      style={{ width: '100%', textAlign: 'center', cursor: 'pointer', border: 'none', outline: 'none' }}
    >
      + New Chat
    </button>
  );
}
