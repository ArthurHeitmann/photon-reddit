/**
 * Interface with imgur api
 */

/** clientId, should be fine here, shouldn't be a secret */
const imgurClientID = "d3609b9bd045b8f";

export enum ImgurContentType {
	image, video
}

enum ImgurLinkType {
	image = "image", gallery = "gallery", album = "album"
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
	if (/(^video\/)/.test(data.type) || /(^image\/gif)/.test(data.type) && data.mp4) {
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

export async function getImgurContent(link: string): Promise<ImgurContent[]> {
	let linkType: ImgurLinkType;
	if (/imgur\.com\/(?:a|album|t\/[^/?#]+)\//.test(link))
		linkType = ImgurLinkType.album;
	else if (/imgur\.com\/gallery\//.test(link))
		linkType = ImgurLinkType.gallery;
	else
		linkType = ImgurLinkType.image;
	const id = link.match(/imgur\.com(?:\/(?:a|album|gallery|t\/[^/?#]+))?\/(\w+)/)[1];

	const options: RequestInit = {
		headers: [
			["Authorization", `Client-ID ${imgurClientID}`]
		]
	}
	const response = await fetch(`https://api.imgur.com/3/${linkType}/${id}`, options);
	let data: any;
	try {
		data = await response.json();
	} catch (e) {
		return [];
	}

	if (data["status"] === 500 && data["success"] === false)
		return [];
	else if ("images" in data.data)
		return data.data.images.map((img) => makeContentData(img));
	else
		return [makeContentData(data.data)];
}
