import { initiateLogin } from "../../../auth/loginHandler";
import { pushLinkToHistoryComb } from "../../../historyState/historyStateManager";
import ViewsStack from "../../../historyState/viewsStack";
import { isLoggedIn, thisUser } from "../../../utils/globals";
import { isFakeSubreddit } from "../../../utils/utils";
import Ph_Toast, { Level } from "../../misc/toast/toast";

export interface FabPreset {
	action: FabAction,
	icon: FabIcon,
	presetName: string,
	names: string[]
}
export interface FabAction {
	type: "url" | "function",
	action: string,
	names: string[]
}
export interface FabIcon {
	url: string,
	names: string[]
}

export const FunctionActions: { [actionName: string]: () => any } = {
	"Submit": () => {
		const subreddit = history.state.url.match(/^\/r\/([^/?#]+)/)?.[1];
		pushLinkToHistoryComb(subreddit && !isFakeSubreddit(subreddit) ? `/r/${subreddit}/submit` : "/submit");
	},
	"Unload Pages": () => ViewsStack.clear(),
	"My Profile": () => {
		if (!isLoggedIn) {
			new Ph_Toast(Level.error, "Not logged in! Do you want to log in with Reddit?", { onConfirm: () => initiateLogin(), groupId: "not logged in" });
			return;
		}
		pushLinkToHistoryComb(`/user/${thisUser.name}`);
	},
	"": () => void new Ph_Toast(Level.info, "No action assigned", { timeout: 2000, groupId: "fab elem no action" })
}
