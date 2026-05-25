import { z } from 'zod';
import { ThemePackage } from './schemas.js';

export const ClientRole = z.enum(['authoring', 'runtime']);

export const ClientHello = z.object({
  type: z.literal('CLIENT_HELLO'),
  role: ClientRole,
  clientId: z.string().optional(),
});

export const RuntimeReady = z.object({
  type: z.literal('RUNTIME_READY'),
  pixiReady: z.boolean(),
});

export const ApplyTheme = z.object({
  type: z.literal('APPLY_THEME'),
  requestId: z.string().min(1),
  themePackage: ThemePackage,
});

export const ApplyThemeAck = z.object({
  type: z.literal('APPLY_THEME_ACK'),
  requestId: z.string().min(1),
  ok: z.boolean(),
  errorCode: z.string().optional(),
  message: z.string().optional(),
});

export const PreviewTheme = z.object({
  type: z.literal('PREVIEW_THEME'),
  requestId: z.string().min(1),
  themePackage: ThemePackage,
});

export const PreviewThemeAck = z.object({
  type: z.literal('PREVIEW_THEME_ACK'),
  requestId: z.string().min(1),
  ok: z.boolean(),
  errorCode: z.string().optional(),
  message: z.string().optional(),
});

export const BridgeError = z.object({
  type: z.literal('BRIDGE_ERROR'),
  requestId: z.string().optional(),
  code: z.string(),
  message: z.string(),
});

export const BridgeMessage = z.discriminatedUnion('type', [
  ClientHello,
  RuntimeReady,
  ApplyTheme,
  ApplyThemeAck,
  PreviewTheme,
  PreviewThemeAck,
  BridgeError,
]);

export function validateMessage(input: unknown) {
  return BridgeMessage.safeParse(input);
}
