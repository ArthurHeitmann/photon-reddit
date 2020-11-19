import { VoteDirection } from "../../../api/api.js";

export default interface Votable {
	totalVotes: number;
	fullName: string,
	currentVoteDirection: VoteDirection,
	isSaved: boolean,
}
