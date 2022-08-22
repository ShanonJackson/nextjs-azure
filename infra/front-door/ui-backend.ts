import {cdn} from "@pulumi/azure-native";
import {uiBackend} from "../web";
import {rg} from "../resource-group";
import {frontdoor} from "./front-door";

export const ui_backend_origin_group = new cdn.AFDOriginGroup("ui-backend-origin-group", {
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
	originGroupName: "ui-backend-origin-group",
	profileName: frontdoor.name,
	resourceGroupName: rg.name,
	sessionAffinityState: "Disabled",
});

const ui_backend_origin = new cdn.AFDOrigin("ui-backend-origin", {
	originName: "ui-backend-origin",
	hostName: uiBackend.hostNames[0],
	resourceGroupName: rg.name,
	enabledState: "Enabled",
	httpPort: 80,
	httpsPort: 443,
	originGroupName: ui_backend_origin_group.name,
	originHostHeader: uiBackend.hostNames[0],
	priority: 1,
	weight: 1000,
	profileName: frontdoor.name
})

const ui_backend_endpoint = new cdn.AFDEndpoint("ui-backend-endpoint", {
	enabledState: "Enabled",
	endpointName: "ui-backend-endpoint",
	location: frontdoor.location,
	profileName: frontdoor.name,
	resourceGroupName: rg.name,
});

const ui_backend_route = new cdn.Route("ui-backend-route", {
	profileName: frontdoor.name,
	resourceGroupName: rg.name,
	endpointName: ui_backend_endpoint.name,
	patternsToMatch: ["/*"],
	enabledState: "Enabled",
	supportedProtocols: ["Http", "Https"],
	forwardingProtocol: "HttpsOnly",
	httpsRedirect: "Enabled",
	linkToDefaultDomain: "Enabled",
	originGroup: {
		id: ui_backend_origin_group.id,
	},
	ruleSets: []
});