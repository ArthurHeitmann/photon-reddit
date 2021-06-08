
export function loadPage(url: string) {
	return cy.visit(url).then(
		() => {
			return cy.window().its("isReady", { timeout: 80000 }).should("eq", true);
		});
}
