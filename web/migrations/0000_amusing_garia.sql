CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaigns_slug_unique` ON `campaigns` (`slug`);--> statement-breakpoint
CREATE TABLE `entities` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`visibility` text DEFAULT 'players' NOT NULL,
	`first_session_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`first_session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "entities_type_check" CHECK("entities"."type" in ('character', 'location', 'faction', 'item', 'quest', 'other')),
	CONSTRAINT "entities_visibility_check" CHECK("entities"."visibility" in ('players', 'dm'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entities_campaign_slug_unique` ON `entities` (`campaign_id`,`slug`);--> statement-breakpoint
CREATE INDEX `entities_campaign_type_name_idx` ON `entities` (`campaign_id`,`type`,`name`);--> statement-breakpoint
CREATE TABLE `entity_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`alias` text NOT NULL,
	`normalized_alias` text NOT NULL,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entity_aliases_entity_normalized_unique` ON `entity_aliases` (`entity_id`,`normalized_alias`);--> statement-breakpoint
CREATE INDEX `entity_aliases_normalized_idx` ON `entity_aliases` (`normalized_alias`);--> statement-breakpoint
CREATE TABLE `entity_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`session_id` text,
	`summary` text DEFAULT '' NOT NULL,
	`content` text NOT NULL,
	`change_reason` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `entity_revisions_entity_created_idx` ON `entity_revisions` (`entity_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `mentions` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`entity_id` text NOT NULL,
	`context` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mentions_session_entity_unique` ON `mentions` (`session_id`,`entity_id`);--> statement-breakpoint
CREATE INDEX `mentions_entity_idx` ON `mentions` (`entity_id`);--> statement-breakpoint
CREATE TABLE `note_imports` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`session_id` text,
	`raw_notes` text NOT NULL,
	`proposed_changes` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`model` text,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "note_imports_status_check" CHECK("note_imports"."status" in ('pending', 'approved', 'rejected', 'failed'))
);
--> statement-breakpoint
CREATE INDEX `note_imports_campaign_status_idx` ON `note_imports` (`campaign_id`,`status`);--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`source_entity_id` text NOT NULL,
	`target_entity_id` text NOT NULL,
	`type` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`session_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "relationships_not_self_check" CHECK("relationships"."source_entity_id" <> "relationships"."target_entity_id")
);
--> statement-breakpoint
CREATE INDEX `relationships_campaign_idx` ON `relationships` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `relationships_source_idx` ON `relationships` (`source_entity_id`);--> statement-breakpoint
CREATE INDEX `relationships_target_idx` ON `relationships` (`target_entity_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`session_number` integer NOT NULL,
	`title` text NOT NULL,
	`session_date` integer,
	`raw_notes` text DEFAULT '' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "sessions_status_check" CHECK("sessions"."status" in ('draft', 'published'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_campaign_number_unique` ON `sessions` (`campaign_id`,`session_number`);--> statement-breakpoint
CREATE INDEX `sessions_campaign_date_idx` ON `sessions` (`campaign_id`,`session_date`);