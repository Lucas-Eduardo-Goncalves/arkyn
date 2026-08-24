import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RichText } from "../richText";

// These 6 scenarios exercise real typing/selection inside RichText's Slate
// editor. jsdom doesn't implement native contenteditable text editing
// (Slate depends on real `beforeinput` + Selection-API behavior, including
// `InputEvent.getTargetRanges()`, to turn keystrokes into document changes),
// so `user.type()`/`user.keyboard()` never reach Slate's `onChange` under
// jsdom - see the "typing behaviour" and "maxLimit and enforceCharacterLimit
// props" describe blocks in `richText.spec.tsx` for the jsdom-safe coverage
// of this component. This file runs under Vitest Browser Mode (real
// Chromium via Playwright, configured in `vitest.config.ts`) instead, where
// contenteditable behaves like it does for real users.
function getHiddenInput(container: HTMLElement, name: string) {
	return container.querySelector(
		`input[type="hidden"][name="${name}"]`,
	) as HTMLInputElement;
}

// `userEvent`'s `{End}` key relies on `HTMLInputElement.setSelectionRange`,
// which contenteditable elements don't implement, so it throws "Not
// implemented" here. Placing the caret at the end of a contenteditable's
// content instead means driving the real Selection API directly - this is
// exactly the API real browsers expose (and jsdom doesn't) for Slate to sync
// its own selection from.
function placeCaretAtEnd(root: HTMLElement) {
	const selection = window.getSelection();
	if (!selection) return;

	const range = document.createRange();
	range.selectNodeContents(root);
	range.collapse(false);
	selection.removeAllRanges();
	selection.addRange(range);
}

describe("RichText (browser mode)", () => {
	afterEach(() => {
		cleanup();
	});

	describe("typing behaviour", () => {
		it("should fire onChange with the updated Slate value when typing", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<RichText name="content" onChange={handleChange} />);

			const editable = screen.getByRole("textbox");
			await user.click(editable);
			await user.type(editable, "Hi");

			expect(handleChange).toHaveBeenCalled();
			const lastCallValue = handleChange.mock.calls.at(-1)?.[0];
			expect(JSON.stringify(lastCallValue)).toContain("Hi");
		});

		it("should update the hidden content input value as the user types", async () => {
			const user = userEvent.setup();

			const { container } = render(<RichText name="content" />);

			const editable = screen.getByRole("textbox");
			await user.click(editable);
			await user.type(editable, "Hi");

			const hiddenInput = getHiddenInput(container, "content");
			expect(hiddenInput.value).toContain("Hi");
		});

		it("should call onChangeCharactersCount on every keystroke with the current count", async () => {
			const user = userEvent.setup();
			const handleCount = vi.fn();

			render(<RichText name="content" onChangeCharactersCount={handleCount} />);

			const editable = screen.getByRole("textbox");
			await user.click(editable);
			await user.type(editable, "abc");

			// RichText wires both the Slate `onChange` and `onValueChange` props
			// to the same `handleChange` (see `richText/index.tsx`), so each
			// keystroke's resulting count is reported twice in a real browser -
			// something the jsdom version of this test never actually verified,
			// since real Slate typing doesn't work under jsdom at all.
			expect(handleCount).toHaveBeenCalledTimes(6);
			expect(handleCount.mock.calls.map((call) => call[0])).toEqual([
				1, 1, 2, 2, 3, 3,
			]);
		});

		it("should update the character count hidden input as the user types", async () => {
			const user = userEvent.setup();

			const { container } = render(<RichText name="content" />);

			const editable = screen.getByRole("textbox");
			await user.click(editable);
			await user.type(editable, "abc");

			const hiddenCountInput = getHiddenInput(container, "contentCount");
			expect(hiddenCountInput.value).toBe("3");
		});
	});

	describe("maxLimit and enforceCharacterLimit props", () => {
		it("should still call onChangeCharactersCount even when the character limit is enforced", async () => {
			const user = userEvent.setup();
			const handleCount = vi.fn();
			const value = JSON.stringify([
				{ type: "paragraph", children: [{ text: "abcde" }] },
			]);

			render(
				<RichText
					name="content"
					defaultValue={value}
					maxLimit={5}
					enforceCharacterLimit
					onChangeCharactersCount={handleCount}
				/>,
			);

			const editable = screen.getByRole("textbox");
			await user.click(editable);
			await user.type(editable, "f");

			expect(handleCount).toHaveBeenCalledWith(6);
		});

		it("should allow typing past the default maxLimit when enforceCharacterLimit is false", async () => {
			const user = userEvent.setup();
			const value = JSON.stringify([
				{ type: "paragraph", children: [{ text: "abcde" }] },
			]);

			const { container } = render(
				<RichText name="content" defaultValue={value} maxLimit={5} />,
			);

			const editable = screen.getByRole("textbox");
			await user.click(editable);
			// A plain click doesn't reliably land the caret at the end of the
			// existing "abcde" text (its exact position depends on where the
			// click's default coordinates fall relative to the rendered glyphs),
			// so explicitly move to the end before typing. `f` is asserted to
			// land after "abcde", not just anywhere in the document.
			placeCaretAtEnd(editable);
			await user.type(editable, "f", { skipClick: true });

			const hiddenInput = getHiddenInput(container, "content");
			expect(hiddenInput.value).toContain("abcdef");
		});
	});
});
