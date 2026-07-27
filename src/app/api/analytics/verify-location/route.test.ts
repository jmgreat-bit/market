import { test } from 'node:test';
import assert from 'node:assert';
import { getDistanceMeters } from './route.ts';

test('getDistanceMeters - distance between same points is 0', () => {
    assert.strictEqual(getDistanceMeters(0, 0, 0, 0), 0);
    assert.strictEqual(getDistanceMeters(50, 50, 50, 50), 0);
    assert.strictEqual(getDistanceMeters(-90, -180, -90, -180), 0);
});

test('getDistanceMeters - distance between known coordinates (New York to London)', () => {
    // New York: 40.7128° N, 74.0060° W (-74.0060)
    // London: 51.5074° N, 0.1278° W (-0.1278)
    // Distance should be approx 5,570,000 meters
    const dist = getDistanceMeters(40.7128, -74.0060, 51.5074, -0.1278);
    // Allow for some margin of error due to earth radius approximations
    assert.ok(dist > 5500000 && dist < 5600000);
});

test('getDistanceMeters - precise small distance calculation', () => {
    // Two points roughly 1km apart (using approximate lat degrees)
    // 1 degree of latitude is approx 111,111 meters
    // 1km is approx 1/111 degrees = 0.009 degrees
    const dist = getDistanceMeters(0, 0, 0.009, 0);
    // Should be close to 1000 meters
    assert.ok(dist > 990 && dist < 1010);
});
