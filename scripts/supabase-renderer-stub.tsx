// vite-ssr-components/hono 的 Deno 构建替代。
// 原组件依赖 Vite 运行时（import.meta.glob / import.meta.env），
// 本文件仅在 vite.config.deno.ts 中通过 alias 替换，不进入其他平台构建。

type LinkProps = { href?: string; rel?: string } & Record<string, unknown>

export function ViteClient(): unknown {
	return null
}

export function Link(props: LinkProps) {
	const { href, rel, ...rest } = props
	return <link href={href} rel={rel} {...rest} />
}
