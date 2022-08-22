import {cdn} from "@pulumi/azure-native";
import * as pulumi from '@pulumi/pulumi';
import * as random from "@pulumi/random";
import {rg} from "../resource-group";


const config = new pulumi.Config();

const GLOBALLY_UNIQUE = new random.RandomId("random-id", {byteLength: 5});
const FRONT_DOOR_NAME = pulumi.interpolate`frontdoor${GLOBALLY_UNIQUE.hex}`;
const PROVIDERS = pulumi.interpolate`/subscriptions/${config.require("SUBSCRIPTION_ID")}/resourceGroups/${rg.name}/providers`;

export const frontdoor = new cdn.Profile("frontdoor", {
	profileName: "frontdoor",
	resourceGroupName: rg.name,
	location: "global",
	sku: {
		name: cdn.SkuName.Standard_AzureFrontDoor
	}
});





