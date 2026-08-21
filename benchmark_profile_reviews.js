const { performance } = require('perf_hooks');

// Mock data
const numUsers = 1000;
const numReviews = 5000;

const users = Array.from({ length: numUsers }, (_, i) => ({ id: `user_${i}`, name: `User ${i}` }));
const initialReviews = Array.from({ length: numReviews }, (_, i) => ({
    id: `review_${i}`,
    user_id: `user_${Math.floor(Math.random() * numUsers)}`,
    text: `Review ${i}`
}));

function baseline() {
    const start = performance.now();
    const enriched = initialReviews.map(r => {
        const u = users.find(user => user.id === r.user_id);
        return { ...r, user: u };
    });
    const end = performance.now();
    return end - start;
}

function optimized() {
    const start = performance.now();
    const usersMap = new Map(users.map(u => [u.id, u]));
    const enriched = initialReviews.map(r => {
        const u = usersMap.get(r.user_id);
        return { ...r, user: u };
    });
    const end = performance.now();
    return end - start;
}

// Warmup
baseline();
optimized();

let baselineTotal = 0;
let optimizedTotal = 0;
const iterations = 100;

for (let i = 0; i < iterations; i++) {
    baselineTotal += baseline();
    optimizedTotal += optimized();
}

console.log(`Baseline average: ${baselineTotal / iterations} ms`);
console.log(`Optimized average: ${optimizedTotal / iterations} ms`);
console.log(`Speedup: ${baselineTotal / optimizedTotal}x`);
