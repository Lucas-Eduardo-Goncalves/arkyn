import { toSafeScriptString } from "../../../utils/escapeForInlineScript";

type GenerateGAElementsProps = {
	measurementId: string;
};

function generateGAElements(props: GenerateGAElementsProps) {
	const { measurementId } = props;

	if (!measurementId)
		console.warn("Google Analytics Measurement ID is required");

	const src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;

	const script = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', ${toSafeScriptString(measurementId)});`;

	return {
		src,
		script,
	};
}

export { generateGAElements };
