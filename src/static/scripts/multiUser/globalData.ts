import {deepClone} from "../utils/utils";
import {photonWebVersion} from "../utils/version";
import {FabPreset, initialDefaultFabPresets} from "../components/photon/fab/fabElementConfig";
import DataAccessor from "./dataAccessor";
import {setInStorage, wasDbUpgraded} from "./storageWrapper";
import {defaultSettings, PhotonSettings} from "../components/global/photonSettings/settingsConfig";

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
		seenPosts: {},
		pageBeforeLogin: null,
		loginCode: null,
		colorContrastCache: {},
		redgifsAuth: {
			token: null,
			expiration: -1
		}
	}

	async init(): Promise<this> {
		await super.init();

		if (wasDbUpgraded.wasUpgraded) {
			this.tryMigrateFromLsToLoaded(["clientIdData", "id"], ["analytics", "clientId"], false);
			this.tryMigrateFromLsToLoaded(["clientIdData", "lastSetMillisUtc"], ["analytics", "idInitTime"]);
			this.tryMigrateFromLsToLoaded(["lastReportMs"], ["analytics", "lastReportAt"]);
			this.tryMigrateFromLsToLoaded(["fabConfig"], ["fabConfig"]);
			this.tryMigrateFromLsToLoaded(["firefoxPrivateModeCheck"], ["firefoxPrivateCheckCompleted"]);
			this.tryMigrateFromLsToLoaded(["firstTimeFlag"], ["isFirstTimeVisit"], true, val => val !== "set");
			this.tryMigrateFromLsToLoaded(["hasCompletedTutorial"], ["hasAcknowledgedTutorial"]);
			this.tryMigrateFromLsToLoaded(["isHeaderPinned"], ["isHeaderPinned"]);
			this.tryMigrateFromLsToLoaded(["seenPosts"], ["seenPosts"]);
			this.tryMigrateFromLsToLoaded(["settings"], ["photonSettings"]);
			this.tryMigrateFromLsToLoaded(["version"], ["photonVersion"]);
			if (wasDbUpgraded.fromVersion === 1 && wasDbUpgraded.toVersion > 1) {
				this.loaded.colorContrastCache = {};
			}
			await setInStorage(this.loaded, this.key);
		}

		await this.set(["photonSettings"], {
			...defaultSettings,
			...this.d.photonSettings
		});

		return this;
	}

	hasPostsBeenSeen(postFullName: string): boolean {
		return postFullName in this.d.seenPosts
	}

	async markPostAsSeen(postFullName: string) {
		await this.set(["seenPosts", postFullName], Math.floor(Date.now() / 1000));
	}

	async unmarkPostAsSeen(postFullName: string) {
		delete this.loaded.seenPosts[postFullName];
		await this.set(["seenPosts"], this.loaded.seenPosts);
	}

	async clearSeenPosts() {
		await this.set(["seenPosts"], {});
	}
}

/**
 * This data is globally applied to all users
 */
interface _GlobalData {
	/** Floating action button user configuration */
	fabConfig: FabPreset[];
	/** Photon Settings */
	photonSettings: PhotonSettings;
	/** All posts the user has seen/scrolled past */
	seenPosts: SeenPosts;
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
	pageBeforeLogin: string;
	loginCode: string;
	/** Maps a `background,foreground` color pair to a new pair with better contrast */
	colorContrastCache: { [key: string]: [[number, number, number], [number, number, number]] },
	redgifsAuth: RedgifsAuthData;
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

export interface RedgifsAuthData {
	token: string;
	expiration: number;
}
