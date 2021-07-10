
export function loadPage(url: string) {
	return cy.visit(url).then(
		() => {
			return cy.window().its("isReady", { timeout: 150000 }).should("eq", true);
		});
}

export function showHeader() {
	return cy.get("ph-header").trigger("mouseenter", { force: true });
}

export function hideHeader() {
	cy.get("ph-header").trigger("mouseleave");
}
