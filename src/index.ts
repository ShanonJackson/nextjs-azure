import {buildPagesApi} from "./pages-api";
import {buildPagesUi} from "./pages-ui";


export const build = () => {
	buildPagesApi(); /* builds /pages/api -> /api azure function with /{*all} catch all http and lazy parse */
	buildPagesUi(); /* builds /pages into an azure function that does getInitialProps */
};

