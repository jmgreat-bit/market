const businesses = Array.from({ length: 10000 }, (_, i) => ({ id: i, category: i % 10 === 0 ? 'target' : 'other' }));
const categoryFilter = 'target';

const startUnoptimized = performance.now();
let resultUnoptimized;
for (let i = 0; i < 1000; i++) {
    resultUnoptimized = categoryFilter
        ? businesses.filter(b => b.category === categoryFilter)
        : businesses;
}
const endUnoptimized = performance.now();

let cachedResult = null;
let lastBusinesses = null;
let lastCategoryFilter = null;

const startOptimized = performance.now();
let resultOptimized;
for (let i = 0; i < 1000; i++) {
    if (businesses !== lastBusinesses || categoryFilter !== lastCategoryFilter) {
        cachedResult = categoryFilter
            ? businesses.filter(b => b.category === categoryFilter)
            : businesses;
        lastBusinesses = businesses;
        lastCategoryFilter = categoryFilter;
    }
    resultOptimized = cachedResult;
}
const endOptimized = performance.now();

console.log(`Unoptimized (1000 renders, 10000 items): ${(endUnoptimized - startUnoptimized).toFixed(2)}ms`);
console.log(`Optimized (1000 renders, 10000 items): ${(endOptimized - startOptimized).toFixed(2)}ms`);
