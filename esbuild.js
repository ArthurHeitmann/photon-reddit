import dotenv from "dotenv";
import esbuild from "esbuild";
import envFilePlugin from "esbuild-envfile-plugin";
import { sassPlugin } from "esbuild-sass-plugin";
import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";

const isWatchMode = process.argv.includes("watch") || process.argv.includes("-w") || process.argv.includes("--watch");

dotenv.config();
const requiredEnvVars = ["APP_ID", "REDIRECT_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
	throw new Error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
}

/**
 * @returns {import("esbuild").BuildOptions}
 */
function makeGeneralConfig(label, shouldBundle, platform = null) {
	return {
		bundle: shouldBundle,
		outdir: "/",
		outbase: "/",
		...(platform !== null ? { platform } : {}),
		format: "esm",
		sourcemap: true,
	}
}

const buildContexts = await Promise.all([
	esbuild.context({
		entryPoints: [
			"src/app.ts",
		],
		packages: "external",
		plugins: [
			envFilePlugin,
			typecheckPlugin({
				watch: isWatchMode,
				omitStartLog: true,
			})
		],
		...makeGeneralConfig("Node TS", true, "node")
	}),
	
	esbuild.context({
		entryPoints: [
			"src/static/scripts/main.ts",
			"src/static/serviceWorker.ts",
			"src/static/scripts/components/mediaViewer/videoPlayer/popoutVideoPlayer/popoutVideoPlayer.ts",
			"src/static/analytics/scripts/script.ts",
		],
		packages: "external",
		plugins: [
			envFilePlugin,
			typecheckPlugin({
				watch: isWatchMode,
				omitStartLog: true,
			})
		],
		...makeGeneralConfig("Browser TS", true, "browser")
	}),
	
	esbuild.context({
		entryPoints: [
			"src/static/style/main.scss",
			"src/static/analytics/style/style.scss",
		],
		minify: true,
		external: ["*.svg"],
		plugins: [
			sassPlugin({
			})
		],
		...makeGeneralConfig("SCSS", true)
	}),
]);

if (isWatchMode) {
	await Promise.all(buildContexts.map((cxt) => cxt.watch()));
}
else {
	await Promise.all(buildContexts.map((cxt) => cxt.rebuild()));
	await Promise.all(buildContexts.map((cxt) => cxt.dispose()));
}
