import path from "path";
import fs from "fs-extra";
import glob from "fast-glob";


const FOLDER_NAME = "ui-backend"

const mkdir = (path: string) => fs.existsSync(path) ? null : fs.mkdirSync(path);
const getDependenciesFor = (directory: string): string[] => {
	const dependencies = new Set<string>([]);
	glob.sync(directory + "/**/*.json").forEach((f) => {
		if(f.includes(`pages/api`)) return; /* don't go into pages/api folder for ui-backend */
		const { files: deps } = JSON.parse(fs.readFileSync(f, 'utf8')) as {files: string[]};
		deps.forEach((dep) => {
			if(dep.includes("package.json")) return;
			const joined = path.join(f, '../' + dep);
			dependencies.add(joined);
		});
	})
	return Array.from(dependencies);
}
export const buildPagesUi = () => {
	const dependencies = getDependenciesFor('./.next/standalone/.next/server/pages')
	/* add all dependencies */
	dependencies.map((depend) => {
		mkdir(`.${path.sep}${FOLDER_NAME}`);
		const to = `.${path.sep}${FOLDER_NAME}${path.sep}` + depend.replace(`.next${path.sep}standalone${path.sep}`, "").replace(`.next${path.sep}server`, "");
		fs.outputFileSync(to, fs.readFileSync(depend), "utf-8");
	});
	glob.sync("./.next/standalone/.next/server/pages/**/*.js").map((file) => {
		if(file.includes(`pages/api`)) return; /* not pages/api folder */
		fs.outputFileSync(file.replace(`./.next/standalone/.next/server`, `./${FOLDER_NAME}`), fs.readFileSync(file), "utf-8");
	})
	/* copy manifest files across, these have useful data inside of them for handling routing + propagating some next.config.js options */
	fs.cpSync('./.next/standalone/.next/server/pages-manifest.json', `./${FOLDER_NAME}/pages-manifest.json`)
	fs.cpSync('./.next/standalone/.next/routes-manifest.json', `./${FOLDER_NAME}/routes-manifest.json`)
	fs.cpSync('./.next/standalone/.next/build-manifest.json', `./${FOLDER_NAME}/build-manifest.json`);
	fs.cpSync('./.next/standalone/.next/required-server-files.json', `./${FOLDER_NAME}/required-server-files.json`)


	fs.cpSync(".next/standalone/node_modules/react-dom", `./${FOLDER_NAME}/node_modules/react-dom`, {recursive: true}); /* react-dom always needed */
	// fs.cpSync(".next/standalone/node_modules/styled-jsx", `./${FOLDER_NAME}/node_modules/styled-jsx`, {recursive: true}); /* styled-jsx always needed */
	fs.cpSync(".next/standalone/node_modules/next", `./${FOLDER_NAME}/node_modules/next`, {recursive: true}); /* always needed */
	fs.cpSync(".next/standalone/node_modules/@swc", `./${FOLDER_NAME}/node_modules/@swc`, {recursive: true}); /* always needed */
	fs.cpSync(".next/standalone/node_modules/use-sync-external-store", `./${FOLDER_NAME}/node_modules/use-sync-external-store`, {recursive: true}); /* always needed */
	fs.cpSync("./scripts/ui-function", `./${FOLDER_NAME}/function`, {recursive: true}); /* adds catch all {*api} route function app */
	fs.cpSync("./scripts/root", `./${FOLDER_NAME}`, {recursive: true}); /* creates package.json for static-web-apps, host.json */
}
