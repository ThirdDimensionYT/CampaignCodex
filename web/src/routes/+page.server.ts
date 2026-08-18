import { fail } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';

import { getDb } from '$lib/server/db';
import { campaigns } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

function makeSlug(name: string): string {
    return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function openDatabase(platform: App.Platform | undefined) {
    if (!platform) {
        throw new Error(
            'Cloudflare bindings are not available. Run the app with npm run preview.'
        );
    }

    return getDb(platform.env.DB);
}

export const load: PageServerLoad = async ({ platform }) => {
    const db = openDatabase(platform);

    const campaignsList = await db
    .select()
    .from(campaigns)
    .orderBy(asc(campaigns.name));

    return {
        campaigns: campaignsList
    };
};

export const actions = {
    create: async ({ request, platform }) => {
        const formData = await request.formData();

        const name = String(formData.get('name') ?? '').trim();
        const description = String(formData.get('description') ?? '').trim();

        if (!name) {
            return fail(400, {
                success: false,
                message: 'Please enter a campaign name.',
                values: { name, description }
            });
        }

        const slug = makeSlug(name);

        if (!slug) {
            return fail(400, {
                success: false,
                message: 'The campaign name must contain letters or numbers.',
                values: { name, description }
            });
        }

        const db = openDatabase(platform);

        try {
            await db.insert(campaigns).values({
                name,
                slug,
                description
            });
        } catch (error) {
            console.error(
                'Campaign creation failed:',
                error instanceof Error ? error.message : error
            );

            return fail(409, {
                success: false,
                message: 'A campaign with that name already exists.',
                values: { name, description }
            });
        }

        return {
            success: true,
            message: 'Campaign created successfully.',
            values: { name: '', description: '' }
        };
    }
} satisfies Actions;
