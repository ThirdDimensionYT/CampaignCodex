import { readAccessSession } from '$lib/server/auth/session';
import { getDb } from '$lib/server/db';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, platform }) => {
	if (!platform) {
		return {
			isOwner: false
		};
	}

	const db = getDb(platform.env.DB);
	const session = await readAccessSession(db, cookies);

	return {
		isOwner: session?.isOwner ?? false
	};
};
