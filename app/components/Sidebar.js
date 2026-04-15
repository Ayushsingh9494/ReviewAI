import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LogoutButton } from "./LogoutButton";
import { SidebarHistory } from "./SidebarHistory";
import { NewChatButton } from "./NewChatButton";

export async function Sidebar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); 

  if (!user) {
    return null;
  }

  // Fetch user's chats
  const { data: chats } = await supabase
    .from("chats")
    .select("id, title")
    .order("created_at", { ascending: false });

  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <Link href="/" className="brand-logo">
          ReviewAI
        </Link>
        <ThemeSwitcher />
      </div>
      
      <div className="sidebar-nav">
        <NewChatButton />
      </div>

      <div className="sidebar-history">
        <SidebarHistory chats={chats} />
      </div>

      <div className="sidebar-footer">
        <span className="truncate">{user.email}</span>
        <LogoutButton />
      </div>
    </div>
  );
}
