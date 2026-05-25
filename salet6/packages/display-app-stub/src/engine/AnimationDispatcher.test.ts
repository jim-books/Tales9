import { describe, expect, it } from 'vitest';
import type { DrinkProfile } from '@salet/shared';
import { AnimationDispatcher } from './AnimationDispatcher.js';

const drink: DrinkProfile = {
  id: 'demo',
  name: 'DEMO',
  category: 'CLASSICS',
  price: 100,
  flavorProfile: 'Bright',
  ingredients: ['Gin'],
  animationFamily: 'energetic',
  colorPalette: ['#ffffff', '#cccccc', '#999999'],
  spriteCharacter: 'lime',
  description: 'demo',
};

describe('AnimationDispatcher', () => {
  it('emits PLAY when coaster is confirmed (drink image rides inside coaster animation)', () => {
    const dispatcher = new AnimationDispatcher((id) => (id === drink.id ? drink : undefined));
    const events: string[] = [];
    dispatcher.subscribe((cmd) => events.push(cmd.action));
    dispatcher.assignDrink('c1', 'demo');
    dispatcher.onCoasterConfirmed('c1', { x: 100, y: 120 });
    expect(events).toEqual(['PLAY']);
  });

  it('emits STOP then DESPAWN_SPRITE when coaster is removed', () => {
    const dispatcher = new AnimationDispatcher(() => drink);
    const events: string[] = [];
    dispatcher.subscribe((cmd) => events.push(cmd.action));
    dispatcher.onCoasterRemoved('c1');
    expect(events).toEqual(['STOP', 'DESPAWN_SPRITE']);
  });

  it('reset clears assignments so confirmed coasters no longer play', () => {
    const dispatcher = new AnimationDispatcher((id) => (id === drink.id ? drink : undefined));
    const events: string[] = [];
    dispatcher.subscribe((cmd) => events.push(cmd.action));
    dispatcher.assignDrink('c1', 'demo');
    dispatcher.reset();
    dispatcher.onCoasterConfirmed('c1', { x: 10, y: 20 });
    expect(events).toEqual([]);
  });
});
