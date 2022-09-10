/**
 * Interface with redgifs api
 */

import {SourceData} from "../components/mediaViewer/videoPlayer/videoWrapper";
import {getRedgifsMp4SrcFromUrl} from "./redgifsApi";


/** Gets source mp4 files from a gfycat url. With fallback to redgifs (some old gfycat gifs were migrated to redgifs) */
export async function getGfycatMp4SrcFromUrl(url: string): Promise<SourceData[]> {
	const idMatches = url.match(/\.com\/(?:\w+\/)?(\w+)/i);	// id might be like x.com/<id> or x.com/<something>/<id>
	if (!idMatches)
		throw "invalid url";
	const id = idMatches[1];
	let req = await fetch(`https://api.gfycat.com/v1/gfycats/${id}`);
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
