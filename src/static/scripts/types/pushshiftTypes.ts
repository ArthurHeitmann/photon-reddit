import {RedditAward} from "./redditTypes";

export interface PushshiftResponse {
	data: PushshiftData[];
}

export interface PushshiftData { }

export interface PushshiftCommentData extends PushshiftData {
	all_awardings: RedditAward[],
	archived: boolean,
	associated_award: any,
	author: string,
	author_flair_background_color: string,
	author_flair_css_class: string,
	author_flair_richtext: any[],
	author_flair_template_id: string,
	author_flair_text: string,
	author_flair_text_color: string,
	author_flair_type: string,
	author_fullname: string,
	author_patreon_flair: any,
	author_premium: boolean,
	body: string,
	body_sha1: string,
	can_gild: boolean,
	collapsed: boolean,
	collapsed_because_crowd_control: any,
	collapsed_reason: any,
	collapsed_reason_code: any,
	comment_type: any,
	controversiality: number,
	created_utc: number,
	distinguished: string,
	gilded: number,
	gildings: any,
	id: string,
	is_submitter: boolean,
	link_id: string,
	locked: boolean,
	no_follow: boolean,
	parent_id: string,
	permalink: string,
	retrieved_utc: number,
	score: number,
	score_hidden: boolean,
	send_replies: boolean,
	stickied: boolean,
	subreddit: string,
	subreddit_id: string,
	subreddit_name_prefixed: string,
	subreddit_type: string,
	top_awarded_type: any,
	total_awards_received: number,
	treatment_tags: any[],
	unrepliable_reason: any
}
