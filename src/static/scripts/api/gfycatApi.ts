/**
 * Interface with redgifs api
 */

import { SourceData } from "../components/mediaViewer/videoPlayer/videoWrapper.js";

export enum GfycatDomain {
	gfycat = "gfycat",
	redgifs = "redgifs"
}

/** */
export async function getGfycatMp4SrcFromUrl(url: string, domain: GfycatDomain): Promise<SourceData[]> {
	const idMatches = url.match(/\.com\/(?:\w+\/)?(\w+)/i);	// id might be like x.com/<id> or x.com/<something>/<id>
	if (!idMatches)
		throw "invalid url";
	const req = await fetch(`https://api.${domain}.com/v1/gfycats/${idMatches[1]}`);
	const data = await req.json();
	return [
		{
			src: data["gfyItem"]["mp4Url"],
			type: "video/mp4",
			label: "Default"
		},
		{
			src: data["gfyItem"]["mobileUrl"],
			type: "video/mp4",
			label: "Mobile",
			lowerQualityAlternative: true
		}
	];
}
