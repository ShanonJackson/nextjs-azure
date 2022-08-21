import * as resources from "@pulumi/azure-native/resources";

/* needs to be in another file because of circular dependency */
export const rg = new resources.ResourceGroup('nextjs-demo');