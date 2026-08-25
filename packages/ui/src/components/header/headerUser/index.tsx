import type { ButtonHTMLAttributes } from "react";

import "./styles.css";

type HeaderUserProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	/** Display name shown next to the avatar. Required. */
	name: string;
	/** Avatar image URL. When omitted, the first letter of `name` is rendered instead. */
	avatarUrl?: string;
};

/**
 * HeaderUser, logged-in user summary (avatar + name) rendered inside a `HeaderRoot`.
 *
 * Renders as a `<button>` so it can open a dropdown/menu on click, wire `onClick` yourself.
 *
 * @param props.name - Display name shown next to the avatar. Required.
 * @param props.avatarUrl - Avatar image URL. Falls back to the first letter of `name`.
 *
 * **...Other valid HTML `<button>` properties**
 *
 * @returns HeaderUser JSX element.
 *
 * @example
 * ```tsx
 * <HeaderUser name="Francisco Dias" avatarUrl={user.avatarUrl} onClick={openUserMenu} />
 * ```
 */
function HeaderUser(props: HeaderUserProps) {
	const { name, avatarUrl, className: baseClassName, ...rest } = props;
	const className = `arkynHeaderUser ${baseClassName ?? ""}`.trim();

	return (
		<button type="button" className={className} {...rest}>
			{avatarUrl ? (
				<img className="arkynHeaderUserAvatar" src={avatarUrl} alt="" />
			) : (
				<span className="arkynHeaderUserAvatarFallback">
					{name.charAt(0).toUpperCase()}
				</span>
			)}
			<span className="arkynHeaderUserName">{name}</span>
		</button>
	);
}

export { HeaderUser };
