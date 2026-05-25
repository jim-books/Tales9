import type { z } from 'zod';
import * as S from './schemas.js';
import * as M from './messages.js';

export type HexColor = z.infer<typeof S.HexColor>;
export type Palette = z.infer<typeof S.Palette>;
export type MotionProfile = z.infer<typeof S.MotionProfile>;
export type Lighting = z.infer<typeof S.Lighting>;
export type PerDrinkOverride = z.infer<typeof S.PerDrinkOverride>;
export type ThemeConfig = z.infer<typeof S.ThemeConfig>;

export type AnimationName = z.infer<typeof S.AnimationName>;
export type Speed = z.infer<typeof S.Speed>;
export type Intensity = z.infer<typeof S.Intensity>;
export type GlowIntensity = z.infer<typeof S.GlowIntensity>;

export type DrinkCategory = z.infer<typeof S.DrinkCategory>;
export type AnimationFamily = z.infer<typeof S.AnimationFamily>;
export type DrinkProfile = z.infer<typeof S.DrinkProfile>;
export type DraftDrink = z.infer<typeof S.DraftDrink>;

export type DesignPlan = z.infer<typeof S.DesignPlan>;
export type GeneratePlansResponse = z.infer<typeof S.GeneratePlansResponse>;
export type SelectPlanResponse = z.infer<typeof S.SelectPlanResponse>;

export type CoasterRuntimeArtifact = z.infer<typeof S.CoasterRuntimeArtifact>;
export type ThemePackage = z.infer<typeof S.ThemePackage>;

export type AssetType = z.infer<typeof S.AssetType>;
export type Asset = z.infer<typeof S.Asset>;
export type GenerateImagenAssetsResponse = z.infer<typeof S.GenerateImagenAssetsResponse>;

export type DraftStep = z.infer<typeof S.DraftStep>;
export type DraftAssetsStatus = z.infer<typeof S.DraftAssetsStatus>;
export type Draft = z.infer<typeof S.Draft>;

export type ClientRole = z.infer<typeof M.ClientRole>;
export type ClientHelloMsg = z.infer<typeof M.ClientHello>;
export type RuntimeReadyMsg = z.infer<typeof M.RuntimeReady>;
export type ApplyThemeMsg = z.infer<typeof M.ApplyTheme>;
export type ApplyThemeAckMsg = z.infer<typeof M.ApplyThemeAck>;
export type PreviewThemeMsg = z.infer<typeof M.PreviewTheme>;
export type PreviewThemeAckMsg = z.infer<typeof M.PreviewThemeAck>;
export type BridgeErrorMsg = z.infer<typeof M.BridgeError>;
export type BridgeMessage = z.infer<typeof M.BridgeMessage>;
