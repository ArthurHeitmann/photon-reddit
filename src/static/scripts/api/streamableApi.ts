import { SourceData } from "../components/mediaViewer/videoPlayer/videoWrapper";

export async function getStreamableUrl(url: string): Promise<SourceData[]> {
	const vidId = url.match(/streamable\.com\/(\w+)/)[1];
	const r = await fetch(`https://api.streamable.com/videos/${vidId}`);
	const data = await r.json();
	return [
		{
			src: data["files"]["mp4"]["url"],
			type: "video/mp4",
			label: `${data["files"]["mp4"]["height"]}p`
		},
		...(data["files"]["mp4-mobile"] ? [{
			src: data["files"]["mp4-mobile"]["url"],
			type: "video/mp4",
			label: `${data["files"]["mp4-mobile"]["height"]}p`,
			lowerQualityAlternative: true
		}] : []),
	]
}
