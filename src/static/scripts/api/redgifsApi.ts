import {SourceData} from "../components/mediaViewer/videoPlayer/videoWrapper";
import Users from "../multiUser/userManagement";
import {fetchRedgifsToken} from "./photonApi";
import {createLock, unlock} from "../utils/lock";

async function getRedgifsToken() {
	await createLock("redgifsToken");
	try {
		let authData = Users.global.d.redgifsAuth;
		if (!authData.token || !authData.expiration || authData.expiration < Date.now()) {
			authData = await fetchRedgifsToken();
			await Users.global.set(["redgifsAuth"], authData);
		}
		return authData.token;
	} finally {
		unlock("redgifsToken");
	}
}

export async function getRedgifsMp4SrcFromUrl(url: string): Promise<SourceData[]> {
	const idMatches = url.match(/\.com\/(?:\w+\/)?(\w+)/i);	// id might be like x.com/<id> or x.com/<something>/<id>
	if (!idMatches)
		throw "invalid url";
	const id = idMatches[1];
	const token = await getRedgifsToken();
	const req = await fetch(`https://api.redgifs.com/v2/gifs/${id}`, {
		headers: {
			"Authorization": `Bearer ${token}`
		}
	});
	const data = await req.json();
	
	return [
		{
			src: data["gif"]["urls"]["hd"],
			type: "video/mp4",
			label: "HD",
			heightHint: data["gif"]["height"],
		},
		{
			src: data["gif"]["urls"]["sd"],
			type: "video/mp4",
			label: "SD",
			lowerQualityAlternative: true,
			heightHint: data["gif"]["height"],
		}
	];
}