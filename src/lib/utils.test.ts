import { test } from 'node:test';
import assert from 'node:assert';
import { cn } from './utils.ts';

test('cn utility function', async (t) => {
  await t.test('merges tailwind classes and resolves conflicts', () => {
    assert.strictEqual(cn('p-2', 'p-4'), 'p-4');
    assert.strictEqual(cn('text-red-500', 'text-blue-500'), 'text-blue-500');
  });

  await t.test('concatenates classes correctly', () => {
    assert.strictEqual(cn('class-a', 'class-b'), 'class-a class-b');
  });

  await t.test('handles falsy values gracefully', () => {
    assert.strictEqual(cn('class-a', undefined, 'class-b', null, '', false), 'class-a class-b');
  });

  await t.test('handles conditional classes', () => {
    assert.strictEqual(cn('class-a', true && 'class-b', false && 'class-c'), 'class-a class-b');
  });

  await t.test('handles arrays of classes', () => {
    assert.strictEqual(cn(['class-a', 'class-b']), 'class-a class-b');
  });

  await t.test('handles objects with class conditions', () => {
    assert.strictEqual(cn({ 'class-a': true, 'class-b': false, 'class-c': true }), 'class-a class-c');
  });
});
