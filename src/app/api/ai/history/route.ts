import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

let _supabaseClient: any = null;
const getSupabase = () => {
  if (_supabaseClient) return _supabaseClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  }
  _supabaseClient = createClient(supabaseUrl, supabaseKey);
  return _supabaseClient;
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Fetch user's conversation history
        const { data: history, error } = await getSupabase()
            .from('ai_conversations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }); // older messages first

        if (error) throw error;

        // Group by session
        const sessionsMap = new Map<string, { id: string, created_at: string, preview: string, messages: any[], timestamp: number }>();

        for (const msg of history || []) {
            if (!msg.session_id) continue;
            
            if (!sessionsMap.has(msg.session_id)) {
                sessionsMap.set(msg.session_id, {
                    id: msg.session_id,
                    created_at: msg.created_at,
                    preview: msg.role === 'user' ? msg.content : 'New Conversation',
                    messages: [],
                    timestamp: new Date(msg.created_at).getTime()
                });
            }
            sessionsMap.get(msg.session_id)!.messages.push(msg);
        }

        // Sort sessions by newest first
        const sessions = Array.from(sessionsMap.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(session => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { timestamp, ...rest } = session;
                return rest;
            });

        return NextResponse.json({ sessions });
    } catch (err) {
        console.error('[AI History API] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
