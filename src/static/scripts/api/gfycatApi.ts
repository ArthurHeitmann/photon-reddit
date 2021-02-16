/**
 * Interface with redgifs api
 */

export enum GfycatDomain {
	gfycat = "gfycat",
	redgifs = "redgifs"
}

/** */
export async function getGfycatMp4SrcFromUrl(url: string, domain: GfycatDomain): Promise<string> {
	const idMatches = url.match(/(?<=\.com\/\w+\/)\w+/);
	if (!idMatches)
		throw "invalid redgifs url";
	const req = await fetch(`https://api.${domain}.com/v1/gfycats/${idMatches[0]}`);
	return (await req.json())["gfyItem"]["mp4Url"];
}
