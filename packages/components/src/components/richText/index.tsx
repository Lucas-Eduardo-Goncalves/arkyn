import { isHotkey } from "is-hotkey";
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	Code,
	Heading1,
	Heading2,
	Italic,
	Quote,
	Underline,
} from "lucide-react";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { createEditor, type Descendant } from "slate";
import { withHistory } from "slate-history";
import { Editable, Slate, withReact } from "slate-react";
import { useForm } from "../../hooks/useForm";
import { clearLinkMarkAtBoundary } from "../../services/clearLinkMarkAtBoundary";
import { extractTextFromNode } from "../../services/extractTextFromNode";
import { FieldTemplate } from "../../services/fieldTemplate";
import { toggleMark } from "../../services/toggleMark";
import { hotKeys, initialValue } from "../../templates/richTextTemplates";
import type {
	RichTextHiddenButtonKey,
	RichTextProps,
} from "../../types/richTextTypes";
import { BlockButton } from "./blockButton";
import { Element } from "./element";
import { InsertImage } from "./insertImage";
import { InsertLink } from "./insertLink";
import { InsertVideo } from "./insertVideo";
import { Leaf } from "./leaf";
import { MarkButton } from "./markButton";
import { Toolbar } from "./toolbar";
import "./styles.css";

/**
 * RichText, WYSIWYG rich-text editor built on Slate.js with a configurable toolbar.
 *
 * **Toolbar features:** bold, italic, underline, code, H1/H2, block quote, alignment (left/center/right/justify), image, video, and link insertion.
 * Pressing Space or Enter right after a link automatically stops new text from continuing to be part of that link.
 *
 * Editor content is stored as a Slate JSON string in a hidden `<input>` for form submission.
 * Integrates with `useForm` to display validation errors by field name.
 *
 * @param props.name - Field name for form submission. Required.
 * @param props.label - Label text displayed above the editor.
 * @param props.hiddenButtons - Toolbar button keys to hide (e.g. `["image", "code"]`).
 * @param props.imageConfig - Enables image insertion; contains the upload endpoint and modal labels.
 * @param props.videoConfig - Customizes the video insertion modal labels.
 * @param props.linkConfig - Customizes the link insertion modal labels.
 * @param props.defaultValue - Initial editor content as a Slate JSON string. Default: "[]"
 * @param props.maxLimit - Maximum character count. Default: 10000
 * @param props.enforceCharacterLimit - Prevents typing past `maxLimit`. Default: false
 * @param props.onChangeCharactersCount - Callback fired on every keystroke, receives the current character count.
 * @param props.onChange - Callback fired when editor content changes, receives the Slate `Descendant[]`.
 * @param props.baseErrorMessage - Custom error message (overrides `useForm` context error).
 * @param props.isError - Forces the error visual state.
 * @param props.id - Custom id for the editable area element.
 * @param props.showAsterisk - Appends `*` to the label.
 * @param props.orientation - Layout direction. Default: "vertical"
 * @param props.unShowFieldTemplate - Skips wrapper, label, and error rendering. Default: false
 *
 * @returns RichText JSX element wrapped in `FieldTemplate`.
 *
 * @example
 * ```tsx
 * // Basic
 * <RichText name="content" />
 *
 * // With character limit and hidden toolbar buttons
 * <RichText
 *   name="description"
 *   label="Description"
 *   maxLimit={500}
 *   enforceCharacterLimit
 *   hiddenButtons={["image", "video", "code"]}
 *   onChangeCharactersCount={(n) => setCharCount(n)}
 * />
 *
 * // With image upload support
 * <RichText
 *   name="article"
 *   label="Article Body"
 *   imageConfig={{ action: "/api/upload" }}
 * />
 *
 * // With custom link insertion modal labels
 * <RichText
 *   name="article"
 *   label="Article Body"
 *   linkConfig={{ modalTitle: "Add a link" }}
 * />
 * ```
 */

