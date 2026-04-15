import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { createClient as createStandardClient } from '@supabase/supabase-js';

// Maximum duration limit for Vercel Hobby plan
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a highly premium AI Product Review Aggregator.
The current year is exactly ${new Date().getFullYear()}, and today's date is ${new Date().toLocaleDateString()}.
If a user asks about flagship products like the Samsung Galaxy S25 or iPhone 17, they are ALREADY RELEASED. Do NOT say they are future, unreleased, or speculative devices. 

**CRITICAL INSTRUCTION: BE EXTREMELY BRIEF AND CONCISE.** 
General users do not have time to read long paragraphs. You MUST deliver information in a highly scannable, bite-sized format. 

**Formatting Requirements:**
1. **Always use Markdown Tables** for comparisons or specs. This is the fastest way to convey data.
2. **Use Bullet Points** for Pros, Cons, and Key Features. Maximum 1-2 senteces per bullet point.
3. **Use relevant emojis** to keep the formatting visually engaging and easy to parse (e.g. 📱, 🔋, 🏆, ❌).
4. **The Bottom Line:** End your response with a 1-2 sentence final verdict or conclusion.
5. **No Wall of Text:** Absolutely DO NOT output long introductory or explanatory paragraphs. Get straight to the specs, the comparison, or the verdict. 

Only provide deep, lengthy details if the user *explicitly* asks for "more details" or "in-depth review." Otherwise, keep it short, sharp, and highly objective.`;

import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  try {
    const { messages, id } = await req.json();

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    let model;
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      model = google('gemini-2.5-flash'); // Best free tier model
    } else if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-4o-mini'); // Using a fast, cheap model
    } else if (process.env.ANTHROPIC_API_KEY) {
      model = anthropic('claude-3-haiku-20240307');
    } else {
      return Response.json({
        error: 'No AI key set. Please open `.env.local` and add your GOOGLE_GENERATIVE_AI_API_KEY.'
      }, { status: 400 });
    }

    const coreMessages = messages.map(m => ({
      role: m.role,
      content: m.parts
        ? m.parts.map(p => p.type === 'text' ? p.text : '').join('')
        : m.content
    }));

    const result = await streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: coreMessages,
      onFinish: async ({ text }) => {
        if (!user || !session) return;
        
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = firstUserMsg ? (typeof firstUserMsg.content === 'string' ? firstUserMsg.content : "New Chat").substring(0, 40) + '...' : 'New Chat';
        
        const fullMessages = [...messages, { role: 'assistant', content: text, id: crypto.randomUUID() }];
        
        // Use standard supabase client with injected static JWT to completely bypass 
        // the Next.js boundary drop that aggressively crashes internal cookie parsers on async promises.
        const staticSupabase = createStandardClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL, 
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 
          { global: { headers: { Authorization: `Bearer ${session.access_token}` } } }
        );

        const { error: dbError } = await staticSupabase.from('chats').upsert({
          id,
          user_id: user.id,
          title,
          messages: fullMessages,
          created_at: new Date().toISOString()
        });
        
        try {
          const fs = require('fs');
          fs.writeFileSync('debug-db-error.json', JSON.stringify({ dbError, id, userId: user.id, title }, null, 2));
        } catch(e) {}
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("AI Route Error:", error);
    return Response.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
