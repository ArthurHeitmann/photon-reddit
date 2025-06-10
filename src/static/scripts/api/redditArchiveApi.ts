import {RedditCommentData, RedditCommentObj, RedditListingObj, RedditPostData, RedditSubredditObj, SubredditDetails} from "../types/redditTypes";
import {parseMarkdown} from "../lib/markdownForReddit/markdown-for-reddit";
import {isCommentDeleted} from "../utils/utils";
import Ph_Toast, {Level} from "../components/misc/toast/toast";
import {redditInfo} from "./redditApi";
import { onApiUsage } from "./redditApiUsageTracking";
import Users from "../multiUser/userManagement";

interface ArcticShiftResponse<T> {
	data: T;
	error?: any;
}

export async function getCommentTreeFromArchive(commentData: RedditCommentData): Promise<RedditCommentData> {
	// steps:
	// 1. get comment tree
	// 2. update with latest scores from reddit api
	// 3. sort replies by score

	const response = await fetch(`https://arctic-shift.photon-reddit.com/api/comments/tree?link_id=${commentData.link_id}&parent_id=${commentData.id}&limit=20&md2html=true`);
	const treeRes = await response.json() as ArcticShiftResponse<RedditCommentObj[]>;
	onApiUsage("/api/comments/tree", "arctic_shift", false);
	if (!treeRes.data || treeRes.data.length === 0) {
		handleMeta(treeRes["meta"], false);
		return null;
	}
	const tree = treeRes.data;
	const flatCommentsMap: { [id: string]: RedditCommentData } = {};
	flattenCommentTree(tree, flatCommentsMap);
	const flatComments = Object.values(flatCommentsMap);
	markedDeletedComments(flatComments);
	const commentFullNames = flatComments.map(comment => comment.name);
	while (commentFullNames.length > 0) {
		const fullNames = commentFullNames.splice(0, 100);
		const response = await redditInfo({ fullNames }) as RedditListingObj<RedditCommentObj>;
		for (const newComment of response.data.children) {
			const archivedComment = flatCommentsMap[newComment.data.name];
			archivedComment.score = newComment.data.score;
			archivedComment.ups = newComment.data.score;
		}
	}

	sortReplies(tree.map(comment => comment.data as RedditCommentData));

	handleMeta(treeRes["meta"], Boolean(tree[0]?.data));
	return tree[0]?.data as RedditCommentData;
}

export async function getPostFromArchive(id: string): Promise<RedditPostData> {
	const response = await fetch(`https://arctic-shift.photon-reddit.com/api/posts/ids?ids=${id}`);
	onApiUsage("/api/posts/ids", "arctic_shift", false);
	const dataRes = await response.json() as ArcticShiftResponse<RedditPostData[]>;
	if (!dataRes.data || dataRes.data.length === 0) {
		handleMeta(dataRes["meta"], false);
		return null;
	}
	const data = dataRes.data;
	const postData = data[0] as RedditPostData;
	if (["[deleted]", "[removed]"].includes(postData.selftext))
		postData.selftext += " (not found)";
	else
		postData.selftext += "\n\n*^(Archived version)*";
	postData.selftext_html = `<div class="md">${parseMarkdown(postData.selftext, postData)}</div>`;
	handleMeta(dataRes["meta"], Boolean(postData));
	return postData;
}

function handleMeta(meta: object|undefined, hasResult: boolean) {
	if (!meta)
		return;
	if (meta["user_message_status"])
		new Ph_Toast(Level.info, meta["user_message_status"], { groupId: "archive_user_message_info" });
	if (meta["user_message_on_error"] && !hasResult)
		new Ph_Toast(Level.error, meta["user_message_on_error"], { groupId: "archive_user_message_error" });
}

function markedDeletedComments(comments: RedditCommentData[]): void {
	for (const comment of comments) {
		if (!isCommentDeleted(comment))
			continue;
		comment.body += "  \n\n*^(deleted before archiving)*";
		comment.body_html = `<div class="md">${parseMarkdown(comment.body)}</div>`;
	}
}

function flattenCommentTree(comments: RedditCommentObj[], flatCommentsMap: { [id: string]: RedditCommentData }): void {
	for (const comment of comments) {
		flatCommentsMap[comment.data.name] = comment.data as RedditCommentData;
		if ((<RedditListingObj<RedditCommentObj>> comment.data.replies)?.data?.children)
			flattenCommentTree(
				(<RedditListingObj<RedditCommentObj>> comment.data.replies).data.children,
				flatCommentsMap
			);
	}
}

function sortReplies(comments: RedditCommentData[]): RedditCommentData[] {
	for (const comment of comments) {
		if (comment.replies?.data?.children)
			sortReplies(comment.replies.data.children.map(reply => reply.data as RedditCommentData));
	}
	return  comments.sort((a, b) => {
		const aDeleted = isCommentDeleted(a);
		const bDeleted = isCommentDeleted(b);
		if (aDeleted !== bDeleted)
			return aDeleted ? 1 : -1;
		if (a.score === b.score)
			return a.created - b.created;
		return b.score - a.score;
	});
}

export async function searchSubredditsArcticShift(prefix: string, limit = 5): Promise<RedditListingObj<RedditSubredditObj>> {
	const params = new URLSearchParams();
	params.set("subreddit_prefix", prefix);
	params.set("sort_type", "subscribers");
	params.set("sort", "desc");
	params.set("limit", String(limit));
	if (!Users.current.d.redditPreferences.search_include_over_18)
		params.set("over18", "false");
	const response = await fetch(`https://arctic-shift.photon-reddit.com/api/subreddits/search?${params}`);
	const data = await response.json() as ArcticShiftResponse<SubredditDetails[]>;
	if (!data.data || data.error) {
		console.error(data.error);
		throw new Error("Error fetching subreddits");
	}
	return {
		kind: "Listing",
		data: {
			dist: data.data.length,
			children: data.data.map(sub => ({
				kind: "t5",
				data: sub
			})),
			before: null,
			after: null
		}
	};
}

export async function resolveShortLinkArcticShift(shortLink: string): Promise<string> {
	const response = await fetch(`https://arctic-shift.photon-reddit.com/api/short_links?paths=${shortLink}`);
	const data = await response.json() as ArcticShiftResponse<{ resolved_path: string }[]>;
	if (!data.data || data.error) {
		console.error(data.error);
		throw new Error("Error resolving short link");
	}
	return data.data[0]?.resolved_path ?? "";
}
