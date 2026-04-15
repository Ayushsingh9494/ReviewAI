import { ThemeSwitcher } from "./components/ThemeSwitcher";
import Chat from "./components/Chat";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
   const { data: { user } } = await supabase.auth.getUser(); 

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mobile-layout">
      <header className="mobile-header glass-panel">
        <div className="logo">
          <h1>Review<span>AI</span></h1>
        </div>
        <ThemeSwitcher />
      </header>
      
      <main className="mobile-main">
        <Chat key="new" />
      </main>
    </div>
  );
}
