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

export interface PushshiftPostData extends PushshiftData {
	all_awardings: RedditAward[]
	allow_live_comments: boolean
	author: string
	author_flair_richtext: any[]
	author_flair_type: string
	author_fullname: string
	author_is_blocked: boolean
	author_patreon_flair: boolean
	author_premium: boolean
	awarders: any[]
	can_mod_post: boolean
	contest_mode: boolean
	created_utc: number
	domain: string
	full_link: string
	gildings: any
	id: string
	is_created_from_ads_ui: boolean
	is_crosspostable: boolean
	is_meta: boolean
	is_original_content: boolean
	is_reddit_media_domain: boolean
	is_robot_indexable: boolean
	is_self: boolean
	is_video: boolean
	link_flair_background_color: string
	link_flair_css_class: string
	link_flair_richtext: any[]
	link_flair_template_id: string
	link_flair_text: string
	link_flair_text_color: string
	link_flair_type: string
	locked: boolean
	media_only: boolean
	no_follow: boolean
	num_comments: number
	num_crossposts: number
	over_18: boolean
	parent_whitelist_status: string
	permalink: string
	pinned: boolean
	pwls: number
	retrieved_on: number
	score: number
	selftext: string
	send_replies: boolean
	spoiler: boolean
	stickied: boolean
	subreddit: string
	subreddit_id: string
	subreddit_subscribers: number
	subreddit_type: string
	thumbnail: string
	title: string
	total_awards_received: number
	treatment_tags: any[]
	upvote_ratio: number
	url: string
	whitelist_status: string
	wls: number
}
