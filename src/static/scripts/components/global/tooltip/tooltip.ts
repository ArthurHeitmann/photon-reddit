import { clamp } from "../../../utils/utils";
import Users from "../../multiUser/userManagement";

interface ElementHover {
	element: Element,
	tooltip: Ph_Tooltip | null,
	startTimeout: any | null,
	endTimeout: any | null,
}

export default class Ph_Tooltips extends HTMLElement {
	private allHovered: ElementHover[] = [];
	private static showDelayMs = 500;
	private static hideDelayMs = 500;

	constructor() {
		super();

		this.className = "tooltips";

		window.addEventListener("mouseover", this.onElementMouseIn.bind(this), {  });
	}

	private onElementMouseIn(e: MouseEvent) {
		const allHovered = Ph_Tooltips.getAllHoveredTooltips(e.target as Element);
		const allNew = this.getNewHovered(allHovered);
		const allSame = this.getSameHovered(allHovered);
		const allDead = this.getDeadHovered(allHovered);

		for (const newElement of allNew) {
			const newHov: ElementHover = {
				element: newElement,
				tooltip: null,
				startTimeout: null,
				endTimeout: null,
			};
			newHov.startTimeout = setTimeout(() => this.onElementTooltipStart(newHov), Ph_Tooltips.showDelayMs);
			this.allHovered.push(newHov);
		}
		for (const sameElement of allSame) {
			if (!sameElement.startTimeout && !sameElement.tooltip) {
				sameElement.startTimeout = setTimeout(() => this.onElementTooltipStart(sameElement), Ph_Tooltips.showDelayMs);
			}
			if (sameElement.endTimeout) {
				clearTimeout(sameElement.endTimeout);
				sameElement.endTimeout = null;
			}
		}
		for (const deadElement of allDead) {
			if (deadElement.startTimeout) {
				clearTimeout(deadElement.startTimeout);
				deadElement.startTimeout = null;
			}
			if (!deadElement.endTimeout)
				deadElement.endTimeout = setTimeout(() => this.onElementTooltipEnd(deadElement), Ph_Tooltips.hideDelayMs)
		}
	}

	private onElementTooltipStart(element: ElementHover) {
		element.startTimeout = null;
		element.tooltip = this.appendChild(new Ph_Tooltip(element.element));
	}

	private onElementTooltipEnd(element: ElementHover) {
		element.endTimeout = null;
		if (element.tooltip) {
			element.tooltip.classList.remove("show");
			setTimeout(() => element.tooltip.remove(), 500);
		}
		this.allHovered.splice(this.allHovered.findIndex(e => e === element), 1);
	}

	private getNewHovered(allNewHovered: Element[]): Element[] {
		return Users.current.d.photonSettings.tooltipsVisible ? allNewHovered
			.filter(elem => this.allHovered
				.findIndex(hovered => hovered.element === elem) === -1
			) : [];
	}

	private getSameHovered(allNewHovered: Element[]): ElementHover[] {
		return Users.current.d.photonSettings.tooltipsVisible ? this.allHovered
			.filter(hovered => allNewHovered
				.findIndex(elem => hovered.element === elem) !== -1) : [];
	}

	private getDeadHovered(allNewHovered: Element[]): ElementHover[] {
		return Users.current.d.photonSettings.tooltipsVisible ? this.allHovered
			.filter(hovered => allNewHovered
				.findIndex(elem => hovered.element === elem) === -1) : this.allHovered;
	}

	private static getAllHoveredTooltips(target: Element): Element[] {
		const out = [];
		while (target) {
			if (target.hasAttribute("data-tooltip"))
				out.push(target);
			target = target.parentElement;
		}
		return out;
	}
}

class Ph_Tooltip extends HTMLElement {
	element: Element;

	constructor(element: Element) {
		super();

		this.className = "tooltip";
		this.innerText = element.getAttribute("data-tooltip");
		this.element = element;
	}

	connectedCallback() {
		const elemBounds = this.element.getBoundingClientRect();
		const thisBounds = this.getBoundingClientRect();
		this.style.left = `${clamp(elemBounds.x + elemBounds.width / 2 - thisBounds.width / 2, 3, window.innerWidth - thisBounds.width - 13) + window.pageXOffset}px`;
		this.style.top = `${clamp(elemBounds.y - thisBounds.height - 6 , 3, window.innerHeight - thisBounds.height - 3) + window.pageYOffset}px`;
		this.element = null;
		this.classList.add("show");
	}
}

Users.ensureDataHasLoaded().then(() => document.body.append(new Ph_Tooltips()));

customElements.define("ph-tooltip", Ph_Tooltip);
customElements.define("ph-tooltips", Ph_Tooltips);
