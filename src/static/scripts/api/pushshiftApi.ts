import {RedditCommentData, RedditCommentObj, RedditListingObj, RedditPostData} from "../types/redditTypes";
import {PushshiftCommentData, PushshiftPostData, PushshiftResponse} from "../types/pushshiftTypes";
import {parseMarkdown} from "../lib/markdownForReddit/markdown-for-reddit";
import {isCommentDeleted, sleep} from "../utils/utils";
import Ph_Toast, {Level} from "../components/misc/toast/toast";
import {redditInfo} from "./redditApi";

export async function getCommentFromPushshift(commentData: RedditCommentData): Promise<RedditCommentData> {
	try {
		const response = await fetch(`https://api.pushshift.io/reddit/comment/search?ids=${commentData.id}`);
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

export async function getCommentRepliesFromPushshift(
	commentData: RedditCommentData, skipReplyIds: string[] = [], maxDepth = 4, maxRequests = 4, 	// public params
	_depth = 0, _requests = { v: 0 }, tStart = Date.now()									// privat recursion params
): Promise<RedditCommentObj[]> {
	if (_depth > maxDepth || _requests.v >= maxRequests)
		return [];
	if (_depth > 0)
		await sleep(Math.random() * 500);

	// make API request with rate limit fallback
	let response: Response;
	let data: PushshiftResponse;
	try {
		_requests.v++;
		response = await fetch(`https://api.pushshift.io/reddit/comment/search?parent_id=${commentData.id}`);
		data = await response.json() as PushshiftResponse;
	} catch (e) {
		if (response.status === 429) {
			new Ph_Toast(Level.warning, "Pushshift API rate limit reached", { timeout: 3000, groupId: "pushshiftRL" });
			await sleep(1000);
			return await getCommentRepliesFromPushshift(commentData, skipReplyIds, maxDepth, maxRequests, _depth + 1, _requests, tStart);
		}
		else {
			console.error(e);
			new Ph_Toast(Level.error, "Pushshift API error", { timeout: 3000, groupId: "pushshiftError" });
			return [];
		}
	}
	// map and filter to useful reddit like datas
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

	// recursively get replies for each comment
	for (let i = 0; i < comments.length; i++){
		const comment = comments[i];
		// recursion limit to avoid too many or too long requests
		if (_requests.v >= maxRequests || _depth > maxDepth || Date.now() - tStart > 10000 && _depth > 0) {
			// replace with deleted comment, so that can later be manually fetched from pushshift
			comments[i] = {
				...comment,
				author: "[deleted]",
				author_fullname: undefined,
				author_flair_richtext: [],
				author_flair_type: undefined,
				body: "[deleted]",
				body_html: `<div class="md"><p>[removed]</p></div>`,
			};
			continue;
		}
		const replies = await getCommentRepliesFromPushshift(comment, [], maxRequests, maxRequests, _depth + 1, _requests, tStart);
		comment.replies = <RedditListingObj<RedditCommentObj>> {
			kind: "Listing",
			data: {
				children: replies,
			}
		}
	}

	if (_depth === 0) {
		// get latest score from reddit api
		const flatCommentsMap: { [fullName: string]: RedditCommentData } = {};
		flattenCommentTree(comments, flatCommentsMap);
		const freshCommentsData = await redditInfo({fullNames: Object.keys(flatCommentsMap)}) as RedditListingObj<RedditCommentObj>;
		for (const comment of freshCommentsData.data.children) {
			flatCommentsMap[comment.data.name].score = comment.data.score;
			flatCommentsMap[comment.data.name].ups = (comment.data as RedditCommentData).ups;
		}
		comments = sortRepliesByScore(comments);
	}

	return comments.map(comment => ({
		kind: "t1",
		data: comment
	}));
}

export async function getPostFromPushshift(id: string): Promise<RedditPostData> {
	let response: Response;
	try {
		response = await fetch(`https://api.pushshift.io/reddit/submission/search?ids=${id}`);
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

function flattenCommentTree(comments: RedditCommentData[], flatCommentsMap: { [id: string]: RedditCommentData }): void {
	for (const comment of comments) {
		flatCommentsMap[comment.name] = comment;
		if (comment.replies?.data?.children)
			flattenCommentTree(
				comment.replies.data.children.map(reply => reply.data as RedditCommentData),
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
