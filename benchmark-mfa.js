const { performance } = require('perf_hooks');

const simulateMfaUnenroll = async (id) => {
    return new Promise(resolve => setTimeout(resolve, 50)); // simulate 50ms network delay
};

const factors = Array.from({ length: 5 }, (_, i) => ({
    id: `factor-${i}`,
    status: 'unverified'
}));

async function runUnoptimized() {
    const start = performance.now();
    for (const factor of factors) {
        if (factor.status === 'unverified') {
            await simulateMfaUnenroll(factor.id);
        }
    }
    const end = performance.now();
    return end - start;
}

async function runOptimized() {
    const start = performance.now();
    await Promise.all(
        factors
            .filter(factor => factor.status === 'unverified')
            .map(factor => simulateMfaUnenroll(factor.id))
    );
    const end = performance.now();
    return end - start;
}

async function benchmark() {
    console.log("Running baseline (Sequential)...");
    const baseline = await runUnoptimized();
    console.log(`Baseline time: ${baseline.toFixed(2)}ms`);

    console.log("Running optimized (Concurrent)...");
    const optimized = await runOptimized();
    console.log(`Optimized time: ${optimized.toFixed(2)}ms`);

    const improvement = baseline - optimized;
    console.log(`Improvement: ${improvement.toFixed(2)}ms (${((improvement / baseline) * 100).toFixed(2)}% faster)`);
}

benchmark();
