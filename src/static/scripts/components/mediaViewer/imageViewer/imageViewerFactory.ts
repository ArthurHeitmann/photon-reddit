import Ph_ImageViewer from "./imageViewer";
import {proxyFetch} from "../../../api/photonApi";
import Ph_Toast, {Level} from "../../misc/toast/toast";

export function imageViewerFromUrl(url: string): Ph_ImageViewer {
	const imageViewer = new Ph_ImageViewer(null, url);

	if (/https:\/\/(www.)?xkcd.com\/\d+/i.test(url)) {
		const xkcdId = url.match(/\.com\/(\d+)/)[1];
		proxyFetch(`https://xkcd.com/${xkcdId}/info.0.json`)
			.then(text => JSON.parse(text))
			.then(json => imageViewer.init({ originalUrl: json["img"] }))
			.catch(e => {
				console.error(e);
				new Ph_Toast(Level.error, "Error loading xkcd image", { timeout: 3000, groupId: "xkcdError" });
			});
	}
	else if (/https:\/\/(www.)?ibb\.co\/\w+\/?$/.test(url)) {
		proxyFetch(url)
			.then(html => {
				const imgUrl = html.match(/src="(https:\/\/i.ibb.co\/[^?#]+\.(jpg|png|webm))"/)[1];
				imageViewer.init({ originalUrl: imgUrl })
			})
			.catch(e => {
				console.error(e);
				new Ph_Toast(Level.error, "Error loading ibb.co image", { timeout: 3000, groupId: "xkcdError" });
			});
	}
	else {
		imageViewer.init({ originalUrl: url })
	}

	return imageViewer;
}