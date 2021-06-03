/**
 * An expandable list with awards (of a post or comment) + individual award info
 */
import { numberToShort } from "../../../utils/utils.js";

export default class Ph_AwardsInfo extends HTMLElement {
	awardsData: AwardsData[];
	toggleTimeout = null;
	expandedView: HTMLElement;
	awardInfo: HTMLElement;
	awardsList: HTMLElement;

	constructor(data: AwardsData[]) {
		super();

		this.classList.add("awardsInfo");
		this.awardsData = data;

		const preview = document.createElement("div");
		preview.className = "preview";
		const coinPriceSum = data.reduce((previousValue, currentValue) =>
			previousValue + currentValue.coin_price * currentValue.count, 0);
		preview.innerHTML = `
			<span class="number coins">${numberToShort(coinPriceSum)}</span>
		`;
		this.append(preview);

		const expandedWrapper = document.createElement("div");
		expandedWrapper.className = "expandedWrapper";
		this.append(expandedWrapper);
		this.expandedView = document.createElement("div");
		this.expandedView.className = "expandedView";
		expandedWrapper.append(this.expandedView);

		this.awardInfo = document.createElement("div");
		this.awardInfo.className = "awardInfo hide";
		this.awardInfo.innerHTML = `
			<div class="top">
				<div class="name"></div>
				<div class="coins"></div>
			</div>
			<div class="description"></div>
		`;
		this.expandedView.append(this.awardInfo);

		this.awardsList = document.createElement("div");
		this.awardsList.className = "awardsList";
		this.expandedView.append(this.awardsList);

		this.addEventListener("mouseenter", () => {
			if (this.classList.contains("show")) {
				if (this.toggleTimeout)
					clearTimeout(this.toggleTimeout);
				return;
			}
			this.toggleTimeout = setTimeout(this.show.bind(this), 750);
		});
		this.addEventListener("mouseleave", () => {
			if (!this.classList.contains("show")) {
				if (this.toggleTimeout)
					clearTimeout(this.toggleTimeout);
				return;
			}
			this.toggleTimeout = setTimeout(this.hide.bind(this), 750);
		});
	}

	/** Since posts & comments usually have many (animated) awards, only load the when the user really wants to see them */
	private buildExpandedView() {
		for (const award of this.awardsData) {
			this.awardsList.insertAdjacentHTML("beforeend", `
				<div class="award" data-id="${award.id}">
					<img src="${award.resized_icons[award.resized_icons.length - 1].url}" alt="${award.name}">
					<div class="count">${award.count}x</div>
				</div>
			`);
			this.awardsList.lastElementChild.addEventListener("click", (e: MouseEvent) => {
				const awardId = (e.currentTarget as HTMLElement).getAttribute("data-id");
				if (awardId === this.awardInfo.getAttribute("data-id")) {
					this.awardInfo.classList.add("hide");
					this.awardInfo.setAttribute("data-id", "");
					return;
				}
				this.awardInfo.setAttribute("data-id", awardId);
				this.awardInfo.classList.remove("hide");
				const currAward = this.awardsData.find(aw => aw.id === awardId);			// avoid capture of unnecessary variables
				(this.awardInfo.$class("name")[0] as HTMLElement).innerText = currAward.name;
				(this.awardInfo.$class("coins")[0] as HTMLElement).innerText = numberToShort(currAward.coin_price);
				(this.awardInfo.$class("description")[0] as HTMLElement).innerText = currAward.description.replace("%{coin_symbol}", "c ");
			});
		}
	}

	show() {
		if (this.awardsList.childElementCount <= 1)
			this.buildExpandedView();
		this.classList.add("show");
		this.toggleTimeout = null;
	}

	hide() {
		this.classList.remove("show");
		this.toggleTimeout = null;
	}
}

customElements.define("ph-awards-info", Ph_AwardsInfo);

export interface AwardsData {
	giver_coin_reward: number,
	subreddit_id: string,
	is_new: boolean,
	days_of_drip_extension: number,
	coin_price: number,
	id: string,
	penny_donate: number,
	coin_reward: number,
	icon_url: string,
	days_of_premium: number,
	icon_height: number,
	tiers_by_requird_awardings,
	resized_icons: {
		url: string,
		width: number,
		height: number
	}[],
	icon_width: number,
	static_icon_width: number,
	start_date,
	is_enabled: boolean,
	awardings_required_to_grant_benefits,
	description: string,
	end_date,
	subreddit_coin_reward: number,
	count: number,
	static_icon_height: number,
	name: string,
	resized_static_icons: {
		url: string,
		width: number,
		height: number
	}[],
	icon_format,
	award_sub_type: string,
	penny_price: number,
	award_type: string,
	static_icon_url: string
}
