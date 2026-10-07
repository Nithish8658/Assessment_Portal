import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const source = readFileSync(new URL('../src/utils/assessmentTiming.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { createDeadlineClock, remainingSeconds, serverTimestamp, isLowTime } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const timingModuleUrl = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
const data = { duration_minutes: 45, time_remaining_seconds: 2700, server_time: '2026-09-08T10:00:00Z', expires_at: '2026-09-08T10:45:00Z' };

test('starts at the approved duration regardless of the device timezone or clock', () => {
  const clock = createDeadlineClock(data, 100, 123456789);
  assert.equal(remainingSeconds(clock, 100, 123456789), 2700);
  assert.equal(serverTimestamp('2026-09-08T10:00:00'), serverTimestamp('2026-09-08T15:30:00+05:30'));
});
test('a throttled timer catches up after 20 minutes without intermediate ticks', () => {
  const clock = createDeadlineClock(data, 0, 0);
  assert.equal(remainingSeconds(clock, 1200000, 1200000), 1500);
});
test('OS sleep is counted even if the monotonic clock pauses', () => {
  assert.equal(remainingSeconds(createDeadlineClock(data, 0, 0), 1000, 1200000), 1500);
});
test('changing device clock backwards cannot add time', () => {
  assert.equal(remainingSeconds(createDeadlineClock(data, 0, 1000000), 60000, 0), 2640);
});
test('resume uses the remaining time and an expired attempt remains at zero', () => {
  const resumed = createDeadlineClock({ ...data, server_time: '2026-09-08T10:30:00Z', time_remaining_seconds: 900 }, 0, 0);
  assert.equal(remainingSeconds(resumed, 0, 0), 900);
  assert.equal(remainingSeconds(resumed, 900000, 900000), 0);
  const expired = createDeadlineClock({ ...data, time_remaining_seconds: 0 }, 0, 0);
  assert.equal(remainingSeconds(expired, 0, 0), 0);
});
test('a short round does not start red; warning is limited to its final 10 percent', () => {
  assert.equal(isLowTime(180, 3), false);
  assert.equal(isLowTime(19, 3), false);
  assert.equal(isLowTime(18, 3), true);
  assert.equal(isLowTime(301, 90), false);
  assert.equal(isLowTime(300, 90), true);
});
test('missing timing data is rejected instead of appearing as an expired round', () => {
  assert.throws(() => createDeadlineClock({ ...data, expires_at: '' }, 0, 0));
});

test('the shared round header renders approved time and its submit button', async () => {
  const require = createRequire(import.meta.url);
  const header = readFileSync(new URL('../src/components/assessment/TimerHeader.tsx', import.meta.url), 'utf8')
    .replace("import { Clock, Send, Shield } from 'lucide-react';", 'const Clock = () => null, Send = () => null, Shield = () => null;')
    .replace("import apiClient from '../../api/client';", 'const apiClient = {};')
    .replace("'../../utils/assessmentTiming'", JSON.stringify(timingModuleUrl))
    .replace("'react'", JSON.stringify(pathToFileURL(require.resolve('react')).href));
  const compiled = ts.transpileModule(header, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React } }).outputText;
  const { TimerHeader } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  const attempt = { ...data, attempt_id: 1, round_title: 'Approved Coding Round', round_number: 3 };
  const html = renderToStaticMarkup(React.createElement(TimerHeader, { attemptData: attempt, onSubmit() {} }));
  assert.match(html, /45:00/);
  assert.match(html, /Approved Coding Round/);
  assert.doesNotMatch(html, /animate-pulse/);
  const expired = renderToStaticMarkup(React.createElement(TimerHeader, { attemptData: { ...attempt, time_remaining_seconds: 0 }, onSubmit() {} }));
  assert.match(expired, /00:00/);
  assert.match(expired, /disabled=""/);
});
