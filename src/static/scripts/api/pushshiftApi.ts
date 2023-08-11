import {RedditCommentData, RedditCommentObj, RedditListingObj, RedditPostData} from "../types/redditTypes";
import {PushshiftCommentData, PushshiftPostData, PushshiftResponse} from "../types/pushshiftTypes";
import {parseMarkdown} from "../lib/markdownForReddit/markdown-for-reddit";
import {commentsToTree, deepClone, fromBase36, isCommentDeleted, sleep, toBase36} from "../utils/utils";
import Ph_Toast, {Level} from "../components/misc/toast/toast";
import {redditInfo} from "./redditApi";

export async function getCommentFromPushshift(commentData: RedditCommentData): Promise<RedditCommentData> {
	try {
		const response = await fetch(`https://api.pushshift.io/reddit/search/comment?ids=${commentData.id}`);
		const data = await response.json() as PushshiftResponse;
		const newCommentData = pushshiftToRedditComment(data.data[0] as PushshiftCommentData);
		if (isCommentDeleted(newCommentData))
			newCommentData.body += "(not found)";
		else
			newCommentData.body += "\n\n*^(Loaded from Pushshift)*";
		newCommentData.body_html = `<div class="md">${parseMarkdown(newCommentData.body)}</div>`;
		return newCommentData;
	} catch (e) {
		console.error(e);
		new Ph_Toast(Level.error, "Pushshift API error",  { timeout: 3000, groupId: "pushshiftError" });
		return makeDeleteCommentData(commentData);
	}
}

export async function getCommentRepliesFromPushshift(commentData: RedditCommentData, skipReplyIds: string[] = []): Promise<RedditCommentObj[]> {
	// steps:
	// 1. get (almost) all comments, where: same link_id, after commentData.created_utc-1
	// 2. turn data into reddit like comment data
	// 3. recreate comment tree (from flat list)
	// 4. get latest score from reddit api
	// 5. sort replies by score

	// 1. get (almost) all comments, where: same link_id, after commentData.created_utc-1
	const linkId = fromBase36(commentData.link_id.split("_")[1]);
	const startTimeStamp = commentData.created_utc - 1;
	let response: Response;
	let data: PushshiftResponse;
	try {
		response = await fetch(`https://api.pushshift.io/reddit/search/comment?link_id=${linkId}&after=${startTimeStamp}&sort=created_utc&order=asc&limit=1000`);
		data = await response.json() as PushshiftResponse;
	}
	catch (e) {
		console.error(e);
		new Ph_Toast(Level.error, "Pushshift API error", { timeout: 3000, groupId: "pushshiftError" });
		return [];
	}
	
	// 2. turn data into reddit like comment data
	let comments = data.data.map(comment => pushshiftToRedditComment(comment as PushshiftCommentData));
	comments = comments.filter(comment => !skipReplyIds.includes(comment.id));
	// add pushshift info to body
	for (const comment of comments) {
		if (isCommentDeleted(comment))
			comment.body += " (not found)";
		else
			comment.body += "\n\n*^(Loaded from Pushshift)*";
		comment.body_html = `<div class="md">${parseMarkdown(comment.body)}</div>`;
	}

	// 3. recreate comment tree (from flat list)
	// remove original comment from list
	comments = comments.filter(comment => comment.id !== commentData.id);
	const commentObjects = comments.map(comment => (<RedditCommentObj>{
		kind: "t1",
		data: comment
	}));
	// add original comment as first child
	commentData = deepClone(commentData);
	if (commentData.replies && commentData.replies.data.children.length > 0)
		commentData.replies.data.children = [];
	const originalComment = (<RedditCommentObj>{
		kind: "t1",
		data: commentData
	});
	commentObjects.unshift(originalComment);
	const commentTree = commentsToTree(commentObjects);
	// find original comment in tree
	const originalCommentInTree = commentTree.find(comment => comment.data.id === commentData.id);
	// get replies
	const replies = (originalCommentInTree.data.replies as RedditListingObj<RedditCommentObj>).data.children;

	// 4. get latest score from reddit api
	const flatCommentsMap: { [fullName: string]: RedditCommentData } = {};
	flattenCommentTree(replies, flatCommentsMap);
	const freshCommentsData = await redditInfo({fullNames: Object.keys(flatCommentsMap)}) as RedditListingObj<RedditCommentObj>;
	for (const comment of freshCommentsData.data.children) {
		flatCommentsMap[comment.data.name].score = comment.data.score;
		flatCommentsMap[comment.data.name].ups = (comment.data as RedditCommentData).ups;
	}
	// 5. sort replies by score
	comments = sortRepliesByScore(replies.map(reply => reply.data as RedditCommentData));

	return comments.map(comment => ({
		kind: "t1",
		data: comment
	}));
}

