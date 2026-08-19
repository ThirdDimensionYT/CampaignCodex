CREATE TABLE `access_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`is_owner` integer DEFAULT false NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `access_sessions_token_hash_unique` ON `access_sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `access_sessions_expires_at_idx` ON `access_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `campaign_access_credentials` (
	`campaign_id` text PRIMARY KEY NOT NULL,
	`passphrase_hash` text NOT NULL,
	`passphrase_salt` text NOT NULL,
	`access_version` integer DEFAULT 1 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "campaign_access_version_check" CHECK("campaign_access_credentials"."access_version" >= 1)
);
--> statement-breakpoint
CREATE TABLE `campaign_access_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`access_session_id` text NOT NULL,
	`campaign_id` text NOT NULL,
	`access_version` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`access_session_id`) REFERENCES `access_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "campaign_access_grants_version_check" CHECK("campaign_access_grants"."access_version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaign_access_grants_session_campaign_unique` ON `campaign_access_grants` (`access_session_id`,`campaign_id`);--> statement-breakpoint
CREATE INDEX `campaign_access_grants_campaign_idx` ON `campaign_access_grants` (`campaign_id`);