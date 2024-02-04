import { RedditPostData } from "../../../../types/redditTypes";
import { escHTML } from "../../../../utils/htmlStatics";
import { hasParams, numberToShort, timePassedSince, timeRemainingReadable } from "../../../../utils/utils";

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
	 constructor(postData: RedditPostData) {
		 super();
		 if (!hasParams(arguments)) return;

		 this.classList.add("redditPoll");

		 const infoBar = document.createElement("div");
		 infoBar.className = "infoBar";
		 infoBar.insertAdjacentHTML("beforeend", `<div data-tooltip="${postData.poll_data.total_vote_count}">`
			 +`${numberToShort(postData.poll_data.total_vote_count)} ${postData.poll_data.total_vote_count !== 1 ? "Votes" : "Vote"}</div>`);
		 const timeDiff = postData.poll_data.voting_end_timestamp - Date.now();
		 infoBar.insertAdjacentHTML("beforeend", `<div data-tooltip="${(new Date(postData.poll_data.voting_end_timestamp)).toString()}">${
			 timeDiff > 0
				 ? `Voting ends ${timeRemainingReadable(timeDiff / 1000)}`
				 : `Voting ended ${timePassedSince(postData.poll_data.voting_end_timestamp / 1000)}`
		 }</div>`);
		 this.append(infoBar);

		 const bars = document.createElement("div");
		 bars.className = "bars";
		 this.append(bars);

		 for (const option of postData.poll_data.options) {
			 const bar = document.createElement("div");
			 const votesVisible = option.vote_count !== undefined ;
			 let percentage = 0;
			 if (votesVisible)
				 percentage = (option.vote_count / postData.poll_data.total_vote_count * 100);
			 if (postData.poll_data.user_selection === option.id)
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

		 if (timeDiff > 0 && !postData.poll_data.user_selection) {
			 const voteLink = document.createElement("a");
			 voteLink.setAttribute("excludeLinkFromSpa", "");
			 voteLink.innerText = "Vote on reddit.com";
			 voteLink.href = `https://www.reddit.com/poll/${postData.id}`;
			 this.append(voteLink);
		 }
	 }
}

customElements.define("ph-reddit-poll", Ph_RedditPoll);
