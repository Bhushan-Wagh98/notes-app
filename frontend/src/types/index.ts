/**
 * @module types
 * @description Shared TypeScript interfaces used across the frontend application.
 */

/** Metadata returned by the server when a document is loaded via Socket.IO. */
export interface DocMeta {
  isPrivate: boolean;
  isReadOnly: boolean;
  isLocked: boolean;
  isOwner: boolean;
  readOnly?: boolean;
  ownerName?: string;
}

/** Represents a note document returned by the REST API. */
export interface Note {
  _id: string;
  title: string;
  isPrivate: boolean;
  isReadOnly: boolean;
  isLocked: boolean;
  updatedAt: string;
}

/** Represents a user record returned by admin endpoints. */
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isBlocked: boolean;
}
