import {cdn} from "@pulumi/azure-native";
import {frontdoor} from "./front-door";
import {rg} from "../resource-group";
import {apiBackend} from "../web";

export const api_backend_origin_group = new cdn.AFDOriginGroup("api-backend-origin-group", {
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
	originGroupName: "api-backend-origin-group",
	profileName: frontdoor.name,
	resourceGroupName: rg.name,
	sessionAffinityState: "Disabled",
});

export const api_backend_origin = new cdn.AFDOrigin("api-backend-origin", {
	originName: "api-backend-origin",
	hostName: apiBackend.hostNames[0],
	resourceGroupName: rg.name,
	enabledState: "Enabled",
	httpPort: 80,
	httpsPort: 443,
	originGroupName: api_backend_origin_group.name,
	originHostHeader: apiBackend.hostNames[0],
	priority: 1,
	weight: 1000,
	profileName: frontdoor.name
})

const api_backend_endpoint = new cdn.AFDEndpoint("api-backend-endpoint", {
	enabledState: "Enabled",
	endpointName: "api-backend-endpoint",
	location: frontdoor.location,
	profileName: frontdoor.name,
	resourceGroupName: rg.name,
});

const api_backend_route = new cdn.Route("api-backend-route", {
	profileName: frontdoor.name,
	resourceGroupName: rg.name,
	endpointName: api_backend_endpoint.name,
	patternsToMatch: ["/*"],
	enabledState: "Enabled",
	supportedProtocols: ["Http", "Https"],
	forwardingProtocol: "HttpsOnly",
	httpsRedirect: "Enabled",
	linkToDefaultDomain: "Enabled",
	originGroup: {
		id: api_backend_origin_group.id,
	},
	ruleSets: []
}, {dependsOn: [api_backend_origin]});