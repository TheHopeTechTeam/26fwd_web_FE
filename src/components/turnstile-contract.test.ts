import { describe, expect, it } from 'vitest';
import backendSource from '../../functions/_lib/cards.ts?raw';
import widgetSource from './Turnstile.tsx?raw';

// The widget and the backend each hard-code the Turnstile action name. When they drifted
// apart ('forward_card' vs 'forward-card') every real submission was rejected, and no test
// noticed because the mock API never calls siteverify. This test pins the two together.
describe('Turnstile action contract', () => {
  it('backend checks exactly the action the widget sends', () => {
    const widgetAction = widgetSource.match(/action:\s*'([^']+)'/)?.[1];
    const backendAction = backendSource.match(/result\.action !== '([^']+)'/)?.[1];

    expect(widgetAction, 'action not found in src/components/Turnstile.tsx').toBeDefined();
    expect(backendAction, 'action check not found in functions/_lib/cards.ts').toBeDefined();
    expect(backendAction).toBe(widgetAction);
  });
});
