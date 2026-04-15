import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(request, context) {
  try {
    // Next.js 15+ dynamic params can be tricky. Using url fallback ensures it never fails.
    let id;
    try {
      const params = await context.params;
      id = params?.id;
    } catch(e) {}
    
    if (!id || id === 'undefined') {
      id = request.url.split('/').pop();
    }
    
    const supabase = await createClient();
    
    // Ensure the user is authenticated 
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Attempt to delete the chat safely restricted to the user
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Chat Error:", error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
