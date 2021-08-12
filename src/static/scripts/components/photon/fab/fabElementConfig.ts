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

export const defaultFabActions: FabAction[] = [
	{ type: "function", action: "", names: ["Nothing"] },
	{ type: "url", action: "#", names: ["Custom"] },
	{ type: "url", action: "/", names: ["Frontpage", "home", "start"] },
	{ type: "url", action: "/r/all", names: ["r/all", "all"] },
	{ type: "url", action: "/r/popular", names: ["r/popular", "popular"] },
	{ type: "url", action: "/message/inbox", names: ["Inbox", "messages", "chat"] },
	{ type: "function", action: "My Profile", names: ["My Profile", "my", "me", "profile", "user"] },
	{ type: "function", action: "Submit", names: ["Submit Post", "post", "submit", "new", "write"] },
	{ type: "url", action: "/message/compose", names: ["Compose Message", "message", "new", "compose", "chat"] },
	{ type: "function", action: "Unload Pages", names: ["Unload Pages", "remove", "delete", "cross", "x", "pages"] },
];

export const defaultFabIcons: FabIcon[] = [
	{ url: "/img/transparent.svg", names: ["Nothing", "empty", "base", "blank", "circle", "ring"] },
	{ url: "/img/circle.svg", names: ["Nothing", "empty", "base", "blank", "circle", "ring"] },
	{ url: "/img/bookOpen.svg", names: ["Frontpage", "book", "home", "start"] },
	{ url: "/img/earth.svg", names: ["all", "earth"] },
	{ url: "/img/trendUp.svg", names: ["popular", "arrow", "up"] },
	{ url: "/img/envelope.svg", names: ["Inbox", "messages", "chat", "envelope"] },
	{ url: "/img/user.svg", names: ["Profile", "my", "me", "profile", "user"] },
	{ url: "/img/edit.svg", names: ["Submit", "write", "edit", "pen"] },
	{ url: "/img/writeMessage.svg", names: ["Submit", "write", "edit", "pen", "message", "chat"] },
	{ url: "/img/close.svg", names: ["Unload", "unload", "remove", "delete", "cross", "x", "pages"] },
	{ url: "/img/rSlash.svg", names: ["subreddit"] },
	{ url: "/img/18+.svg", names: ["18+", "nsfw"] },
	{ url: "/img/award.svg", names: ["award", "gold"] },
	{ url: "/img/bookmarkEmpty.svg", names: ["bookmark", "saved"] },
	{ url: "/img/bookmarkFilled.svg", names: ["bookmark", "saved"] },
	{ url: "/img/cake.svg", names: ["cake"] },
	{ url: "/img/chat.svg", names: ["chat", "messages", "inbox"] },
	{ url: "/img/circleFilled.svg", names: ["circle", "filled"] },
	{ url: "/img/add.svg", names: ["add", "new"] },
	{ url: "/img/comments.svg", names: ["comment", "thread"] },
	{ url: "/img/commentEmpty.svg", names: ["comment", "thread"] },
	{ url: "/img/delete.svg", names: ["delete", "remove", "trash"] },
	{ url: "/img/error.svg", names: ["error", "cross", "failed"] },
	{ url: "/img/fileImage.svg", names: ["image", "img", "picture"] },
	{ url: "/img/fileVideo.svg", names: ["video", "movie"] },
	{ url: "/img/filters.svg", names: ["filters"] },
	{ url: "/img/hd.svg", names: ["hd"] },
	{ url: "/img/history.svg", names: ["history", "time", "old"] },
	{ url: "/img/hot.svg", names: ["hot", "fire", "flame"] },
	{ url: "/img/info.svg", names: ["info", "about"] },
	{ url: "/img/lightning.svg", names: ["lightning", "controversial"] },
	{ url: "/img/locked.svg", names: ["locked", "archived"] },
	{ url: "/img/logo.png", names: ["logo", "home", "start"] },
	{ url: "/img/new.svg", names: ["new", "fresh"] },
	{ url: "/img/notification.svg", names: ["notification", "bell"] },
	{ url: "/img/pin.svg", names: ["pinned"] },
	{ url: "/img/qa.svg", names: ["qa", "q&a", "q & a", "questions", "answers"] },
	{ url: "/img/rocket.svg", names: ["rocket", "best"] },
	{ url: "/img/settings1.svg", names: ["settings", "options"] },
	{ url: "/img/settings2.svg", names: ["settings", "options"] },
	{ url: "/img/success.svg", names: ["success", "good", "confirmation"] },
	{ url: "/img/swap.svg", names: ["swap", "switch", "arrows"] },
	{ url: "/img/tag.svg", names: ["tags", "flairs"] },
	{ url: "/img/text.svg", names: ["text", "letters"] },
	{ url: "/img/top.svg", names: ["top"] },
	{ url: "/img/warning.svg", names: ["warning"] },
];

export const defaultFabPresets: FabPreset[] = [
	{ action: defaultFabActions[0], icon: defaultFabIcons[0], presetName: "Nothing", names: ["Nothing", "empty", "blank"] },
	{ action: defaultFabActions[1], icon: defaultFabIcons[1], presetName: "Custom", names: ["Custom"] },
	{ action: defaultFabActions[2], icon: defaultFabIcons[2], presetName: "Frontpage", names: ["Frontpage", "home", "start"] },
	{ action: defaultFabActions[3], icon: defaultFabIcons[3], presetName: "r/all", names: ["all"] },
	{ action: defaultFabActions[4], icon: defaultFabIcons[4], presetName: "r/popular", names: ["popular"] },
	{ action: defaultFabActions[5], icon: defaultFabIcons[5], presetName: "Inbox", names: ["Inbox", "messages", "chat"] },
	{ action: defaultFabActions[6], icon: defaultFabIcons[6], presetName: "My Profile", names: ["My Profile", "my", "me", "profile", "user"] },
	{ action: defaultFabActions[7], icon: defaultFabIcons[7], presetName: "New Post", names: ["Post", "submit", "new", "write"] },
	{ action: defaultFabActions[8], icon: defaultFabIcons[8], presetName: "New Message", names: ["Compose Message", "message", "new", "compose", "chat"] },
	{ action: defaultFabActions[9], icon: defaultFabIcons[9], presetName: "Unload Pages", names: ["Unload", "remove", "delete", "cross", "x", "pages"] },
];