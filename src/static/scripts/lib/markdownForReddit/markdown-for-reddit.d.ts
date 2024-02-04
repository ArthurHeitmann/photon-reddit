/**
 * Converts markdown to html
 *
 * @param markdown The markdown string
 * @return Rendered HTML string
 */
export declare function parseMarkdown(markdown: string, additionalRedditData?: AdditionalRedditData): string;

export interface AdditionalRedditData {
	media_metadata?: RedditMediaData;
	mediaDisplayPolicy?: MediaDisplayPolicy;
}

export interface RedditMediaData {
	[key: string]: {
		e: string,
		id: string,
		m: string,
		p?: RedditMediaDataEntry[],
		s: RedditMediaDataEntry,
		status: string,
		t?: string,
	}
}

export interface RedditMediaDataEntry {
	x: number,
	y: number,
	u?: string,
	gif?: string,
	mp4?: string,
}

export enum MediaDisplayPolicy {
	link,
	emoteOnly,
	imageOrGif,
}
