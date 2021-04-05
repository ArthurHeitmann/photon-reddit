import fs from "fs";
import readline from "readline";
const consoleInput = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

// find package.json and get version
let parentDirs = 0;
while (!fs.existsSync(`./${"../".repeat(parentDirs)}package.json`)) {
	parentDirs++;
	if (parentDirs > 8)
		throw "can't find package.json";
}
const { version } = JSON.parse(fs.readFileSync(`./${"../".repeat(parentDirs)}package.json`).toString());
const splitVersion = version.split(".");

const args = process.argv.splice(2);

function setVersion(version) {
	console.log("setting version to", version);
	if (args.includes("y") || args.includes("-y"))
		actuallySetVersion(version).then(() => consoleInput.close());
	else {
		consoleInput.question("confirm (enter) or cancel (ctrl + c):  ", async () => {
			await actuallySetVersion((version));
			consoleInput.close();
		});
	}
}

async function actuallySetVersion(version) {
	const filesWithVersion = ["src/serverScripts/version.ts", "src/static/scripts/utils/version.ts", "src/static/serviceWorker.ts"];
	const filePromises = [];
	filePromises.push(...filesWithVersion.map(file => {
		const path = `./${"../".repeat(parentDirs)}${file}`;
		fs.promises.readFile(path)
			.then(content => {
				const newContent = content.toString()
					.replace(/"[^"]+"(?=.*\/\/\/ <change version script>)/g, `"${version}"`);
				return fs.promises.writeFile(path, newContent);
			});
	}));
	filePromises.push(
		fs.promises.readFile(`./${"../".repeat(parentDirs)}package.json`)
			.then(content => {
				const newContent = content.toString().replace(/(?<="version":\s*")[^"]+(?=")/, version);
				return fs.promises.writeFile(`./${"../".repeat(parentDirs)}package.json`, newContent);
			})
	);
	filePromises.push(
		fs.promises.readFile(`./${"../".repeat(parentDirs)}package.json`)
			.then(content => {
				const newContent = content.toString().replace(/(?<="version":\s*")[^"]+(?=")/, version);
				return fs.promises.writeFile(`./${"../".repeat(parentDirs)}package.json`, newContent);
			})
	);
	filePromises.push(
		fs.promises.readFile(`./${"../".repeat(parentDirs)}package-lock.json`)
			.then(content => {
				const newContent = content.toString().replace(/(?<="version":\s*")[^"]+(?=")/, version);
				return fs.promises.writeFile(`./${"../".repeat(parentDirs)}package-lock.json`, newContent);
			})
	);

	await Promise.all(filePromises);
	console.log("version set");
}

function getVersionNumber(index) {
	return parseInt(splitVersion[index]);
}

function replaceVersionAt(index, newNumber, zeroAllAfterIndex = false) {
	splitVersion[index] = newNumber.toString();
	if (zeroAllAfterIndex) {
		for (let i = index + 1; i < 3; ++i)
			splitVersion[i] = "0";
	}
	return splitVersion.join(".");
}


if (args[0] === "bump" || args[0] === "b") {
	if (args[1] === "major" || args[1] === "ma")
		setVersion(replaceVersionAt(0, getVersionNumber(0) + 1, true));
	else if (args[1] === "minor" || args[1] === "mi")
		setVersion(replaceVersionAt(1, getVersionNumber(1) + 1, true));
	else if (args[1] === "patch" || args[1] === "pa" || args[1] === "p")
		setVersion(replaceVersionAt(2, getVersionNumber(2) + 1, true));
	else
		throw "Invalid version type";
}
else if (args[0] === "set" || args[0] === "s") {
	const newVersionSpecific = parseInt(args[2]);
	if (!isNaN(newVersionSpecific) && newVersionSpecific >= 0) {
		if (args[1] === "major" || args[1] === "ma")
			setVersion(replaceVersionAt(0, newVersionSpecific));
		else if (args[1] === "minor" || args[1] === "mi")
			setVersion(replaceVersionAt(1, newVersionSpecific));
		else if (args[1] === "patch" || args[1] === "pa" || args[1] === "p")
			setVersion(replaceVersionAt(2, newVersionSpecific));
		else
			throw "Invalid version type";
	}
	else if (args[1] && /^\d+\.\d+\.\d+$/.test(args[1]))
		setVersion(args[1]);
	else
		throw "invalid arguments"
}
else if (args[0] === "help" || args[0] === "h" || args[0] === "--help" || args[0] === "-h") {
	console.log(`
Version should be updated before a new release. Change in version causes all browsers to update their cached files. 
You can either bump a version or set it manually.

VERSION_TYPE: major (ma), minor (mi), patch (pa, p)

arguments:
    bump (b)
        <VERSOIN_TYPE>              increase the version type by 1
    set (s)
        <VERSION_TYPE> <number>     sets a version to a number
        <number>.<number>.<number>  manually sets a version
    
    use y or -y to skip confirmation
    `);
	consoleInput.close();
}
else
	throw "invalid argument, use \"help\" to get more infos";

