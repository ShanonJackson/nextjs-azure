import fs from "fs";

export const swaRouter = () => {
	/*
		Leaving this here now, but it's unlikely we'll use Static Web Apps (SWA) in the overall architecture.
		This is because it has it's own CI/CD pipeline which means we can't just 'pulumi up' but also because the region
		support for SWA's isn't great.
	 */
	const config = {
		routes: [
			{
				route: "/*.js",
				headers: {
					"cache-control": "public, max-age=604800, immutable"
				},
			},
			{
				route: "/*.css",
				headers: {
					"cache-control": "public, max-age=604800, immutable"
				},
			}
		],
		responseOverrides: {
			'404': {
				rewrite: '/404.html',
			},
		},
		platform: {
			apiRuntime: 'node:16',
		},
	};
	fs.writeFileSync('./out/staticwebapp.config.json', JSON.stringify(config, null, 4));
}


