import { PhotonSettings } from "../global/photonSettings/photonSettings";
import { FabPreset } from "../photon/fab/fabElementConfig";
import DataAccessor from "./dataAccessor";

export default class GlobalUserData extends DataAccessor<GlobalUserData> {
	prefix: string = "#global";

}

interface _GlobalUserData {
	// always global
	analytics: AnalyticsData;
	photonVersion: string;
	isHeaderPinned: boolean;
	isFirstTimeVisit: boolean;
	loginSubPromptDisplayed: boolean;
	firefoxPrivateCheckCompleted: boolean;
	// user or global fallback
	fabConfig: FabPreset;
	photonSettings: PhotonSettings;
	seenPosts: SeenPosts;
}

export interface AnalyticsData {
	clientId: string,
	lastReportAt: number
}

export interface SeenPosts {
	[fullName: string]: number
}
