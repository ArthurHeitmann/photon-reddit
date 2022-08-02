import {loadPage, showHeader} from "../../support/utils";

describe("Basic Navigation", () => {
	it("A bit of everything", () => {
		// load page
		loadPage("/r/all");

		// click on first post
		cy.get(".post").first()
			.should("be.visible")
			.find("> a").first()
			.click({ force: true });

		// get post subreddit & title
		let postTitle: string;
		cy.get("ph-post-and-comments .post .header .title").first()
			.should(titleElem => postTitle = titleElem.text());

		cy.get("ph-post-and-comments .post .header a.subreddit > *").first().invoke("text").as("initialSub");

		cy.title().should(tabTitle => {
			expect(tabTitle).to.contain(postTitle);
		});

		// open subreddit info
		showHeader();
		cy.get("ph-header .showInfo[data-feed-type=subreddit]")
			.click();

		// open dropdown and visit subreddit
		cy.get("ph-feed-info-subreddit .overviewBar .subActionsWrapper ph-drop-down > button")
			.click();
		cy.get("ph-feed-info-subreddit .overviewBar .subActionsWrapper ph-drop-down .dropDownEntry")
			.contains("Visit")
			.click();

		cy.get("@initialSub").then((initialSub: any) => {
			cy.log(initialSub);
			cy.url().should("include", initialSub)
		});

		// open same feed info again
		cy.wait(1000);
		showHeader();
		cy.get("ph-header .showInfo[data-feed-type=subreddit]").click();
		cy.get("ph-feed-info-subreddit:not(.remove) .title").invoke("text")
			.should(text => expect(text).to.have.length.gt(1));

		// click through all 4 info sections
		cy.get("ph-feed-info-subreddit:not(.remove) .switcher").as("feedInfoSwitcher");
		cy.get("@feedInfoSwitcher").children().eq(0).should("have.class", "selected")
		cy.get("@feedInfoSwitcher").contains(/^Description$/)
			.click().should("have.class", "selected");
		cy.get("@feedInfoSwitcher").contains("Public Description")
			.click().should("have.class", "selected");
		cy.get("@feedInfoSwitcher").contains("Rules")
			.click().should("have.class", "selected");
		cy.get("@feedInfoSwitcher").contains("Other")
			.click().should("have.class", "selected");

		// close feedInfo
		cy.get(".viewState:not(.hide)").click({ force: true });

		// search for and go to r/AskReddit
		showHeader();
		cy.wait(500);
		cy.get("ph-search input[type=text]").type("r/AskReddit");
		cy.get("ph-search .modeButton").contains("r/").should("have.class", "checked");
		cy.get("ph-search .resultsWrapper a").first().as("askRedditLink");
		cy.get("@askRedditLink")
			.should("include.text", "r/AskReddit")
			.should("have.attr", "href");
		cy.get("@askRedditLink").invoke("attr", "href").should("eq", "/r/AskReddit");
		cy.get("@askRedditLink").click()
		cy.url().should("contain", "/r/AskReddit")

		showHeader();
		cy.get("ph-search input[type=text]").focus();
		cy.get("ph-search .expandedOptions [for=limitToSubreddit]")
			.should("be.visible")
			.should("have.text", "Limit to /r/AskReddit");

		// open settings and changelog
		cy.get("ph-header .showSettingsButton").click();
		cy.get("ph-photon-settings .sectionEntry").contains("Other").click();
		cy.get("ph-photon-settings button").contains("Show Changelog")
			.scrollIntoView()
			.click();
		cy.get("ph-changelog").contains(/^v\d+\.\d+\.\d+/);
		cy.get("ph-changelog .closeButton").click();
	});
})
