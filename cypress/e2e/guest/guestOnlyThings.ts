import {hideHeader, loadPage} from "../../support/utils";

describe("Guest only things", () => {
	it("Guest only things", () => {
		cy["clearIdb"]();
		loadPage("/");

		// Has tutorial popup
		cy.get("ph-toast")
			.should("contain.text", "take a quick tour?")
			.find("button.closeButton").click();

		// header is expanded
		cy.get("ph-header").should("have.class", "hover");

		// login button visible
		cy.get("ph-header button").contains("Login")
			.should("be.visible");

		hideHeader();
		cy.scrollTo(0, 0);

		// upvote should fail
		cy.get("ph-post .voteButton.up button").first().click();
		cy.get("ph-toast .title").should("contain.text", "Error");
	})
})
