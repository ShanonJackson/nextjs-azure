import * as cdn from "@pulumi/azure-native/cdn/v20210601";
import {frontdoor} from "./front-door";
import {frontend} from "../web";
import {rg} from "../resource-group";
import {ui_backend_origin_group} from "./ui-backend";
import {api_backend_origin_group} from "./api-backend";
import {chunk} from "../chunk";
import {RuleUtils} from "../rule";

const routes: Array<[string, string]> = Object.entries(require("../../ui-backend/pages-manifest.json"));
const {dynamicRoutes: dynamic} = require("../../ui-backend/routes-manifest.json") as { dynamicRoutes: Array<{ page: string, regex: string, namedRegex: string }> }

/* create rule sets */
const dynamic_pages_rule_set = new cdn.RuleSet("redirects", {
	profileName: frontdoor.name,
	resourceGroupName: rg.name,
	ruleSetName: "redirects"
})

const redirects_rule_api = new cdn.Rule("api-redirect", {
	ruleName: "apiredirect",
	actions: [{
		name: "RouteConfigurationOverride",
		parameters: {
			originGroupOverride: {
				forwardingProtocol: "HttpsOnly",
				originGroup: {
					id: api_backend_origin_group.id
				},
			},
			typeName: "DeliveryRuleRouteConfigurationOverrideActionParameters"
		}
	}],
	order: 1,
	profileName: frontdoor.name,
	resourceGroupName: rg.name,
	ruleSetName: dynamic_pages_rule_set.name,
	conditions: [
		{
			name: "UrlPath",
			parameters: {
				matchValues: ["/api/*"],
				operator: "Wildcard",
				transforms: [],
				typeName: "DeliveryRuleUrlPathMatchConditionParameters",
				negateCondition: false
			}
		},
	],
	matchProcessingBehavior: "Stop"
});


// I.E /users/[id] with getInitialProps or getServerSideProps


// I.E /users/profile with getInitialProps or getServerSideProps
const staticServerRendered = routes.filter(([key, value]) => {
	return !key.startsWith("/api") && !value.endsWith(".html") && !key.includes("[") && !key.includes("]")
}).map(([key]) => key.replace(/\[(.*?)\]/gm, "*")).filter((key) => !key.startsWith("/_") /* not a private route */);

const dynamicServerRendered = routes.filter(([key, value]) => {
	return !key.startsWith("/api") && !value.endsWith(".html") && key.includes("[") && key.includes("]")
}).map(([_, value]) => {
	const route = dynamic.find(({page}) => page === value.replace("pages", "").replace(".js", "").replace(".html", ""))
	if(!route) return null;
	return route.regex.replace("^/", "^"); /* preceding / wont match */
}).filter((v): v is string => Boolean(v))


export const dynamic_route_server_rendered = chunk(dynamicServerRendered, 25).map((set, i) => {
	return RuleUtils.set("DynamicRouteBackendServer", i, set.map((url) => {
		return {
			action: {type: "ORIGIN_CHANGE" as const, id: ui_backend_origin_group.id},
			conditions: [{operator: "RegEx" as const, value: [url]}]
		}
	}));
});

const redirects_rule_static = new cdn.Rule("static-server-redirects", {
	ruleName: "StaticServerRedirects",
	actions: [{
		name: "RouteConfigurationOverride",
		parameters: {
			originGroupOverride: {
				forwardingProtocol: "HttpsOnly",
				originGroup: {
					id: ui_backend_origin_group.id
				},
			},
			typeName: "DeliveryRuleRouteConfigurationOverrideActionParameters"
		}
	}],
	order: 3,
	profileName: frontdoor.name,
	resourceGroupName: rg.name,
	ruleSetName: dynamic_pages_rule_set.name,
	conditions: [
		{
			name: "UrlPath",
			parameters: {
				matchValues: staticServerRendered.length ? staticServerRendered : ["/_needs_atleast_one_value/*"],
				operator: "Equal",
				transforms: [],
				typeName: "DeliveryRuleUrlPathMatchConditionParameters",
				negateCondition: false
			}
		}
	]
});

// I.E /users/[id] WITHOUT getInitialProps or getServerSideProps
const dynamicRouteStaticRendered = routes.filter(([key, value]) => {
	return !key.startsWith("/api") && value.endsWith(".html") && key.includes("[") && key.includes("]")
}).map(([key, value]) => {
	const route = dynamic.find(({page}) => page === value.replace("pages", "").replace(".js", "").replace(".html", ""))
	if(!route) return null;
	return {url: key, regex: route.regex.replace("^/", "^")}; /* preceding / wont match */
}).filter((v): v is NonNullable<typeof v> => Boolean(v))

export const dynamic_route_static_server_rules = chunk(dynamicRouteStaticRendered, 25).map((set, i) => {
	return RuleUtils.set("DynamicRoutesStaticServer", i, set.map(({url, regex}) => {
		return {
			action: {type: "REWRITE", from: "/", to: url},
			conditions: [{operator: "RegEx", value: [regex]}]
		}
	}), false)
});


const frontend_origin_group = new cdn.AFDOriginGroup("frontend-origin-group", {
	healthProbeSettings: {
		probeIntervalInSeconds: 100,
		probePath: "/",
		probeProtocol: cdn.ProbeProtocol.Https,
		probeRequestType: cdn.HealthProbeRequestType.HEAD,
	},
	loadBalancingSettings: {
		additionalLatencyInMilliseconds: 50,
		sampleSize: 4,
		successfulSamplesRequired: 3,
	},
	originGroupName: "frontend-origin-group",
	profileName: frontdoor.name,
	resourceGroupName: rg.name,
	sessionAffinityState: "Disabled",
});

const frontend_origin = new cdn.AFDOrigin("frontend-origin", {
	originName: "frontend-origin",
	hostName: frontend.defaultHostname,
	resourceGroupName: rg.name,
	enabledState: "Enabled",
	httpPort: 80,
	httpsPort: 443,
	originGroupName: frontend_origin_group.name,
	originHostHeader: frontend.defaultHostname,
	priority: 1,
	weight: 1000,
	profileName: frontdoor.name
})

const frontend_endpoint = new cdn.AFDEndpoint("frontend-endpoint", {
	enabledState: "Enabled",
	endpointName: "frontend-endpoint",
	location: frontdoor.location,
	profileName: frontdoor.name,
	resourceGroupName: rg.name,

});

const frontend_origin_route = new cdn.Route("frontend-route", {
	profileName: frontdoor.name,
	resourceGroupName: rg.name,
	endpointName: frontend_endpoint.name,
	routeName: "frontend-route",
	patternsToMatch: ["/*"],
	enabledState: "Enabled",
	supportedProtocols: ["Http", "Https"],
	forwardingProtocol: "HttpsOnly",
	httpsRedirect: "Enabled",
	linkToDefaultDomain: "Enabled",
	originGroup: {
		id: frontend_origin_group.id,
	},
	ruleSets: [{id: dynamic_pages_rule_set.id}, ...[...dynamic_route_static_server_rules, ...dynamic_route_server_rendered].map((rule) => ({id: rule.id}))],
	cacheConfiguration: {
		queryStringCachingBehavior: "UseQueryString"
	}
}, {dependsOn: [frontend_origin]});
