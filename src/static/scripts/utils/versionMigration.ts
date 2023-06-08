import VersionNumber from "./versionNumber";
import Users from "../multiUser/userManagement";

export async function doVersionMigration(previousVersion: VersionNumber, currentVersion: VersionNumber): Promise<void> {
	for (const migration of migrations) {
		if (migration.version.greaterThan(previousVersion) && migration.version.lessThanEqual(currentVersion))
			await migration.migrate();
	}
}

const migrations: { version: VersionNumber, migrate: () => Promise<void> }[] = [
	{ version: new VersionNumber("1.1.22"), migrate: migrateTo_1_1_22 },
];

/**
 * Disable message checking
 */
async function migrateTo_1_1_22(): Promise<void> {
	console.log("Migrating to 1.1.22");
	console.log(" - Disabling message checking");
	await Users.global.set(["photonSettings", "messageCheckIntervalMs"], 0);
}
