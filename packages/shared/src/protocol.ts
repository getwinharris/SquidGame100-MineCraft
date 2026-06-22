/**
 * Wire protocol for SquidGame100 MineCraft.
 *
 * Messages are JSON objects tagged with a `type` discriminator. Every message
 * carries `v` (protocol version) so client/server can reject mismatches.
 *
 * Stage 0 ships only the envelope + handshake/echo messages used to prove the
 * client<->server pipe works. Real gameplay messages (join, input, snapshot,
 * room ops, match events) land in Stage 3 onward and must extend this schema
 * without breaking existing shapes.
 */

import { z } from 'zod';
import { PROTOCOL_VERSION } from './config.js';

/** Envelope fields present on every message. */
const envelope = {
  v: z.literal(PROTOCOL_VERSION).describe('Protocol version'),
  type: z.string().describe('Discriminator'),
};

/* ------------------------------------------------------------------ *
 * Client -> Server
 * ------------------------------------------------------------------ */

export const HelloMessageSchema = z.object({
  ...envelope,
  type: z.literal('hello'),
  clientId: z.string().min(1),
  clientName: z.string().max(32).optional(),
});
export type HelloMessage = z.infer<typeof HelloMessageSchema>;

/** Stage 0 loopback ping used to verify the WS round-trip. */
export const PingMessageSchema = z.object({
  ...envelope,
  type: z.literal('ping'),
  t: z.number().int().describe('Client timestamp ms'),
});
export type PingMessage = z.infer<typeof PingMessageSchema>;

export const ClientMessageSchema = z.discriminatedUnion('type', [
  HelloMessageSchema,
  PingMessageSchema,
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

/* ------------------------------------------------------------------ *
 * Server -> Client
 * ------------------------------------------------------------------ */

export const WelcomeMessageSchema = z.object({
  ...envelope,
  type: z.literal('welcome'),
  serverName: z.string(),
  protocol: z.literal(PROTOCOL_VERSION),
});
export type WelcomeMessage = z.infer<typeof WelcomeMessageSchema>;

export const PongMessageSchema = z.object({
  ...envelope,
  type: z.literal('pong'),
  t: z.number().int(),
  serverT: z.number().int(),
});
export type PongMessage = z.infer<typeof PongMessageSchema>;

export const ErrorMessageSchema = z.object({
  ...envelope,
  type: z.literal('error'),
  code: z.string(),
  message: z.string(),
});
export type ErrorMessage = z.infer<typeof ErrorMessageSchema>;

export const TickMessageSchema = z.object({
  ...envelope,
  type: z.literal('tick'),
  tick: z.number().int().nonnegative(),
  time: z.number().int(),
});
export type TickMessage = z.infer<typeof TickMessageSchema>;

export const ServerMessageSchema = z.discriminatedUnion('type', [
  WelcomeMessageSchema,
  PongMessageSchema,
  ErrorMessageSchema,
  TickMessageSchema,
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/** Tag a payload with the envelope fields. Keeps senders DRY. */
export function msg<T extends { type: string }>(payload: T): T & { v: typeof PROTOCOL_VERSION } {
  return { ...payload, v: PROTOCOL_VERSION };
}

/** Parse an unknown inbound client message; returns parsed or throws ZodError. */
export function parseClientMessage(raw: unknown): ClientMessage {
  return ClientMessageSchema.parse(raw);
}

/** Parse an unknown inbound server message; returns parsed or throws ZodError. */
export function parseServerMessage(raw: unknown): ServerMessage {
  return ServerMessageSchema.parse(raw);
}
