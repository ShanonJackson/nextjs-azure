import fs from "fs-extra";
import path from "path";
import glob from "fast-glob";


const mkdir = (path: string) => fs.existsSync(path) ? null : fs.mkdirSync(path);
const getDependenciesFor = (directory: string): string[] => {
	const dependencies = new Set<string>([]);
	glob.sync(directory + "/**/*.json").forEach((f) => {
		const {files: deps} = JSON.parse(fs.readFileSync(f, 'utf8')) as { files: string[] };
		deps.forEach((dep) => {
			if (dep.includes("package.json")) return;
			const joined = path.join(f, '../' + dep);
			dependencies.add(joined);
		});
	})
	return Array.from(dependencies);
}

const join = (relative: string) => {
	return path.join(__dirname, relative);
}

export const buildPagesApi = () => {
	const isApiProject = fs.existsSync('./.next/standalone/.next/server/pages/api');
	if(!fs.existsSync('./api')) fs.mkdirSync("./api")
	if (isApiProject) {
		/* Gets all dependencies */
		getDependenciesFor('./.next/standalone/.next/server/pages/api').forEach((depend) => {
			mkdir(`.${path.sep}api`);
			const to = `.${path.sep}api${path.sep}` + depend.replace(`.next${path.sep}standalone${path.sep}`, "").replace(`.next${path.sep}server${path.sep}`, "");
			fs.outputFileSync(to, fs.readFileSync(depend), "utf-8");
		});
		/* copies across raw files, the actual API endpoints */
		glob.sync("./.next/standalone/.next/server/pages/api/**/*.js").map((file) => {
			fs.outputFileSync(file.replace(`./.next/standalone/.next/server`, "./api"), fs.readFileSync(file), "utf-8");
		})
	}
	fs.writeFileSync(
		'./api/pages-manifest.json',
		fs.readFileSync('./.next/standalone/.next/server/pages-manifest.json'),
		'utf8',
	);
	fs.writeFileSync(
		'./api/routes-manifest.json',
		fs.readFileSync('./.next/standalone/.next/routes-manifest.json'),
		'utf8',
	);
	fs.cpSync(join("./scripts/function"), "./api/function", {recursive: true}); /* adds catch all {*api} route function app */
	fs.cpSync(join("./scripts/root"), "./api", {recursive: true}); /* creates package.json for static-web-apps, host.json */
}