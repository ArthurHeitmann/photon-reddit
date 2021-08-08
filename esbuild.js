import esbuild from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { spawn } from "child_process";

const isWatchMode = process.argv.includes("watch") || process.argv.includes("-w") || process.argv.includes("--watch");

const tscTypeChecker = spawn("npx", ["tsc", "--noEmit", "--preserveWatchOutput"].concat(isWatchMode ? "-w" : []), { shell: true });
function displayChunk(chunk) {
	if (/^\s*$/.test(chunk)
		|| /^\s*[\d.: ]+.{0,5}?Starting compilation in watch mode...\s*$/.test(chunk.toString())
		|| /^\s*[\d.: ]+.{0,5}?Found 0 errors. Watching for file changes.\s*$/.test(chunk.toString())
		|| /^\s*[\d.: ]+.{0,5}?Starting compilation in watch mode...\s*[\d.: ]+.{0,5}?Found 0 errors. Watching for file changes\s*$/.test(chunk.toString())
		|| /^\s*[\d.: ]+.{0,5}?File change detected. Starting incremental compilation...\s*$/.test(chunk.toString()))
		return;
	process.stdout.write(chunk);
}
tscTypeChecker.stdout.on("data", displayChunk);
tscTypeChecker.stderr.on("data", chunk => {
	process.stderr.write(chunk);
});
tscTypeChecker.on("exit", code => {
	if (isWatchMode)
		return;
	if (code === 0) {
		console.log("tsc successful");
		return;
	}
	console.error("tsc failed");
	process.exit(1);
})
console.log("started tsc");

function watchFeedback(label) {
	return (error) => {
		if (error)
			console.error(`rebuild ${label} failed${error.errors.length > 0 ? ` with ${error.errors.length} ${error.errors.length === 1 ? "error" : "errors"}` : ""}`);
		else
			console.log(`rebuild ${label} done`);
	}
}
function makeGeneralConfig(label, shouldBundle, platform = null) {
	return {
		bundle: shouldBundle,
		outdir: "/",
		outbase: "/",
		...(platform !== null ? { platform } : {}),
		format: "esm",
		sourcemap: true,
		watch: isWatchMode ? {
			onRebuild: watchFeedback(label),
		} : false
	}
}

esbuild.build({
	entryPoints: [
		"src/app.ts",
	],
	plugins: [
		nodeExternalsPlugin()
	],
	...makeGeneralConfig("Node TS", true, "node")
})
	.catch(() => process.exit(1))
	.then(() => console.log("esbuild Node TS transpiled"));

esbuild.build({
	entryPoints: [
		"src/static/scripts/main.ts",
		"src/static/serviceWorker.ts",
		"src/static/scripts/components/mediaViewer/videoPlayer/popoutVideoPlayer/popoutVideoPlayer.ts",
		"src/static/analytics/scripts/script.ts",
	],
	...makeGeneralConfig("Browser TS", true, "browser")
})
	.catch(() => process.exit(1))
	.then(() => console.log("esbuild Browser TS transpiled"));

esbuild.build({
	entryPoints: [
		"src/static/style/main.scss",
		"src/static/analytics/style/style.scss",
	],
	minify: true,
	plugins: [
		sassPlugin({
		})
	],
	...makeGeneralConfig("SCSS", false)
})
	.catch(() => process.exit(1))
	.then(() => console.log("esbuild SCSS transpiled"));

if (isWatchMode)
	console.log("esbuild started watch");
