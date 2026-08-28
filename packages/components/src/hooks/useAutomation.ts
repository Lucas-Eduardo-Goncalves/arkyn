import { useEffect } from "react";
import { scroller } from "react-scroll";
import { badResponses } from "../templates/badResponses";
import { successResponses } from "../templates/successResponses";
import { useModal } from "./useModal";
import { useToast } from "./useToast";

/**
 * useAutomation, runs UI side-effects (close modals, scroll, toast) in response to a server action payload.
 *
 * Pass the raw response from a form submission. On every change the hook:
 * 1. Closes all open modals if `closeModal` is `true`.
 * 2. Smooth-scrolls to a named element if `cause.data.scrollTo` is set.
 * 3. Shows a toast based on `name` (matched against `successResponses`/`badResponses`) and `message`.
 *    When `cause.fieldErrors` is present, the first field error takes priority in the toast.
 *    The message `"Unprocessable entity"` is intentionally suppressed.
 *
 * @param formResponseData - Raw server response payload.
 * @param formResponseData.closeModal - Closes all open modals when `true`.
 * @param formResponseData.name - Response identifier matched against success/bad response lists.
 * @param formResponseData.message - Text shown in the toast notification.
 * @param formResponseData.cause.data.scrollTo - Element name to scroll to via `react-scroll`.
 * @param formResponseData.cause.fieldErrors - Field-level errors; the first value is shown in the toast.
 *
 * @example
 * ```tsx
 * // After a successful create action
 * useAutomation({ closeModal: true, name: "created", message: "Saved successfully" });
 * ```
 *
 * @example
 * ```tsx
 * // Validation error with field-level feedback and scroll
 * useAutomation({
 *   name: "validation_error",
 *   message: "Invalid payload",
 *   cause: {
 *     data: { scrollTo: "email" },
 *     fieldErrors: { email: "E-mail is required" },
 *   },
 * });
 * ```
 */

// biome-ignore lint/suspicious/noExplicitAny: intentional
function useAutomation(formResponseData: any) {
	const { closeAll } = useModal();
	const { showToast } = useToast();

	useEffect(() => {
		const closeModal = formResponseData?.closeModal;
		const message = formResponseData?.message;
		const name = formResponseData?.name;
		const scrollTo = formResponseData?.cause?.data?.scrollTo;
		const firstErrorField = formResponseData?.cause?.fieldErrors
			? (Object.values(formResponseData?.cause?.fieldErrors)[0] as string)
			: null;

		if (closeModal) closeAll();
		if (scrollTo) scroller.scrollTo(scrollTo, { smooth: true, offset: 20 });

		if (!message && !firstErrorField) return;

		if (successResponses.includes(name)) {
			showToast({ message, type: "success" });
			return;
		}

		if (!badResponses.includes(name)) return;
		if (firstErrorField) {
			showToast({ message: firstErrorField, type: "danger" });
			return;
		}

		if (message === "Unprocessable entity") return;
		showToast({ message, type: "danger" });
	}, [formResponseData, closeAll, showToast]);
}

export { useAutomation };
