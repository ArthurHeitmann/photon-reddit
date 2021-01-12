import { VoteDirection } from "../../../api/redditApi.js";

export default interface Votable {
	totalVotes: number;
	fullName: string,
	currentVoteDirection: VoteDirection,
	isSaved: boolean,
}
