import { numberToShort } from "../../../src/static/scripts/utils/utils.js";

describe("first test", () => {
	it("white list", () => {
		expect(numberToShort(123456)).to.eq("123k");
	})
})
