/**
 * Virtual deck constants and utilities for backend
 * These represent special deck IDs that don't correspond to real database records
 * but are used for organizing conversations by context type
 */

import { v5 } from 'uuid';

/**
 * Namespace UUID for virtual dashboard decks
 * This ensures consistent UUID generation for the same user
 */
const VIRTUAL_DASHBOARD_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Create a deterministic UUID for dashboard conversations
 * @param userUuid - The user's UUID
 * @returns A valid UUID that's consistent for the same user
 */
export function createDashboardVirtualDeckId(userUuid: string): string {
  // Use UUID v5 to create a deterministic UUID based on user ID
  // This ensures the same user always gets the same virtual deck ID
  return v5(`dashboard-${userUuid}`, VIRTUAL_DASHBOARD_NAMESPACE);
}

/**
 * Check if a deck ID is a virtual dashboard deck
 * @param deckId - The deck ID to check
 * @param userUuid - The user's UUID to validate against
 * @returns True if the deck ID is a virtual dashboard deck for this user
 */
export function isVirtualDashboardDeck(deckId: string, userUuid: string): boolean {
  const expectedVirtualDeckId = createDashboardVirtualDeckId(userUuid);
  return deckId === expectedVirtualDeckId;
}

/**
 * Validate that a virtual deck ID belongs to the specified user
 * @param deckId - The virtual deck ID
 * @param userUuid - The user's UUID
 * @returns True if the virtual deck belongs to the user
 */
export function validateVirtualDeckOwnership(deckId: string, userUuid: string): boolean {
  return isVirtualDashboardDeck(deckId, userUuid);
}
