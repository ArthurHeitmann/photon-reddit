import fs from "fs";
import path from "path";

let deletedFiles = 0;

function readDir(dir) {
	const files = fs.readdirSync(path.join(process.cwd(), dir));
	for (const file of files) {
		const filename = path.join(dir, file);
		const stat = fs.lstatSync(filename);
		if (stat.isDirectory()) {
			readDir(filename);
			continue;
		}
		if (!/\.ts$/.test(file))
			continue;
		const fileWithoutTs = file.match(/(.*)\.ts$/)[1];
		const fileJs = path.join(dir, `${fileWithoutTs}.js`);
		const fileJsMap = path.join(dir, `${fileWithoutTs}.js.map`);
		if (fs.existsSync(fileJs)) {
			fs.rmSync(fileJs);
			++deletedFiles;
		}
		if (fs.existsSync(fileJsMap)) {
			fs.rmSync(fileJsMap);
			++deletedFiles;
		}
	}
}
// process.
let dir = "cypress";
if (/scripts\/?$/.test(process.cwd()))
	dir = path.join("..", dir);

readDir(dir);

console.log(`Deleted ${deletedFiles} .js, .js.map files`);
