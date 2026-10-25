import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseResolverEvents, resolverPath } from './resolver-adapters.ts';

test('accept HTTPS HLS and DASH rows only', () => {
  const rows = [
    JSON.stringify({ server: { name: 'Orbit', url: 'https://media.example/test.m3u8?token=abc' } }),
    JSON.stringify({ server: { name: 'Vodka', url: 'https://media.example/test.mpd' } }),
    JSON.stringify({ server: { name: 'Unsafe', url: 'http://media.example/bad.m3u8' } }),
    JSON.stringify({ server: { name: 'Bad', url: 'file:///etc/passwd' } }),
    'invalid',
  ].join('\n');
  const streams = parseResolverEvents('VidCore', rows);
  assert.equal(streams.length, 2);
  assert.equal(streams[0].quality, 'unknown');
  assert.equal(streams[0].format, 'hls');
  assert.equal(streams[1].format, 'dash');
});

test('deduplicates streams and rejects malformed IDs', () => {
  const row = JSON.stringify({ url: 'https://media.example/a.m3u8' });
  assert.equal(parseResolverEvents('VidFast',row+'\n'+row).length,1);
  assert.equal(resolverPath('VidCore','../oops'),null);
  assert.equal(resolverPath('RiveStream','123'),null);
  assert.ok(resolverPath('VidFast','361743')?.includes('361743'));
});
