import * as cdn from "@pulumi/azure-native/cdn/v20210601";
import {frontdoor} from "./front-door/front-door";
import {rg} from "./resource-group";

type OriginChange = { type: "ORIGIN_CHANGE", id: string }
type Rewrite = { type: "REWRITE", from: string, to: string }

interface IRule {
	conditions: Array<{ operator: "Equal" | "Wildcard", value: string[], negative?: boolean }>
	action: OriginChange | Rewrite
}

/* avoids 1000's of lines of boilerplate to create rules */
export class RuleUtils {
	static set = (prefix: string, index: number, rules: IRule[]) => {
		const set = new cdn.RuleSet(`${prefix}${index}`, {
			profileName: frontdoor.name,
			resourceGroupName: rg.name,
			ruleSetName: `${prefix}${index}`
		});
		rules.forEach((rule, i) => {
			const action = (() => {
				switch (rule.action.type) {
					case "ORIGIN_CHANGE": {
						return {
							name: "RouteConfigurationOverride" as const,
							parameters: {
								originGroupOverride: {
									forwardingProtocol: "HttpsOnly" as const,
									originGroup: {
										id: rule.action.id
									},
								},
								typeName: "DeliveryRuleRouteConfigurationOverrideActionParameters" as const
							}
						}
					}
					case "REWRITE": {
						return {
							name: "UrlRewrite" as const,
							parameters: {
								sourcePattern: rule.action.from,
								destination: rule.action.to,
								preserveUnmatchedPath: false,
								typeName: "DeliveryRuleUrlRewriteActionParameters"
							}
						}
					}
				}
			})();

			const conditions = (() => {
				return rule.conditions.map((cond) => {
					return {
						name: "UrlPath" as const,
						parameters: {
							matchValues: cond.value,
							operator: cond.operator,
							transforms: [],
							typeName: "DeliveryRuleUrlPathMatchConditionParameters" as const,
							negateCondition: Boolean(cond.negative)
						}
					}
				});
			})();

			/* creates the actual rule */
			new cdn.Rule(`${prefix}-rule${i}`, {
				ruleName: `${prefix}-rule${i}`,
				actions: [action],
				order: i + 1,
				profileName: frontdoor.name,
				resourceGroupName: rg.name,
				ruleSetName: set.name,
				conditions: conditions
			})
		});
		return set;
	}
}