import { loadPage } from "../../support/utils.js";

describe("Guest only things", () => {
	it("Guest only things", () => {
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

		cy.get("ph-header").trigger("mouseleave");
		cy.scrollTo(0, 0);

		// upvote should fail
		cy.get("ph-post button.voteButton.up").first().click();
		cy.get("ph-toast .title").should("contain.text", "Error");
	})
})
