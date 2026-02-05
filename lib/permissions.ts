/**
 * Permission utilities for role-based access control
 */

import { Session } from 'next-auth';

export type UserRole = 'admin' | 'auditor' | 'viewer';

/**
 * Check if user has viewer role
 */
export function isViewer(session: Session | null): boolean {
    if (!session?.user) return false;
    return (session.user as any).role === 'viewer';
}

/**
 * Check if user has admin role
 */
export function isAdmin(session: Session | null): boolean {
    if (!session?.user) return false;
    return (session.user as any).role === 'admin';
}

/**
 * Check if user has auditor role (can edit inventory)
 */
export function isAuditor(session: Session | null): boolean {
    if (!session?.user) return false;
    return (session.user as any).role === 'auditor';
}

/**
 * Check if user can edit products
 * Viewers cannot edit
 */
export function canEdit(session: Session | null): boolean {
    if (!session?.user) return false;
    const role = (session.user as any).role;
    return role === 'admin' || role === 'auditor';
}

/**
 * Check if user can print labels
 * Viewers cannot print
 */
export function canPrint(session: Session | null): boolean {
    if (!session?.user) return false;
    const role = (session.user as any).role;
    return role === 'admin' || role === 'auditor';
}

/**
 * Check if user can use quick count
 * Viewers cannot count
 */
export function canCount(session: Session | null): boolean {
    if (!session?.user) return false;
    const role = (session.user as any).role;
    return role === 'admin' || role === 'auditor';
}

/**
 * Check if user can see zero-stock products
 * Viewers cannot see zero-stock items
 */
export function canSeeZeroStock(session: Session | null): boolean {
    if (!session?.user) return true; // Default to showing all
    const role = (session.user as any).role;
    return role === 'admin' || role === 'auditor';
}

/**
 * Check if user can edit prices
 * Only admins can edit prices
 */
export function canEditPrice(session: Session | null): boolean {
    if (!session?.user) return false;
    const role = (session.user as any).role;
    return role === 'admin';
}
