const n = 100;
const messagesPerConv = 5;

// Mock supabase client to simulate network overhead more accurately with serial processing that often happens in JS engines or connection pooling limits.
const networkDelay = (ms) => new Promise(res => setTimeout(res, ms));

let activeConnections = 0;
const MAX_CONNECTIONS = 10;

async function querySim(latency) {
    while (activeConnections >= MAX_CONNECTIONS) {
        await networkDelay(5);
    }
    activeConnections++;
    await networkDelay(latency);
    activeConnections--;
}

const mockSupabase = {
    from: (table) => ({
        select: (cols, options) => ({
            eq: (col, val) => ({
                neq: (col2, val2) => ({
                    eq: (col3, val3) => {
                        return (async () => {
                            await querySim(50); // 50ms latency per query
                            return { count: messagesPerConv };
                        })();
                    }
                })
            }),
            in: (col, vals) => ({
                neq: (col2, val2) => ({
                    eq: (col3, val3) => {
                        return (async () => {
                            await querySim(60); // 60ms latency for a slightly larger query
                            const data = [];
                            for (const val of vals) {
                                for (let i = 0; i < messagesPerConv; i++) {
                                    data.push({ id: Math.random(), conversation_id: val });
                                }
                            }
                            return { data };
                        })();
                    }
                })
            })
        })
    })
};

const convData = Array.from({ length: n }, (_, i) => ({ id: i }));

async function runUnoptimized() {
    const start = performance.now();
    const unreadCountsPromises = convData.map(async (c) => {
        const { count } = await mockSupabase
            .from('direct_messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', c.id)
            .neq('sender_id', 'user1')
            .eq('is_read', false);
        return { conversationId: c.id, unreadCount: count || 0 };
    });
    const unreadCounts = await Promise.all(unreadCountsPromises);
    const unreadMap = new Map(unreadCounts.map(u => [u.conversationId, u.unreadCount]));
    const end = performance.now();
    return end - start;
}

async function runOptimized() {
    const start = performance.now();
    const { data: unreadData } = await mockSupabase
        .from('direct_messages')
        .select('conversation_id')
        .in('conversation_id', convData.map(c => c.id))
        .neq('sender_id', 'user1')
        .eq('is_read', false);

    const unreadMap = new Map();
    if (unreadData) {
        unreadData.forEach(msg => {
            unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
        });
    }
    const end = performance.now();
    return end - start;
}

async function main() {
    console.log(`Running baseline (N+1 queries for ${n} items with max ${MAX_CONNECTIONS} concurrent connections)...`);
    const t1 = await runUnoptimized();
    console.log(`Baseline time: ${t1.toFixed(2)}ms`);

    console.log("Running optimized (1 query)...");
    const t2 = await runOptimized();
    console.log(`Optimized time: ${t2.toFixed(2)}ms`);
}

main();
