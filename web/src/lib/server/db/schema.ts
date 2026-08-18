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
export const visibilityLevels = ['players', 'dm'] as const;
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
		visibility: text('visibility', { enum: visibilityLevels }).notNull().default('players'),
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
		),
		check('entities_visibility_check', sql`${table.visibility} in ('players', 'dm')`)
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