function RichText(props: RichTextProps) {
	const {
		name,
		hiddenButtons,
		imageConfig,
		videoConfig,
		linkConfig,
		className: wrapperClassName = "",
		defaultValue = "[]",
		enforceCharacterLimit = false,
		onChangeCharactersCount,
		baseErrorMessage,
		maxLimit = 10000,
		onChange,
		isError: baseIsError,
		label,
		showAsterisk,
		id,
		orientation = "vertical",
		unShowFieldTemplate = false,
	} = props;

	const editor = useMemo(() => withHistory(withReact(createEditor())), []);

	const { fieldErrors } = useForm();

	const defaultNodes = useMemo((): Descendant[] => {
		try {
			const parsedNodes = JSON.parse(defaultValue);
			if (!Array.isArray(parsedNodes) || parsedNodes.length === 0) {
				return structuredClone(initialValue);
			}

			const isValidNodes = parsedNodes.every(
				(node) =>
					typeof node === "object" &&
					node !== null &&
					"type" in node &&
					"children" in node,
			);

			return isValidNodes ? parsedNodes : structuredClone(initialValue);
		} catch (_error) {
			return structuredClone(initialValue);
		}
	}, [defaultValue]);

	const textFromNodes = extractTextFromNode(defaultNodes);

	const [charactersCount, setCharactersCount] = useState(textFromNodes.length);
	const [inputValue, setInputValue] = useState(
		JSON.stringify(defaultNodes) || "[]",
	);

	const [onFocus, setOnFocus] = useState(false);

	const ref = useRef<HTMLInputElement>(null);
	const generatedId = useId();
	const inputId = id || generatedId;

	const errorMessage = baseErrorMessage || fieldErrors?.[name];
	const isError = baseIsError || !!errorMessage;

	const renderLeaf = useCallback(Leaf, []);
	const renderElement = useCallback(Element, []);

	function handleChange(value: Descendant[]) {
		const text = extractTextFromNode(value);

		setCharactersCount(text.length);
		onChangeCharactersCount?.(text.length);

		if (enforceCharacterLimit && text.length >= maxLimit) {
			return;
		}

		setInputValue(JSON.stringify(value));
		onChange?.(value);
	}

	const focusClass = onFocus ? "focusTrue" : "focusFalse";
	const errorClass = isError
		? "errorTrue"
		: maxLimit < charactersCount
			? "errorTrue"
			: "errorFalse";

	const className = `arkynRichText ${errorClass} ${focusClass}`;

	const restatesCharacters = maxLimit - charactersCount;

	function buttonIsNotHidden(format: RichTextHiddenButtonKey) {
		return !hiddenButtons?.includes(format);
	}

	return (
		<FieldTemplate
			name={name}
			label={label}
			showAsterisk={showAsterisk}
			className={wrapperClassName}
			errorMessage={errorMessage}
			unShowFieldTemplate={unShowFieldTemplate}
			orientation={orientation}
		>
			<Slate
				editor={editor}
				initialValue={defaultNodes}
				onChange={handleChange}
				onValueChange={handleChange}
			>
				<div className={className}>
					<Toolbar>
						{buttonIsNotHidden("headingOne") && (
							<BlockButton format="headingOne" icon={Heading1} />
						)}

						{buttonIsNotHidden("headingTwo") && (
							<BlockButton format="headingTwo" icon={Heading2} />
						)}

						{buttonIsNotHidden("blockQuote") && (
							<BlockButton format="blockQuote" icon={Quote} />
						)}

						{buttonIsNotHidden("bold") && (
							<MarkButton format="bold" icon={Bold} />
						)}

						{buttonIsNotHidden("italic") && (
							<MarkButton format="italic" icon={Italic} />
						)}

						{buttonIsNotHidden("underline") && (
							<MarkButton format="underline" icon={Underline} />
						)}

						{buttonIsNotHidden("code") && (
							<MarkButton format="code" icon={Code} />
						)}

						{buttonIsNotHidden("left") && (
							<BlockButton format="left" icon={AlignLeft} />
						)}

						{buttonIsNotHidden("right") && (
							<BlockButton format="right" icon={AlignRight} />
						)}

						{buttonIsNotHidden("center") && (
							<BlockButton format="center" icon={AlignCenter} />
						)}

						{buttonIsNotHidden("justify") && (
							<BlockButton format="justify" icon={AlignJustify} />
						)}

						{imageConfig && buttonIsNotHidden("image") && (
							<InsertImage {...imageConfig} />
						)}

						{buttonIsNotHidden("video") && <InsertVideo {...videoConfig} />}

						{buttonIsNotHidden("link") && <InsertLink {...linkConfig} />}
					</Toolbar>

					<Editable
						className="editorContainer"
						renderElement={renderElement}
						renderLeaf={renderLeaf}
						spellCheck
						ref={ref}
						id={inputId}
						onFocus={() => setOnFocus(true)}
						onBlur={() => setOnFocus(false)}
						onKeyDown={(event) => {
							if (event.key === " " || event.key === "Enter") {
								clearLinkMarkAtBoundary(editor);
							}

							for (const hotkey in hotKeys) {
								// biome-ignore lint/suspicious/noExplicitAny: intentional
								if (isHotkey(hotkey, event as any)) {
									event.preventDefault();
									const mark = hotKeys[hotkey as keyof typeof hotKeys];
									toggleMark(editor, mark);
								}
							}
						}}
					/>

					{restatesCharacters < 0 && (
						<div className="restatesCharacters">{restatesCharacters}</div>
					)}
				</div>

				<input type="hidden" name={name} value={inputValue} />

				<input type="hidden" name={`${name}Count`} value={charactersCount} />
			</Slate>
		</FieldTemplate>
	);
}

export { RichText };