export async function getPostFromPushshift(id: string): Promise<RedditPostData> {
	let response: Response;
	try {
		response = await fetch(`https://api.pushshift.io/reddit/search/submission?ids=${id}`);
		const data = await response.json() as PushshiftResponse;
		if (!data.data[0])
			return null;
		const postData = pushshiftPostToRedditPost(data.data[0] as PushshiftPostData);
		if (["[deleted]", "[removed]"].includes(postData.selftext))
			postData.selftext += "(not found)";
		else
			postData.selftext += "\n\n*^(Loaded from Pushshift)*";
		postData.selftext_html = `<div class="md">${parseMarkdown(postData.selftext)}</div>`;
		return postData;
	} catch (e) {
		console.error(e);
		new Ph_Toast(
			Level.error,
			response?.status === 429 ? "Too many requests" : "Pushshift API error",
			{ timeout: 3000, groupId: "pushshiftError" }
		);
		return null;
	}
}

function pushshiftPostToRedditPost(post: PushshiftPostData): RedditPostData {
	return {
		...post,
		selftext_html: `<div class="md">${parseMarkdown(post.selftext)}</div>`,
		approved_at_utc: undefined,
		approved_by: undefined,
		archived: false,
		author_flair_background_color: undefined,
		author_flair_css_class: undefined,
		author_flair_template_id: undefined,
		author_flair_text: undefined,
		author_flair_text_color: undefined,
		banned_at_utc: undefined,
		banned_by: undefined,
		can_gild: false,
		category: undefined,
		clicked: false,
		content_categories: undefined,
		created: post.created_utc,
		crosspost_parent_list: [],
		discussion_type: undefined,
		distinguished: undefined,
		downs: 0,
		edited: 0,
		gallery_data: null,
		gilded: 0,
		hidden: false,
		hide_score: false,
		likes: null,
		media: null,
		media_embed: undefined,
		media_metadata: null,
		mod_note: undefined,
		mod_reason_by: undefined,
		mod_reason_title: undefined,
		mod_reports: [],
		name: `t3_${post.id}`,
		num_duplicates: 0,
		num_reports: undefined,
		post_hint: "",
		quarantine: false,
		removal_reason: undefined,
		removed_by: undefined,
		removed_by_category: undefined,
		report_reasons: undefined,
		saved: false,
		secure_media: {},
		secure_media_embed: undefined,
		subreddit_name_prefixed: "",
		suggested_sort: "",
		thumbnail_height: 0,
		thumbnail_width: 0,
		top_awarded_type: undefined,
		ups: post.score,
		url_overridden_by_dest: "",
		user_reports: [],
		view_count: undefined,
		visited: false,
	};
}

function pushshiftToRedditComment(commentData: PushshiftCommentData, shouldParseMarkdown = false): RedditCommentData {
	return {
		...commentData,
		approved_at_utc: undefined,
		approved_by: undefined,
		author_is_blocked: false,
		awarders: [],
		banned_at_utc: undefined,
		banned_by: undefined,
		body_html: `<div class="md">${shouldParseMarkdown ? parseMarkdown(commentData.body) : commentData.body}</div>`,
		can_mod_post: false,
		created: commentData.created_utc,
		depth: 0,
		downs: 0,
		edited: 0,
		likes: null,
		mod_note: undefined,
		mod_reason_by: undefined,
		mod_reason_title: undefined,
		mod_reports: [],
		parent_id: `t1_${toBase36(commentData.parent_id)}`,
		name: `t1_${commentData.id}`,
		num_reports: undefined,
		removal_reason: undefined,
		replies: undefined,
		report_reasons: undefined,
		saved: false,
		ups: commentData.score,
		user_reports: [],
	}
}

function makeDeleteCommentData(commentData: RedditCommentData): RedditCommentData {
	return {
		...commentData,
		author: "[deleted]",
		author_fullname: undefined,
		author_flair_richtext: [],
		author_flair_type: undefined,
		body: "[deleted]",
		body_html: `<div class="md"><p>[removed]</p></div>`,
	};
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

function sortRepliesByScore(comments: RedditCommentData[]): RedditCommentData[] {
	for (const comment of comments) {
		if (comment.replies?.data?.children)
			sortRepliesByScore(comment.replies.data.children.map(reply => reply.data as RedditCommentData));
	}
	return  comments.sort((a, b) => {
		if (a.score === b.score)
			return a.created - b.created;
		return b.score - a.score;
	});
}
