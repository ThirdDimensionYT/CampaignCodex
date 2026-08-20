CREATE TABLE `campaign_maps` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`name` text DEFAULT 'Regional map' NOT NULL,
	`object_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "campaign_maps_size_check" CHECK("campaign_maps"."size_bytes" > 0)
);
--> statement-breakpoint
CREATE INDEX `campaign_maps_campaign_idx` ON `campaign_maps` (`campaign_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `campaign_maps_object_key_unique` ON `campaign_maps` (`object_key`);--> statement-breakpoint
CREATE TABLE `map_markers` (
	`id` text PRIMARY KEY NOT NULL,
	`map_id` text NOT NULL,
	`entity_id` text NOT NULL,
	`position_x` integer NOT NULL,
	`position_y` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`map_id`) REFERENCES `campaign_maps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "map_markers_position_x_check" CHECK("map_markers"."position_x" >= 0 and "map_markers"."position_x" <= 10000),
	CONSTRAINT "map_markers_position_y_check" CHECK("map_markers"."position_y" >= 0 and "map_markers"."position_y" <= 10000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `map_markers_map_entity_unique` ON `map_markers` (`map_id`,`entity_id`);--> statement-breakpoint
CREATE INDEX `map_markers_entity_idx` ON `map_markers` (`entity_id`);