import { VoteDirection } from "../api/redditApi.js";

export interface FullName {
	fullName: string,

}

export default interface Votable extends FullName {
	totalVotes: number;
	currentVoteDirection: VoteDirection,
	isSaved: boolean,
}

