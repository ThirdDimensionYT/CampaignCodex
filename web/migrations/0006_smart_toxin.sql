CREATE TABLE `armoury_checkouts` (
	`item_entity_id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`character_entity_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`item_entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `armoury_checkouts_campaign_idx` ON `armoury_checkouts` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `armoury_checkouts_character_idx` ON `armoury_checkouts` (`character_entity_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`kind` text DEFAULT 'campaign' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "campaigns_kind_check" CHECK("__new_campaigns"."kind" in ('campaign', 'armoury'))
);
--> statement-breakpoint
INSERT INTO `__new_campaigns`("id", "name", "slug", "description", "created_at", "updated_at") SELECT "id", "name", "slug", "description", "created_at", "updated_at" FROM `campaigns`;--> statement-breakpoint
DROP TABLE `campaigns`;--> statement-breakpoint
ALTER TABLE `__new_campaigns` RENAME TO `campaigns`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `campaigns_slug_unique` ON `campaigns` (`slug`);
