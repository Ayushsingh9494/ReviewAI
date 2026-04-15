import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: chats, error } = await supabase.from('chats').select('*').order('created_at', { ascending: false }).limit(2);
    
    return Response.json({ chats, error });
  } catch (err) {
    return Response.json({ error: err.message });
  }
}
