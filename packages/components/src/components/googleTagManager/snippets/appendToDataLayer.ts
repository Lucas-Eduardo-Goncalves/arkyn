import {
	isValidJsIdentifier,
	toSafeScriptJson,
} from "../../../utils/escapeForInlineScript";

type AppendToDataLayer = {
	dataLayer: Record<string, string>;
	dataLayerName: string;
};

function appendToDataLayer(props: AppendToDataLayer) {
	const { dataLayer, dataLayerName } = props;

	const safeDataLayerName = isValidJsIdentifier(dataLayerName)
		? dataLayerName
		: "dataLayer";

	if (safeDataLayerName !== dataLayerName) {
		console.warn(
			`Invalid dataLayerName "${dataLayerName}", falling back to "dataLayer"`,
		);
	}

	return `
  window.${safeDataLayerName} = window.${safeDataLayerName} || [];
  window.${safeDataLayerName}.push(${toSafeScriptJson(dataLayer)})`;
}

export { appendToDataLayer };
