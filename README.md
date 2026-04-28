<div align="center">

# Opensophy Hub

### Реализовать Hub — значит превратить статическую документацию в живой продукт.

**Static-first knowledge platform: Markdown as content, SPA as experience.**

[Русский](./github/README.ru.md) · [English](./github/README.en.md)

[Demo](https://opensophy.com) · [Documentation](https://opensophy.com/docs/homepage-system/) · [Components](https://opensophy.com/docs/component-guide/)

</div>

---

## What makes Hub unique?

Most alternatives force a tradeoff:
- either static docs with simple markdown,
- or dynamic SaaS docs with limited customization.

**Opensophy Hub combines both sides:**
- static deploy and repo-owned content,
- rich interactive markdown blocks,
- app-like UX in a static output,
- live UI playground directly inside docs pages.

In short: **Hub is a docs engine where markdown pages can behave like mini-apps without backend lock-in.**

## Demo

- 🌐 Live: https://opensophy.com
- 🧩 UI components: https://opensophy.com/docs/component-guide/
- 📝 Markdown guide: https://opensophy.com/docs/markdown-guide/

## Key capabilities

- Advanced markdown tables (filters, search, fullscreen, export)
- Rich markdown blocks (cards, steps, alerts, charts, etc.)
- Theme support (dark/light)
- Auto-generated navigation from `Docs/`
- Static output with sitemap generation

## Quick start

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Quality checks:

```bash
npm run lint
npm run check
```

## Project docs for contributors

Inside `github/`:
- [CONTRIBUTING.md](./github/CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./github/CODE_OF_CONDUCT.md)
- [CHANGELOG.md](./github/CHANGELOG.md)
- [ROADMAP.md](./github/ROADMAP.md)

## License

- Code: [Apache 2.0](./LICENSE)
- Documentation content: [CC BY-ND 4.0](./LICENSE-DOCS)
