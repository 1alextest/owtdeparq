/**
 * Virtual deck constants and utilities for backend
 * These represent special deck IDs that don't correspond to real database records
 * but are used for organizing conversations by context type
 */

/**
 * Prefix for virtual dashboard deck IDs
 * Format: "virtual-dashboard-{userUuid}"
 */
export const VIRTUAL_DECK_PREFIX = 'virtual-dashboard-';

/**
 * Create a virtual deck ID for dashboard conversations
 * @param userUuid - The user's UUID
 * @returns Virtual deck ID in format "virtual-dashboard-{userUuid}"
 */
export function createDashboardVirtualDeckId(userUuid: string): string {
  return `${VIRTUAL_DECK_PREFIX}${userUuid}`;
}

/**
 * Check if a deck ID is a virtual dashboard deck
 * @param deckId - The deck ID to check
 * @returns True if the deck ID is a virtual dashboard deck
 */
export function isVirtualDashboardDeck(deckId: string): boolean {
  return deckId.startsWith(VIRTUAL_DECK_PREFIX);
}

/**
 * Extract user UUID from a virtual dashboard deck ID
 * @param deckId - The virtual deck ID
 * @returns User UUID if valid virtual deck, null otherwise
 */
export function extractUserUuidFromVirtualDeck(deckId: string): string | null {
  if (!isVirtualDashboardDeck(deckId)) {
    return null;
  }
  return deckId.replace(VIRTUAL_DECK_PREFIX, '');
}

/**
 * Validate that a virtual deck ID belongs to the specified user
 * @param deckId - The virtual deck ID
 * @param userUuid - The user's UUID
 * @returns True if the virtual deck belongs to the user
 */
export function validateVirtualDeckOwnership(deckId: string, userUuid: string): boolean {
  const extractedUserId = extractUserUuidFromVirtualDeck(deckId);
  return extractedUserId === userUuid;
}
