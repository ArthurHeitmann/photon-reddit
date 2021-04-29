/**
 * Interface with redgifs api
 */

export enum GfycatDomain {
	gfycat = "gfycat",
	redgifs = "redgifs"
}

/** */
export async function getGfycatMp4SrcFromUrl(url: string, domain: GfycatDomain): Promise<string> {
	const idMatches = url.match(/(?:\.com\/(?:\w+\/)?)(\w+)/);	// id might be like x.com/<id> or x.com/<something>/<id>
	if (!idMatches)
		throw "invalid url";
	const req = await fetch(`https://api.${domain}.com/v1/gfycats/${idMatches[1]}`);
	return (await req.json())["gfyItem"]["mp4Url"];
}
