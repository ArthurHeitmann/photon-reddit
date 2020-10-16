import { VoteDirection } from "../../../api/api.js";

export default interface Votable {
	votableId: string,
	currentVoteDirection: VoteDirection,
	vote: (dir: VoteDirection) => void
}
