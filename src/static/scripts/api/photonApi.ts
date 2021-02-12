
export async function youtubeDl(url): Promise<string> {
	const res = await fetch(`/youtube-dl?url=${encodeURIComponent(url)}`);
	const clipMp4 = (await res.json())["url"];
	return clipMp4;
}