import type { DrinkProfile, ThemePackage, ThemeConfig, CoasterRuntimeArtifact } from '@salet/shared';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export type AnimationCommand =
  | {
      action: 'PLAY';
      coasterId: string;
      profile: DrinkProfile;
      position: { x: number; y: number };
      themeConfig?: ThemeConfig;
      artifact?: CoasterRuntimeArtifact;
    }
  | { action: 'STOP'; coasterId: string }
  | {
      action: 'SPAWN_SPRITE';
      coasterId: string;
      character: string;
      position: { x: number; y: number };
      palette?: ColorPalette;
      styleIndex?: number;
      ingredientCount?: number;
      isDrinkCharacter?: boolean;
    }
  | { action: 'DESPAWN_SPRITE'; coasterId: string };

export type AnimationCommandCallback = (cmd: AnimationCommand) => void;
type DrinkResolver = (drinkId: string) => DrinkProfile | undefined;

/** Maps coaster placements to drink profiles and emits PLAY/STOP for PixiRuntime. */
export class AnimationDispatcher {
  private subscribers: AnimationCommandCallback[] = [];
  private assignments = new Map<string, string>();
  private drinkIndexMap = new Map<string, number>();

  constructor(
    private readonly resolveDrink: DrinkResolver,
    private readonly themePackage?: ThemePackage
  ) {}

  setThemePackage(theme: ThemePackage): void {
    this.themePackage = theme;
    this.drinkIndexMap.clear();
    theme.drinkProfiles?.forEach((profile, idx) => {
      this.drinkIndexMap.set(profile.id, idx);
    });
  }

  /** Clear coaster assignments when a new theme package replaces the session. */
  reset(): void {
    this.assignments.clear();
  }

  subscribe(cb: AnimationCommandCallback): () => void {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  assignDrink(coasterId: string, drinkId: string): void {
    this.assignments.set(coasterId, drinkId);
  }

  onCoasterConfirmed(coasterId: string, position: { x: number; y: number }): void {
    const drinkId = this.assignments.get(coasterId);
    if (!drinkId) return;
    const profile = this.resolveDrink(drinkId);
    if (!profile) return;
    const artifact = this.themePackage?.runtimeArtifacts?.coasterAnimations?.[profile.id];
    this.emit({
      action: 'PLAY',
      coasterId,
      profile,
      position,
      themeConfig: this.themePackage?.themeConfig,
      artifact,
    });
  }

  onCoasterRemoved(coasterId: string): void {
    this.assignments.delete(coasterId);
    this.emit({ action: 'STOP', coasterId });
    this.emit({ action: 'DESPAWN_SPRITE', coasterId });
  }

  private emit(cmd: AnimationCommand): void {
    for (const cb of this.subscribers) {
      cb(cmd);
    }
  }
}
