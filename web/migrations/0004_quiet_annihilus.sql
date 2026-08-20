CREATE TABLE `campaign_editor_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`label` text NOT NULL,
	`normalized_label` text NOT NULL,
	`passphrase_hash` text NOT NULL,
	`passphrase_salt` text NOT NULL,
	`access_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "campaign_editor_credentials_version_check" CHECK("campaign_editor_credentials"."access_version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaign_editor_credentials_campaign_label_unique` ON `campaign_editor_credentials` (`campaign_id`,`normalized_label`);--> statement-breakpoint
CREATE INDEX `campaign_editor_credentials_campaign_idx` ON `campaign_editor_credentials` (`campaign_id`);--> statement-breakpoint
CREATE TABLE `campaign_editor_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`access_session_id` text NOT NULL,
	`editor_credential_id` text NOT NULL,
	`access_version` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`access_session_id`) REFERENCES `access_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`editor_credential_id`) REFERENCES `campaign_editor_credentials`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "campaign_editor_grants_version_check" CHECK("campaign_editor_grants"."access_version" >= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaign_editor_grants_session_credential_unique` ON `campaign_editor_grants` (`access_session_id`,`editor_credential_id`);--> statement-breakpoint
CREATE INDEX `campaign_editor_grants_credential_idx` ON `campaign_editor_grants` (`editor_credential_id`);