PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_entities` (
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
	CONSTRAINT "entities_type_check" CHECK("__new_entities"."type" in ('character', 'npc', 'location', 'faction', 'item', 'quest', 'other')),
	CONSTRAINT "entities_visibility_check" CHECK("__new_entities"."visibility" in ('players', 'dm'))
);
--> statement-breakpoint
INSERT INTO `__new_entities`("id", "campaign_id", "type", "name", "slug", "summary", "content", "visibility", "first_session_id", "created_at", "updated_at") SELECT "id", "campaign_id", "type", "name", "slug", "summary", "content", "visibility", "first_session_id", "created_at", "updated_at" FROM `entities`;--> statement-breakpoint
DROP TABLE `entities`;--> statement-breakpoint
ALTER TABLE `__new_entities` RENAME TO `entities`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `entities_campaign_slug_unique` ON `entities` (`campaign_id`,`slug`);--> statement-breakpoint
CREATE INDEX `entities_campaign_type_name_idx` ON `entities` (`campaign_id`,`type`,`name`);