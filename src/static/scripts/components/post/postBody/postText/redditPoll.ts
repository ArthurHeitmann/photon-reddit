import { RedditApiData } from "../../../../types/misc";
import { escHTML } from "../../../../utils/htmlStatics";
import { hasParams, numberToShort, timePassedSince, timePeriodReadable } from "../../../../utils/utils";

interface PollData {
	user_selection: string,
	voting_end_timestamp: number,
	total_vote_count: number,
	options: {
		text: string,
		id: string,
		vote_count?: number
	}[]
}

export default class Ph_RedditPoll extends HTMLElement {
	 constructor(postData: RedditApiData) {
		 super();
		 if (!hasParams(arguments)) return;

		 const pollData = postData["poll_data"] as PollData;

		 this.classList.add("redditPoll");

		 const infoBar = document.createElement("div");
		 infoBar.className = "infoBar";
		 infoBar.insertAdjacentHTML("beforeend", `<div data-tooltip="${pollData.total_vote_count}">${numberToShort(pollData.total_vote_count)} ${pollData.total_vote_count !== 1 ? "Votes" : "Vote"}</div>`);
		 const timeDiff = pollData.voting_end_timestamp - Date.now();
		 infoBar.insertAdjacentHTML("beforeend", `<div data-tooltip="${(new Date(pollData.voting_end_timestamp)).toString()}">${
			 timeDiff > 0
				 ? `Voting ends in ${timePeriodReadable(timeDiff / 1000)}`
				 : `Voting ended ${timePassedSince(pollData.voting_end_timestamp / 1000)} ago`
		 }</div>`);
		 this.append(infoBar);

		 const bars = document.createElement("div");
		 bars.className = "bars";
		 this.append(bars);

		 for (const option of pollData.options) {
			 const bar = document.createElement("div");
			 const votesVisible = option.vote_count !== undefined ;
			 let percentage = 0;
			 if (votesVisible)
				 percentage = (option.vote_count / pollData.total_vote_count * 100);
			 if (pollData.user_selection === option.id)
				 bar.classList.add("myVote");
			 bar.style.setProperty("--percentage", percentage.toString())
			 bar.innerHTML = `
			 	<div class="text">${escHTML(option.text)}</div>
			 	<div class="percentage">${
			 		votesVisible
				 		? percentage.toFixed(1) + "%"
						: ""
			 	}</div>
			 `;
			 bars.append(bar);
		 }

		 if (timeDiff > 0 && !pollData.user_selection) {
			 const voteLink = document.createElement("a");
			 voteLink.setAttribute("excludeLinkFromSpa", "");
			 voteLink.innerText = "Vote on reddit.com";
			 voteLink.href = `https://www.reddit.com/poll/${postData["id"]}`;
			 this.append(voteLink);
		 }
	 }
}

customElements.define("ph-reddit-poll", Ph_RedditPoll);
