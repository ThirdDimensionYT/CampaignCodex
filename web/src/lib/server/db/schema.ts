import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const entityTypes = [
	'character',
	'npc',
	'location',
	'faction',
	'item',
	'quest',
	'other'
] as const;
export const sessionStatuses = ['draft', 'published'] as const;
export const importStatuses = ['pending', 'approved', 'rejected', 'failed'] as const;

const id = () =>
	text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
	integer('created_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`);

const updatedAt = () =>
	integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`);

export const campaigns = sqliteTable(
	'campaigns',
	{
		id: id(),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		description: text('description').notNull().default(''),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [uniqueIndex('campaigns_slug_unique').on(table.slug)]
);

export const campaignAccessCredentials = sqliteTable(
	'campaign_access_credentials',
	{
		campaignId: text('campaign_id')
			.primaryKey()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		passphraseHash: text('passphrase_hash').notNull(),
		passphraseSalt: text('passphrase_salt').notNull(),
		accessVersion: integer('access_version').notNull().default(1),
		updatedAt: updatedAt()
	},
	(table) => [check('campaign_access_version_check', sql`${table.accessVersion} >= 1`)]
);

export const campaignEditorCredentials = sqliteTable(
	'campaign_editor_credentials',
	{
		id: id(),
		campaignId: text('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		label: text('label').notNull(),
		normalizedLabel: text('normalized_label').notNull(),
		passphraseHash: text('passphrase_hash').notNull(),
		passphraseSalt: text('passphrase_salt').notNull(),
		accessVersion: integer('access_version').notNull().default(1),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [
		uniqueIndex('campaign_editor_credentials_campaign_label_unique').on(
			table.campaignId,
			table.normalizedLabel
		),
		index('campaign_editor_credentials_campaign_idx').on(table.campaignId),
		check('campaign_editor_credentials_version_check', sql`${table.accessVersion} >= 1`)
	]
);

export const accessSessions = sqliteTable(
	'access_sessions',
	{
		id: id(),
		tokenHash: text('token_hash').notNull(),
		isOwner: integer('is_owner', { mode: 'boolean' }).notNull().default(false),
		expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
		createdAt: createdAt()
	},
	(table) => [
		uniqueIndex('access_sessions_token_hash_unique').on(table.tokenHash),
		index('access_sessions_expires_at_idx').on(table.expiresAt)
	]
);

export const campaignAccessGrants = sqliteTable(
	'campaign_access_grants',
	{
		id: id(),
		accessSessionId: text('access_session_id')
			.notNull()
			.references(() => accessSessions.id, { onDelete: 'cascade' }),
		campaignId: text('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		accessVersion: integer('access_version').notNull(),
		createdAt: createdAt()
	},
	(table) => [
		uniqueIndex('campaign_access_grants_session_campaign_unique').on(
			table.accessSessionId,
			table.campaignId
		),
		index('campaign_access_grants_campaign_idx').on(table.campaignId),
		check('campaign_access_grants_version_check', sql`${table.accessVersion} >= 1`)
	]
);

export const campaignEditorGrants = sqliteTable(
	'campaign_editor_grants',
	{
		id: id(),
		accessSessionId: text('access_session_id')
			.notNull()
			.references(() => accessSessions.id, { onDelete: 'cascade' }),
		editorCredentialId: text('editor_credential_id')
			.notNull()
			.references(() => campaignEditorCredentials.id, { onDelete: 'cascade' }),
		accessVersion: integer('access_version').notNull(),
		createdAt: createdAt()
	},
	(table) => [
		uniqueIndex('campaign_editor_grants_session_credential_unique').on(
			table.accessSessionId,
			table.editorCredentialId
		),
		index('campaign_editor_grants_credential_idx').on(table.editorCredentialId),
		check('campaign_editor_grants_version_check', sql`${table.accessVersion} >= 1`)
	]
);

export const sessions = sqliteTable(
	'sessions',
	{
		id: id(),
		campaignId: text('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		sessionNumber: integer('session_number').notNull(),
		title: text('title').notNull(),
		sessionDate: integer('session_date', { mode: 'timestamp' }),
		rawNotes: text('raw_notes').notNull().default(''),
		summary: text('summary').notNull().default(''),
		status: text('status', { enum: sessionStatuses }).notNull().default('draft'),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [
		uniqueIndex('sessions_campaign_number_unique').on(table.campaignId, table.sessionNumber),
		index('sessions_campaign_date_idx').on(table.campaignId, table.sessionDate),
		check('sessions_status_check', sql`${table.status} in ('draft', 'published')`)
	]
);

export const entities = sqliteTable(
	'entities',
	{
		id: id(),
		campaignId: text('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		type: text('type', { enum: entityTypes }).notNull(),
		name: text('name').notNull(),
		slug: text('slug').notNull(),
		summary: text('summary').notNull().default(''),
		content: text('content').notNull().default(''),
		firstSessionId: text('first_session_id').references(() => sessions.id, {
			onDelete: 'set null'
		}),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [
		uniqueIndex('entities_campaign_slug_unique').on(table.campaignId, table.slug),
		index('entities_campaign_type_name_idx').on(table.campaignId, table.type, table.name),
		check(
			'entities_type_check',
			sql`${table.type} in ('character', 'npc', 'location', 'faction', 'item', 'quest', 'other')`
		)
	]
);

export const campaignMaps = sqliteTable(
	'campaign_maps',
	{
		id: id(),
		campaignId: text('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		name: text('name').notNull().default('Regional map'),
		objectKey: text('object_key').notNull(),
		originalFilename: text('original_filename').notNull(),
		contentType: text('content_type').notNull(),
		sizeBytes: integer('size_bytes').notNull(),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [
		index('campaign_maps_campaign_idx').on(table.campaignId),
		uniqueIndex('campaign_maps_object_key_unique').on(table.objectKey),
		check('campaign_maps_size_check', sql`${table.sizeBytes} > 0`)
	]
);

export const mapMarkers = sqliteTable(
	'map_markers',
	{
		id: id(),
		mapId: text('map_id')
			.notNull()
			.references(() => campaignMaps.id, { onDelete: 'cascade' }),
		entityId: text('entity_id')
			.notNull()
			.references(() => entities.id, { onDelete: 'cascade' }),
		positionX: integer('position_x').notNull(),
		positionY: integer('position_y').notNull(),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [
		uniqueIndex('map_markers_map_entity_unique').on(table.mapId, table.entityId),
		index('map_markers_entity_idx').on(table.entityId),
		check(
			'map_markers_position_x_check',
			sql`${table.positionX} >= 0 and ${table.positionX} <= 10000`
		),
		check(
			'map_markers_position_y_check',
			sql`${table.positionY} >= 0 and ${table.positionY} <= 10000`
		)
	]
);

export const entityAliases = sqliteTable(
	'entity_aliases',
	{
		id: id(),
		entityId: text('entity_id')
			.notNull()
			.references(() => entities.id, { onDelete: 'cascade' }),
		alias: text('alias').notNull(),
		normalizedAlias: text('normalized_alias').notNull()
	},
	(table) => [
		uniqueIndex('entity_aliases_entity_normalized_unique').on(
			table.entityId,
			table.normalizedAlias
		),
		index('entity_aliases_normalized_idx').on(table.normalizedAlias)
	]
);

export const mentions = sqliteTable(
	'mentions',
	{
		id: id(),
		sessionId: text('session_id')
			.notNull()
			.references(() => sessions.id, { onDelete: 'cascade' }),
		entityId: text('entity_id')
			.notNull()
			.references(() => entities.id, { onDelete: 'cascade' }),
		context: text('context').notNull().default(''),
		createdAt: createdAt()
	},
	(table) => [
		uniqueIndex('mentions_session_entity_unique').on(table.sessionId, table.entityId),
		index('mentions_entity_idx').on(table.entityId)
	]
);

export const relationships = sqliteTable(
	'relationships',
	{
		id: id(),
		campaignId: text('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		sourceEntityId: text('source_entity_id')
			.notNull()
			.references(() => entities.id, { onDelete: 'cascade' }),
		targetEntityId: text('target_entity_id')
			.notNull()
			.references(() => entities.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		description: text('description').notNull().default(''),
		sessionId: text('session_id').references(() => sessions.id, { onDelete: 'set null' }),
		createdAt: createdAt(),
		updatedAt: updatedAt()
	},
	(table) => [
		index('relationships_campaign_idx').on(table.campaignId),
		index('relationships_source_idx').on(table.sourceEntityId),
		index('relationships_target_idx').on(table.targetEntityId),
		check('relationships_not_self_check', sql`${table.sourceEntityId} <> ${table.targetEntityId}`)
	]
);

export const noteImports = sqliteTable(
	'note_imports',
	{
		id: id(),
		campaignId: text('campaign_id')
			.notNull()
			.references(() => campaigns.id, { onDelete: 'cascade' }),
		sessionId: text('session_id').references(() => sessions.id, { onDelete: 'set null' }),
		rawNotes: text('raw_notes').notNull(),
		proposedChanges: text('proposed_changes', { mode: 'json' }).$type<Record<
			string,
			unknown
		> | null>(),
		status: text('status', { enum: importStatuses }).notNull().default('pending'),
		model: text('model'),
		errorMessage: text('error_message'),
		createdAt: createdAt(),
		reviewedAt: integer('reviewed_at', { mode: 'timestamp' })
	},
	(table) => [
		index('note_imports_campaign_status_idx').on(table.campaignId, table.status),
		check(
			'note_imports_status_check',
			sql`${table.status} in ('pending', 'approved', 'rejected', 'failed')`
		)
	]
);

export const entityRevisions = sqliteTable(
	'entity_revisions',
	{
		id: id(),
		entityId: text('entity_id')
			.notNull()
			.references(() => entities.id, { onDelete: 'cascade' }),
		sessionId: text('session_id').references(() => sessions.id, { onDelete: 'set null' }),
		summary: text('summary').notNull().default(''),
		content: text('content').notNull(),
		changeReason: text('change_reason').notNull().default(''),
		createdAt: createdAt()
	},
	(table) => [index('entity_revisions_entity_created_idx').on(table.entityId, table.createdAt)]
);
