import {cdn} from "@pulumi/azure-native";
import {rg} from "../resource-group";


export const frontdoor = new cdn.Profile("frontdoor", {
	profileName: "frontdoor",
	resourceGroupName: rg.name,
	location: "global",
	sku: {
		name: cdn.SkuName.Standard_AzureFrontDoor
	}
});





