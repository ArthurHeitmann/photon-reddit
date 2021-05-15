/**
 * Interface with imgur api
 */

/** clientId, should be fine here, shouldn't be a secret */
const imgurClientID = "d3609b9bd045b8f";

export enum ImgurContentType {
	image, video
}

export interface ImgurContent {
	type: ImgurContentType,
	link: string,
	preview?: string,
	caption: string
}

function makeContentData(data): ImgurContent {
	const content: ImgurContent = {
		type: undefined,
		link: undefined,
		caption: data.description || ""
	};
	if (/(^video\/)|(^image\/gif)/.test(data.type)) {
		content.type = ImgurContentType.video;
		content.link = data.mp4;
	}
	else {
		content.type = ImgurContentType.image;
		content.link = data.link;
		content.preview = data.link.replace(/(?=\.\w+(\?.*)?$)/, "h");		// https://i.imgur.com/<id>>.jpg --> https://i.imgur.com/<id>h.jpg
	}
	return content;
}

export async function getImgurContent(link: string): Promise<ImgurContent> {
	const id = link.match(/(?<=(https?:\/\/)?imgur\.com\/)\w+/)[0];		// https://imgur.com/<id> --> <id>
	const options: RequestInit = {
		headers: [
			["Authorization", `Client-ID ${imgurClientID}`]
		]
	}
	const response = await fetch(`https://api.imgur.com/3/image/${id}`, options);
	const data = await response.json();		// in case of exception pass to caller

	return makeContentData(data.data);
}

export async function getImgurAlbumContents(link: string): Promise<ImgurContent[]> {
	const id = link.match(/(?<=(https?:\/\/)?imgur\.com\/(a|album|gallery|t\/[^/?#]+)\/)\w+/)[0];	// example: https://imgur.com/a/<id> --> <id>
	const options: RequestInit = {
		headers: [
			["Authorization", `Client-ID ${imgurClientID}`]
		]
	}
	const response = await fetch(`https://api.imgur.com/3/album/${id}`, options);
	const data = await response.json();		// in case of exception pass to caller

	const contents: ImgurContent[] = [];
	for (const img of data.data.images)
		contents.push(makeContentData(img));
	return contents;
}
