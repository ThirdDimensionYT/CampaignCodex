import { error, redirect } from '@sveltejs/kit';

import { revokeAccessSession } from '$lib/server/auth/session';
import { getDb } from '$lib/server/db';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, platform }) => {
	if (!platform) {
		error(500, 'Cloudflare database binding is unavailable.');
	}

	const db = getDb(platform.env.DB);

	await revokeAccessSession(db, cookies);

	redirect(303, '/');
};
