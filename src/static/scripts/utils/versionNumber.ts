
export default class VersionNumber {
	major: number;
	minor: number;
	patch: number;

	constructor(versionNumber: string) {
		const numbers = versionNumber.split(".");
		if (numbers.length === 0 || numbers.length > 3)
			throw "invalid version";
		this.major = parseInt(numbers[0]);
		this.minor = parseInt(numbers[1]);
		this.patch = parseInt(numbers[2]);
	}

	equals(version: VersionNumber) {
		return this.major === version.major && this.minor === version.minor && this.patch === version.patch;
	}

	greaterThan(version: VersionNumber) {
		return (
			this.major > version.major
			|| this.major === version.major && this.minor > version.minor
			|| this.major === version.major && this.minor === version.minor && this.patch > version.patch
		);
	}
}
