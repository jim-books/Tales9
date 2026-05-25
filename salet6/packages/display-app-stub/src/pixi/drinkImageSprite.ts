import { Container, Sprite, Texture } from 'pixi.js';
import {
  DRINK_IMAGE_BASE_SIZE,
  DRINK_IMAGE_SCALE,
} from '../engine/constants.js';
import { toProxiedDrinkImageUrl } from './drinkImageUrl.js';

/** Load a centered drink photo into `parent` at `index` (below coaster animation layers). */
export async function mountDrinkImageSprite(
  parent: Container,
  url: string,
  index = 0,
): Promise<Sprite | null> {
  const loadUrl = toProxiedDrinkImageUrl(url);
  if (!/^https?:\/\//i.test(loadUrl) && !/^data:image\//i.test(loadUrl)) {
    return null;
  }
  try {
    const res = await fetch(loadUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const texture = Texture.from(bitmap);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    const fit =
      (DRINK_IMAGE_BASE_SIZE * DRINK_IMAGE_SCALE) /
      Math.max(sprite.texture.width, sprite.texture.height, 1);
    sprite.scale.set(fit);
    sprite.position.set(0, 0);
    parent.addChildAt(sprite, index);
    return sprite;
  } catch {
    return null;
  }
}
