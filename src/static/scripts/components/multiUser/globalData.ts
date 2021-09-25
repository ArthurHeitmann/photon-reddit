import { deepClone } from "../../utils/utils";
import { photonWebVersion } from "../../utils/version";
import { defaultSettings, PhotonSettings } from "../global/photonSettings/photonSettings";
import { FabPreset, initialDefaultFabPresets } from "../photon/fab/fabElementConfig";
import DataAccessor from "./dataAccessor";
import { setInStorage, wasDbUpgraded } from "./storageWrapper";

const globalUserName = "#global";

export default class GlobalUserData extends DataAccessor<_GlobalData> {
	protected key: string = globalUserName;
	protected default: _GlobalData = {
		analytics: {
			clientId: null,
			idInitTime: -1,
			lastReportAt: -1
		},
		fabConfig: deepClone(initialDefaultFabPresets),
		firefoxPrivateCheckCompleted: false,
		isFirstTimeVisit: true,
		isHeaderPinned: false,
		lastActiveUser: null,
		hasAcknowledgedTutorial: false,
		photonSettings: deepClone(defaultSettings),
		photonVersion: photonWebVersion,
		seenPosts: {}
	}

	async init(): Promise<this> {
		await super.init();
		if (wasDbUpgraded.wasUpgraded) {
			this.tryMigrateFromLsToLoaded(["clientIdData", "id"], ["analytics", "clientId"]);
			this.tryMigrateFromLsToLoaded(["clientIdData", "lastSetMillisUtc"], ["analytics", "idInitTime"]);
			this.tryMigrateFromLsToLoaded(["lastReportMs"], ["analytics", "lastReportAt"]);
			this.tryMigrateFromLsToLoaded(["fabConfig"], ["fabConfig"]);
			this.tryMigrateFromLsToLoaded(["firefoxPrivateModeCheck"], ["firefoxPrivateCheckCompleted"]);
			this.tryMigrateFromLsToLoaded(["firstTimeFlag"], ["isFirstTimeVisit"], val => val !== "set");
			this.tryMigrateFromLsToLoaded(["hasCompletedTutorial"], ["hasAcknowledgedTutorial"]);
			this.tryMigrateFromLsToLoaded(["isHeaderPinned"], ["isHeaderPinned"]);
			this.tryMigrateFromLsToLoaded(["seenPosts"], ["seenPosts"]);
			this.tryMigrateFromLsToLoaded(["settings"], ["photonSettings"]);
			this.tryMigrateFromLsToLoaded(["version"], ["photonVersion"]);
			await setInStorage(this.loaded, this.key);
		}
		return this;
	}

}

/**
 * By default these settings are global. But a user can decide to individually configure them for their account.
 */
export interface _GlobalOrUserData {
	/** Floating action button user configuration */
	fabConfig: FabPreset[];
	/** Photon Settings */
	photonSettings: PhotonSettings;
	/** All posts the user has seen/scrolled past */
	seenPosts: SeenPosts;
}

/**
 * This data is globally applied to all users
 */
interface _GlobalData extends _GlobalOrUserData {
	// always global
	/** Name of last active user (for all logged in users) */
	lastActiveUser: string;
	/** Information about analytics */
	analytics: AnalyticsData;
	/** Last updated app version */
	photonVersion: string;
	/** Is header pinned */
	isHeaderPinned: boolean;
	/** Only true when visiting website for the first time */
	isFirstTimeVisit: boolean;
	hasAcknowledgedTutorial: boolean;
	/** When visiting for the first time, a test is needed to know if firefox is used in private mode */
	firefoxPrivateCheckCompleted: boolean;
}

export interface AnalyticsData {
	/** Identifier for this browser, resets regularly */
	clientId: string,
	/** When was the client id set */
	idInitTime: number,
	/** Last time in ms UTC when a report of browser features was sent */
	lastReportAt: number
}

export interface SeenPosts {
	[fullName: string]: number
}
