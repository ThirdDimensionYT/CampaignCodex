import type { Cookies } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import { accessSessions, campaignAccessGrants } from '$lib/server/db/schema';

import { generateSessionToken, hashSessionToken } from './crypto';

const SESSION_COOKIE_NAME = 'campaign_codex_session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

type Database = ReturnType<typeof getDb>;

export type AccessSession = {
	id: string;
	isOwner: boolean;
	expiresAt: Date;
};

const removeSessionCookie = (cookies: Cookies): void => {
	cookies.delete(SESSION_COOKIE_NAME, {
		path: '/'
	});
};

export const createAccessSession = async (
	db: Database,
	cookies: Cookies,
	isOwner: boolean
): Promise<AccessSession> => {
	const id = crypto.randomUUID();
	const token = generateSessionToken();
	const tokenHash = await hashSessionToken(token);
	const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

	await db.insert(accessSessions).values({
		id,
		tokenHash,
		isOwner,
		expiresAt
	});

	cookies.set(SESSION_COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: SESSION_DURATION_SECONDS
	});

	return {
		id,
		isOwner,
		expiresAt
	};
};

export const readAccessSession = async (
	db: Database,
	cookies: Cookies
): Promise<AccessSession | null> => {
	const token = cookies.get(SESSION_COOKIE_NAME);

	if (!token) {
		return null;
	}

	const tokenHash = await hashSessionToken(token);

	const results = await db
		.select({
			id: accessSessions.id,
			isOwner: accessSessions.isOwner,
			expiresAt: accessSessions.expiresAt
		})
		.from(accessSessions)
		.where(eq(accessSessions.tokenHash, tokenHash))
		.limit(1);

	const session = results[0];

	if (!session) {
		removeSessionCookie(cookies);
		return null;
	}

	if (session.expiresAt.getTime() <= Date.now()) {
		await db.delete(accessSessions).where(eq(accessSessions.id, session.id));
		removeSessionCookie(cookies);
		return null;
	}

	return session;
};

export const revokeAccessSession = async (db: Database, cookies: Cookies): Promise<void> => {
	const token = cookies.get(SESSION_COOKIE_NAME);

	if (token) {
		const tokenHash = await hashSessionToken(token);
		await db.delete(accessSessions).where(eq(accessSessions.tokenHash, tokenHash));
	}

	removeSessionCookie(cookies);
};

export const grantCampaignAccess = async (
	db: Database,
	accessSessionId: string,
	campaignId: string,
	accessVersion: number
): Promise<void> => {
	await db
		.insert(campaignAccessGrants)
		.values({
			id: crypto.randomUUID(),
			accessSessionId,
			campaignId,
			accessVersion
		})
		.onConflictDoUpdate({
			target: [campaignAccessGrants.accessSessionId, campaignAccessGrants.campaignId],
			set: {
				accessVersion
			}
		});
};

export const hasCampaignAccess = async (
	db: Database,
	session: AccessSession | null,
	campaignId: string,
	accessVersion: number
): Promise<boolean> => {
	if (session?.isOwner) {
		return true;
	}

	if (!session) {
		return false;
	}

	const grants = await db
		.select({
			id: campaignAccessGrants.id
		})
		.from(campaignAccessGrants)
		.where(
			and(
				eq(campaignAccessGrants.accessSessionId, session.id),
				eq(campaignAccessGrants.campaignId, campaignId),
				eq(campaignAccessGrants.accessVersion, accessVersion)
			)
		)
		.limit(1);

	return grants.length > 0;
};
