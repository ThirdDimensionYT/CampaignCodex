const encoder = new TextEncoder();

const toBase64Url = (value: ArrayBuffer | Uint8Array): string => {
	const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
	const binary = String.fromCharCode(...bytes);

	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> => {
	const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
	const padding = '='.repeat((4 - (base64.length % 4)) % 4);
	const binary = atob(base64 + padding);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
};

const createHmacKey = (secret: string): Promise<CryptoKey> =>
	crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{
			name: 'HMAC',
			hash: 'SHA-256'
		},
		false,
		['sign', 'verify']
	);

export const generateSessionToken = (): string => {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return toBase64Url(bytes);
};

export const hashSessionToken = async (token: string): Promise<string> => {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
	return toBase64Url(digest);
};

export const verifyOwnerPassword = async (
	password: string,
	expectedPassword: string,
	authSecret: string
): Promise<boolean> => {
	const key = await createHmacKey(authSecret);
	const expectedSignature = await crypto.subtle.sign(
		'HMAC',
		key,
		encoder.encode(`owner-password:v1:${expectedPassword}`)
	);

	return crypto.subtle.verify(
		'HMAC',
		key,
		expectedSignature,
		encoder.encode(`owner-password:v1:${password}`)
	);
};

export const createCampaignPassphraseCredential = async (
	passphrase: string,
	authSecret: string
): Promise<{ passphraseHash: string; passphraseSalt: string }> => {
	const passphraseSalt = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
	const key = await createHmacKey(authSecret);
	const signature = await crypto.subtle.sign(
		'HMAC',
		key,
		encoder.encode(`campaign-passphrase:v1:${passphraseSalt}:${passphrase}`)
	);

	return {
		passphraseHash: toBase64Url(signature),
		passphraseSalt
	};
};

export const verifyCampaignPassphrase = async (
	passphrase: string,
	passphraseHash: string,
	passphraseSalt: string,
	authSecret: string
): Promise<boolean> => {
	try {
		const key = await createHmacKey(authSecret);

		return await crypto.subtle.verify(
			'HMAC',
			key,
			fromBase64Url(passphraseHash),
			encoder.encode(`campaign-passphrase:v1:${passphraseSalt}:${passphrase}`)
		);
	} catch {
		return false;
	}
};
