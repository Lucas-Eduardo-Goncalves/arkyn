/**
 * Serializes a value so it can be embedded as a JS string literal inside an inline
 * `<script>` snippet. Wraps `JSON.stringify` (which already escapes quotes/backslashes/
 * control characters) and additionally escapes `<` so a value containing `</script>`
 * can't prematurely close the surrounding script tag.
 *
 * @example
 * ```typescript
 * `gtag('config', ${toSafeScriptString(measurementId)});`
 * // measurementId = "G-XXXX" -> gtag('config', "G-XXXX");
 * // measurementId = "\"); alert(1); //" -> gtag('config', "\"); alert(1); //");
 * ```
 */
function toSafeScriptString(value: unknown): string {
	return JSON.stringify(value ?? "").replace(/</g, "\\u003C");
}

/**
 * Serializes an object/array to JSON for embedding inside an inline `<script>` snippet,
 * escaping `<` so a value containing `</script>` can't prematurely close the script tag.
 */
function toSafeScriptJson(value: unknown): string {
	return JSON.stringify(value).replace(/</g, "\\u003C");
}

/** Whether `name` is a valid bare JS identifier (safe to use as `window.<name>`). */
function isValidJsIdentifier(name: string): boolean {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

export { isValidJsIdentifier, toSafeScriptJson, toSafeScriptString };
