
declare module "shelljs" {
	import * as SHELLJS from "shelljs";
	const shell: {cp: (flag: string, from: string, to: string) => void};
	export default shell;
}
