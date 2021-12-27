/**
 * Interface with redgifs api
 */

import { SourceData } from "../components/mediaViewer/videoPlayer/videoWrapper";

export enum GfycatDomain {
	gfycat = "gfycat",
	redgifs = "redgifs"
}

function makeGfycatApiUrl(domain: GfycatDomain, id: string) {
	if (domain === GfycatDomain.gfycat)
		return `https://api.${GfycatDomain.gfycat}.com/v1/gfycats/${id}`;
	else if (domain === GfycatDomain.redgifs)
		return `https://api.${GfycatDomain.redgifs}.com/v2/gifs/${id.toLowerCase()}`;
	else
		throw "invalid gfycat domain";
}

/** */
export async function getGfycatMp4SrcFromUrl(url: string, domain: GfycatDomain): Promise<SourceData[]> {
	const idMatches = url.match(/\.com\/(?:\w+\/)?(\w+)/i);	// id might be like x.com/<id> or x.com/<something>/<id>
	if (!idMatches)
		throw "invalid url";
	let req = await fetch(makeGfycatApiUrl(domain, idMatches[1]));
	if (req.status === 404 && domain === GfycatDomain.gfycat) {
		// some old gfycat links have been moved to redgifs, so try that if not found
		return await getGfycatMp4SrcFromUrl(url, GfycatDomain.redgifs);
	}
	const data = await req.json();
	return [
		{
			src: domain === GfycatDomain.gfycat
				? data["gfyItem"]["mp4Url"]
				: data["gif"]["urls"]["hd"],
			type: "video/mp4",
			label: "Default"
		},
		{
			src: domain === GfycatDomain.gfycat
				? data["gfyItem"]["mobileUrl"]
				: data["gif"]["urls"]["sd"],
			type: "video/mp4",
			label: "Mobile",
			lowerQualityAlternative: true
		}
	];
}
