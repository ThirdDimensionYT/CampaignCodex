import { error, redirect } from '@sveltejs/kit';

import { getDb } from '$lib/server/db';

import { readAccessSession } from './session';

import type { Cookies } from '@sveltejs/kit';

export const requireOwner = async (platform: App.Platform | undefined, cookies: Cookies) => {
	if (!platform) {
		error(500, 'Cloudflare database binding is unavailable.');
	}

	const db = getDb(platform.env.DB);
	const session = await readAccessSession(db, cookies);

	if (!session?.isOwner) {
		redirect(303, '/owner/login');
	}

	return db;
};
