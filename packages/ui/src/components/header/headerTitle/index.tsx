import type { HTMLAttributes } from "react";

import "./styles.css";

type HeaderTitleProps = HTMLAttributes<HTMLDivElement> & {
	/** Main heading text. Required. */
	title: string;
	/** Breadcrumb trail rendered above the title, e.g. `["Pacientes", "Francisco Dias"]`. */
	breadcrumb?: string[];
};

/**
 * HeaderTitle, page title (and optional breadcrumb) rendered inside a `HeaderRoot`.
 *
 * @param props.title - Main heading text. Required.
 * @param props.breadcrumb - Breadcrumb trail rendered above the title.
 *
 * **...Other valid HTML `<div>` properties**
 *
 * @returns HeaderTitle JSX element.
 *
 * @example
 * ```tsx
 * <HeaderTitle title="Consultas" breadcrumb={["Pacientes", "Francisco Dias"]} />
 * ```
 */
function HeaderTitle(props: HeaderTitleProps) {
	const { title, breadcrumb, className: baseClassName, ...rest } = props;
	const className = `arkynHeaderTitle ${baseClassName ?? ""}`.trim();

	return (
		<div className={className} {...rest}>
			{breadcrumb && breadcrumb.length > 0 && (
				<span className="arkynHeaderTitleBreadcrumb">
					{breadcrumb.join(" / ")}
				</span>
			)}
			<h1 className="arkynHeaderTitleHeading">{title}</h1>
		</div>
	);
}

export { HeaderTitle };
