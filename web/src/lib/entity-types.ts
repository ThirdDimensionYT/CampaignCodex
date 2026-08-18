const entityTypeLabels: Record<string, string> = {
	character: 'Player Character',
	npc: 'NPC',
	location: 'Location',
	faction: 'Faction',
	item: 'Item',
	quest: 'Quest',
	other: 'Other'
};

export function getEntityTypeLabel(type: string): string {
	return entityTypeLabels[type] ?? type;
}
