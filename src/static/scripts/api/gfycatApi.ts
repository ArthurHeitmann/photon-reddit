/**
 * Interface with redgifs api
 */

import {SourceData} from "../components/mediaViewer/videoPlayer/videoWrapper";
import {proxyFetch} from "./photonApi";

export enum GfycatDomain {
	gfycat = "gfycat",
	redgifs = "redgifs"
}

// function makeGfycatApiUrl(domain: GfycatDomain, id: string) {
// 	if (domain === GfycatDomain.gfycat)
// 		return `https://api.${GfycatDomain.gfycat}.com/v1/gfycats/${id}`;
// 	else if (domain === GfycatDomain.redgifs)
// 		return `https://api.${GfycatDomain.redgifs}.com/v2/gifs/${id.toLowerCase()}`;
// 	else
// 		throw "invalid gfycat domain";
// }

/** Gets source mp4 files from a gfycat url. With fallback to redgifs (some old gfycat gifs were migrated to redgifs) */
export async function getGfycatMp4SrcFromUrl(url: string): Promise<SourceData[]> {
	const idMatches = url.match(/\.com\/(?:\w+\/)?(\w+)/i);	// id might be like x.com/<id> or x.com/<something>/<id>
	if (!idMatches)
		throw "invalid url";
	const id = idMatches[1];
	let req = await fetch(`https://api.${GfycatDomain.gfycat}.com/v1/gfycats/${id}`);
	if (req.status === 404) {
		// some old gfycat links have been moved to redgifs, so try that if not found
		return await getRedgifsMp4SrcFromUrl(url);
	}
	const data = await req.json();
	return [
		{
			src: data["gfyItem"]["mp4Url"],
			type: "video/mp4",
			label: "Default",
			heightHint: data["gfyItem"]["height"],
		},
		{
			src: data["gfyItem"]["mobileUrl"],
			type: "video/mp4",
			label: "Mobile",
			lowerQualityAlternative: true,
			heightHint: data["gfyItem"]["height"],
		}
	];
}

/** Gets source mp4 files from redgifs */
export async function getRedgifsMp4SrcFromUrl(url: string): Promise<SourceData[]> {
	const idMatches = url.match(/\.com\/(?:\w+\/)?(\w+)/i);	// id might be like x.com/<id> or x.com/<something>/<id>
	if (!idMatches)
		throw "invalid url";
	// const req = await fetch(`https://api.${GfycatDomain.redgifs}.com/v2/gifs/${idMatches[1].toLowerCase()}`);
	// const data = await req.json();
	// fix because of CORS issues
	const dataTxt = (await proxyFetch(`https://api.${GfycatDomain.redgifs}.com/v2/gifs/${idMatches[1].toLowerCase()}`));
	const data = JSON.parse(dataTxt);
	return [
		{
			src: data["gif"]["urls"]["hd"],
			type: "video/mp4",
			label: "Default",
			heightHint: data["gif"]["height"]
		},
		{
			src: data["gif"]["urls"]["sd"],
			type: "video/mp4",
			label: "Mobile",
			lowerQualityAlternative: true,
			heightHint: data["gif"]["height"]
		}
	];
}
