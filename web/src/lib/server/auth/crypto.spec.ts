import { describe, expect, it } from 'vitest';
import {
	createCampaignPassphraseCredential,
	createEditorPassphraseCredential,
	generateSessionToken,
	hashSessionToken,
	verifyCampaignPassphrase,
	verifyEditorPassphrase,
	verifyOwnerPassword
} from './crypto';

const authSecret = 'test-auth-secret';

describe('authentication crypto', () => {
	it('generates different secure session tokens', () => {
		const firstToken = generateSessionToken();
		const secondToken = generateSessionToken();

		expect(firstToken).not.toBe(secondToken);
		expect(firstToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
	});

	it('hashes the same session token consistently', async () => {
		const token = generateSessionToken();

		expect(await hashSessionToken(token)).toBe(await hashSessionToken(token));
	});

	it('accepts only the correct owner password', async () => {
		expect(await verifyOwnerPassword('correct-password', 'correct-password', authSecret)).toBe(
			true
		);

		expect(await verifyOwnerPassword('wrong-password', 'correct-password', authSecret)).toBe(false);
	});

	it('accepts only the correct campaign passphrase', async () => {
		const credential = await createCampaignPassphraseCredential('open-sesame', authSecret);

		expect(
			await verifyCampaignPassphrase(
				'open-sesame',
				credential.passphraseHash,
				credential.passphraseSalt,
				authSecret
			)
		).toBe(true);

		expect(
			await verifyCampaignPassphrase(
				'wrong-passphrase',
				credential.passphraseHash,
				credential.passphraseSalt,
				authSecret
			)
		).toBe(false);
	});

	it('keeps editor passphrases separate from player passphrases', async () => {
		const editorCredential = await createEditorPassphraseCredential('trusted-editor', authSecret);

		expect(
			await verifyEditorPassphrase(
				'trusted-editor',
				editorCredential.passphraseHash,
				editorCredential.passphraseSalt,
				authSecret
			)
		).toBe(true);

		expect(
			await verifyCampaignPassphrase(
				'trusted-editor',
				editorCredential.passphraseHash,
				editorCredential.passphraseSalt,
				authSecret
			)
		).toBe(false);
	});
});
