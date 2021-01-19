
export async function getRedgifsMp4SrcFromUrl(url: string): Promise<string> {
	const idMatches = url.match(/(?<=redgifs\.com\/\w+\/)\w+/);
	if (!idMatches)
		throw "invalid redgifs url";
	const req = await fetch(`https://api.redgifs.com/v1/gfycats/${idMatches[0]}`);
	return (await req.json())["gfyItem"]["mp4Url"];
}
