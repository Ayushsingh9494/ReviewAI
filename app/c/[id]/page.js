import Chat from "@/app/components/Chat";
import { ThemeSwitcher } from "@/app/components/ThemeSwitcher";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ChatPage({ params }) {
  const resolvedParams = await params;
  const chatId = resolvedParams.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the specific chat
  const { data: chat } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .single();

  if (chat && chat.user_id !== user.id) {
    redirect("/"); // unauthorized access
  }

  // Gracefully fallback to an empty array (which will seamlessly stitch with Vercel's useChat local cache)
  // if the database hasn't finished the server-side upsert yet due to a race condition.
  const messages = chat ? chat.messages : [];

  // FORCE DUMP TO DISK FOR DEBUGGING
  try {
    const fs = require('fs');
    fs.writeFileSync('./debug-messages.json', JSON.stringify(chat.messages, null, 2));
  } catch(e) {}

  return (
    <div className="mobile-layout">
      <header className="mobile-header glass-panel">
        <div className="logo">
          <h1>Review<span>AI</span></h1>
        </div>
        <ThemeSwitcher />
      </header>
      
      <main className="mobile-main">
        <Chat key={chatId} id={chatId} initialMessages={messages} />
      </main>
    </div>
  );
}
