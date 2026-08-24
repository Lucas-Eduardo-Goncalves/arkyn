import {
	isValidJsIdentifier,
	toSafeScriptString,
} from "../../../utils/escapeForInlineScript";
import { appendToDataLayer } from "./appendToDataLayer";

type GenerateGTMElementsProps = {
	id: string;
	events: Record<string, string>;
	dataLayer: Record<string, string>;
	dataLayerName: string;
	preview: string;
	auth: string;
};

/**
 * URL-encodes a value for safe use as a query-string value that is also embedded
 * inside a single-quoted JS string literal. `encodeURIComponent` alone leaves `'`
 * unescaped, which would otherwise let the value break out of that string literal.
 */
function toSafeUrlQueryValue(value: string): string {
	return encodeURIComponent(value).replace(/'/g, "%27");
}

function generateGTMElements(props: GenerateGTMElementsProps) {
	const { id, events, dataLayer, dataLayerName, preview, auth } = props;

	const gtmAuth = `&gtm_auth=${toSafeUrlQueryValue(auth)}`;
	const gtmPreview = `&gtm_preview=${toSafeUrlQueryValue(preview)}`;
	const safeId = toSafeUrlQueryValue(id);

	if (!id) console.warn("GTM Id is required");

	const iframe = `
    <iframe src="https://www.googletagmanager.com/ns.html?id=${safeId}${gtmAuth}${gtmPreview}&gtm_cookies_win=x"
      height="0" width="0" style="display:none;visibility:hidden" id="tag-manager"></iframe>`;

	const safeDataLayerName = isValidJsIdentifier(dataLayerName)
		? dataLayerName
		: "dataLayer";

	const script = `
    (function(w,d,s,l,i){w[l]=w[l]||[];
      w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js', ${JSON.stringify(
				events,
			)
				.slice(1, -1)
				.replace(/</g, "\\u003C")}});
      var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl+'${gtmAuth}${gtmPreview}&gtm_cookies_win=x';
      f.parentNode.insertBefore(j,f);
    })(window,document,'script',${toSafeScriptString(safeDataLayerName)},${toSafeScriptString(id)});`;

	const dataLayerVar = appendToDataLayer({ dataLayer, dataLayerName });

	return {
		iframe,
		script,
		dataLayerVar,
	};
}

export { generateGTMElements };
