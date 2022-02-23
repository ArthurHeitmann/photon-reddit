import Ph_MediaViewer from "../../mediaViewer";
import Ph_GifVideo from "../gifVideo/gifVideo";
import Ph_SimpleVideo from "../simpleVideo/simpleVideo";
import Ph_VideoAudio from "../videoAudio/videoAudio";
import Ph_VideoPlayer from "../videoPlayer";
import {BasicVideoData} from "../videoWrapper";
import Users from "../../../../multiUser/userManagement";

async function main() {
	await Users.init();
	const urlParams = new URLSearchParams(location.search)
	const data: BasicVideoData = JSON.parse(decodeURIComponent(urlParams.get("data")));
	const video = new Ph_VideoPlayer("");
	switch (data.className) {
		case "Ph_SimpleVideo":
			video.init(new Ph_SimpleVideo([{ src: data.data, type: "video/mp4" }]));
			break;
		case "Ph_VideoAudio":
			const src = (data.data as string[]) ;
			video.init(new Ph_VideoAudio(
				[{ src: src[0], type: "video/mp4" }],
				[{ src: src[1], type: "video/mp4" }]
			));
			break;
		case "Ph_GifVideo":
			video.init(new Ph_GifVideo(data.data));
			break;
	}

	const mediaViewer = new Ph_MediaViewer([video], "");
	document.body.append(mediaViewer);
}
main().catch(e => console.error(e));

