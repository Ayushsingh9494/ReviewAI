"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleSignOut}
      className="logout-btn"
      title="Sign Out"
    >
      Sign Out
    </button>
  );
}
