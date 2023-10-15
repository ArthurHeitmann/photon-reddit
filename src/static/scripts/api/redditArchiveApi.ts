import {RedditCommentData, RedditCommentObj, RedditListingObj, RedditPostData} from "../types/redditTypes";
import {parseMarkdown} from "../lib/markdownForReddit/markdown-for-reddit";
import {isCommentDeleted} from "../utils/utils";
import Ph_Toast, {Level} from "../components/misc/toast/toast";
import {redditInfo} from "./redditApi";

interface ArcticShiftResponse<T> {
	data: T;
}

export async function getCommentTreeFromArchive(commentData: RedditCommentData): Promise<RedditCommentData> {
	// steps:
	// 1. get comment tree
	// 2. update with latest scores from reddit api
	// 3. sort replies by score

	const response = await fetch(`https://arctic-shift.photon-reddit.com/api/comments/tree?link_id=${commentData.link_id}&parent_id=${commentData.id}&limit=20&md2html=true`);
	const treeRes = await response.json() as ArcticShiftResponse<RedditCommentObj[]>;
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

	return tree[0]?.data as RedditCommentData;
}

export async function getPostFromArchive(id: string): Promise<RedditPostData> {
	let response: Response;
	try {
		response = await fetch(`https://arctic-shift.photon-reddit.com/api/posts/ids?ids=${id}`);
		const dataRes = await response.json() as ArcticShiftResponse<RedditPostData[]>;
		const data = dataRes.data;
		if (!data[0])
			return null;
		const postData = data[0] as RedditPostData;
		if (["[deleted]", "[removed]"].includes(postData.selftext))
			postData.selftext += " (not found)";
		else
			postData.selftext += "\n\n*^(Archived version)*";
		postData.selftext_html = `<div class="md">${parseMarkdown(postData.selftext)}</div>`;
		return postData;
	} catch (e) {
		console.error(e);
		new Ph_Toast(
			Level.error,
			response?.status === 429 ? "Too many requests" : "API error",
			{ timeout: 3000, groupId: "archiveError" }
		);
		return null;
	}
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
