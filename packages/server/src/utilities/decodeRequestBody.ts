import { BadRequest } from "../http/badResponses/badRequest";

/** Default maximum accepted request body size (5 MB) when `maxBodySizeBytes` isn't set. */
const DEFAULT_MAX_BODY_SIZE_BYTES = 5 * 1024 * 1024;

type DecodeRequestBodyOptions = {
	/** Max accepted body size in bytes. Larger bodies are rejected with `BadRequest`. @default 5242880 (5 MB) */
	maxBodySizeBytes?: number;
};

/**
 * Decodes a request body into a plain object, trying JSON first then URL-encoded form data.
 * Throws `BadRequest` if neither format can be parsed, or if the body exceeds `maxBodySizeBytes`.
 *
 * @param request - The incoming request whose body will be decoded.
 * @param options.maxBodySizeBytes - Max accepted body size in bytes. Default: 5 MB.
 * @returns The decoded body as a plain object.
 *
 * @example
 * ```typescript
 * export async function action({ request }: ActionFunctionArgs) {
 *   const body = await decodeRequestBody(request);
 *   // body is now a plain JS object
 * }
 * ```
 */

async function decodeRequestBody(
	request: Request,
	options?: DecodeRequestBodyOptions,
	// biome-ignore lint/suspicious/noExplicitAny: intentional
): Promise<any> {
	// biome-ignore lint/suspicious/noExplicitAny: intentional
	let data: any;

	const maxBodySizeBytes =
		options?.maxBodySizeBytes ?? DEFAULT_MAX_BODY_SIZE_BYTES;

	const contentLength = Number(request.headers.get("content-length"));
	if (Number.isFinite(contentLength) && contentLength > maxBodySizeBytes) {
		throw new BadRequest("Request body exceeds the maximum allowed size");
	}

	const arrayBuffer = await request.arrayBuffer();

	if (arrayBuffer.byteLength > maxBodySizeBytes) {
		throw new BadRequest("Request body exceeds the maximum allowed size");
	}

	const text = new TextDecoder().decode(arrayBuffer);

	try {
		data = JSON.parse(text);
	} catch (_jsonError) {
		try {
			if (text.includes("=")) {
				const formData = new URLSearchParams(text);
				data = Object.fromEntries(formData.entries());
			} else {
				throw new BadRequest("Invalid URLSearchParams format");
			}
		} catch (_formDataError) {
			throw new BadRequest("Failed to extract data from request");
		}
	}

	return data;
}

export { decodeRequestBody };
