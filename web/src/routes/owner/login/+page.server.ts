import { error, fail, redirect } from '@sveltejs/kit';

import {
	createAccessSession,
	readAccessSession,
	revokeAccessSession
} from '$lib/server/auth/session';
import { verifyOwnerPassword } from '$lib/server/auth/crypto';
import { getDb } from '$lib/server/db';

import type { Actions, PageServerLoad } from './$types';

function openDatabase(platform: App.Platform | undefined) {
	if (!platform) {
		error(500, 'Cloudflare database binding is unavailable.');
	}

	return getDb(platform.env.DB);
}

export const load: PageServerLoad = async ({ cookies, platform }) => {
	const db = openDatabase(platform);
	const session = await readAccessSession(db, cookies);

	if (session?.isOwner) {
		redirect(303, '/');
	}

	return {};
};

export const actions = {
	default: async ({ cookies, platform, request }) => {
		const formData = await request.formData();
		const password = String(formData.get('password') ?? '');

		if (!password) {
			return fail(400, {
				success: false,
				message: 'Please enter your owner password.'
			});
		}

		if (!platform) {
			error(500, 'Cloudflare bindings are unavailable.');
		}

		const db = openDatabase(platform);

		const passwordIsCorrect = await verifyOwnerPassword(
			password,
			platform.env.OWNER_PASSWORD,
			platform.env.AUTH_SECRET
		);

		if (!passwordIsCorrect) {
			return fail(401, {
				success: false,
				message: 'The password was not recognised.'
			});
		}

		await revokeAccessSession(db, cookies);
		await createAccessSession(db, cookies, true);

		redirect(303, '/');
	}
} satisfies Actions;
