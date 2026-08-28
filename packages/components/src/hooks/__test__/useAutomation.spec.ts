import { renderHook } from "@testing-library/react";
import { scroller } from "react-scroll";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAutomation } from "../useAutomation";
import { useModal } from "../useModal";
import { useToast } from "../useToast";

vi.mock("../useModal", () => ({ useModal: vi.fn() }));
vi.mock("../useToast", () => ({ useToast: vi.fn() }));
vi.mock("react-scroll", () => ({ scroller: { scrollTo: vi.fn() } }));

describe("useAutomation", () => {
	const closeAll = vi.fn();
	const showToast = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		// biome-ignore lint/suspicious/noExplicitAny: partial mock of the context return type
		vi.mocked(useModal).mockReturnValue({ closeAll } as any);
		// biome-ignore lint/suspicious/noExplicitAny: partial mock of the context return type
		vi.mocked(useToast).mockReturnValue({ showToast } as any);
	});

	it("should do nothing when formResponseData is undefined", () => {
		renderHook(() => useAutomation(undefined));

		expect(closeAll).not.toHaveBeenCalled();
		expect(scroller.scrollTo).not.toHaveBeenCalled();
		expect(showToast).not.toHaveBeenCalled();
	});

	it("should close all modals when closeModal is true", () => {
		renderHook(() => useAutomation({ closeModal: true }));

		expect(closeAll).toHaveBeenCalledTimes(1);
	});

	it("should not close modals when closeModal is false or absent", () => {
		renderHook(() => useAutomation({ closeModal: false }));

		expect(closeAll).not.toHaveBeenCalled();
	});

	it("should scroll to the element named in cause.data.scrollTo", () => {
		renderHook(() => useAutomation({ cause: { data: { scrollTo: "email" } } }));

		expect(scroller.scrollTo).toHaveBeenCalledWith("email", {
			smooth: true,
			offset: 20,
		});
	});

	it("should not scroll when scrollTo is absent", () => {
		renderHook(() => useAutomation({ message: "hello" }));

		expect(scroller.scrollTo).not.toHaveBeenCalled();
	});

	it("should show a success toast when name matches successResponses", () => {
		renderHook(() =>
			useAutomation({ name: "Created", message: "Item created" }),
		);

		expect(showToast).toHaveBeenCalledWith({
			message: "Item created",
			type: "success",
		});
	});

	it("should show a danger toast when name matches badResponses", () => {
		renderHook(() =>
			useAutomation({ name: "BadRequest", message: "Invalid payload" }),
		);

		expect(showToast).toHaveBeenCalledWith({
			message: "Invalid payload",
			type: "danger",
		});
	});

	it("should prioritize the first field error over the message for bad responses", () => {
		renderHook(() =>
			useAutomation({
				name: "UnprocessableEntity",
				message: "Invalid payload",
				cause: { fieldErrors: { email: "E-mail is required" } },
			}),
		);

		expect(showToast).toHaveBeenCalledWith({
			message: "E-mail is required",
			type: "danger",
		});
	});

	it("should use the first value when there are multiple field errors", () => {
		renderHook(() =>
			useAutomation({
				name: "UnprocessableEntity",
				cause: {
					fieldErrors: {
						email: "E-mail is required",
						name: "Name is required",
					},
				},
			}),
		);

		expect(showToast).toHaveBeenCalledWith({
			message: "E-mail is required",
			type: "danger",
		});
	});

	it("should suppress the toast when message is exactly Unprocessable entity", () => {
		renderHook(() =>
			useAutomation({
				name: "UnprocessableEntity",
				message: "Unprocessable entity",
			}),
		);

		expect(showToast).not.toHaveBeenCalled();
	});

	it("should not show a toast when name is not a known success or bad response", () => {
		renderHook(() =>
			useAutomation({ name: "SomethingElse", message: "hello" }),
		);

		expect(showToast).not.toHaveBeenCalled();
	});

	it("should not show a toast when there is no message and no field error", () => {
		renderHook(() => useAutomation({ name: "Created" }));

		expect(showToast).not.toHaveBeenCalled();
	});

	it("should show the toast again when a new response repeats the same name and message", () => {
		const { rerender } = renderHook(({ data }) => useAutomation(data), {
			initialProps: {
				data: { name: "BadRequest", message: "Internal Server Error" },
			},
		});

		expect(showToast).toHaveBeenCalledTimes(1);

		rerender({
			data: { name: "BadRequest", message: "Internal Server Error" },
		});

		expect(showToast).toHaveBeenCalledTimes(2);
		expect(showToast).toHaveBeenLastCalledWith({
			message: "Internal Server Error",
			type: "danger",
		});
	});

	it("should re-run side effects when formResponseData changes between renders", () => {
		const { rerender } = renderHook(({ data }) => useAutomation(data), {
			initialProps: { data: { name: "Created", message: "First" } },
		});

		expect(showToast).toHaveBeenCalledWith({
			message: "First",
			type: "success",
		});

		rerender({ data: { name: "Created", message: "Second" } });

		expect(showToast).toHaveBeenCalledWith({
			message: "Second",
			type: "success",
		});
		expect(showToast).toHaveBeenCalledTimes(2);
	});
});
