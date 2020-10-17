import { VoteDirection } from "../../../api/api.js";

export default interface Votable {
	totalVotes: number;
	votableId: string,
	currentVoteDirection: VoteDirection,
	vote: (dir: VoteDirection) => void
}
