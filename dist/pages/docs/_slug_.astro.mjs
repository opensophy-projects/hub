/* empty css                                     */
import { b as createAstro, c as createComponent, r as renderComponent, a as renderTemplate } from '../../chunks/astro/server_JHJ0UGSK.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../chunks/Layout_CWlFfa8B.mjs';
import { d as docs } from '../../chunks/docs_D3RDBT7f.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro("https://hub.opensophy.com");
async function getStaticPaths() {
  const docsByType = docs.filter((d) => d.type === "docs");
  return docsByType.map((doc) => ({
    params: { slug: doc.slug },
    props: { doc }
  }));
}
const $$slug = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  const { doc } = Astro2.props;
  if (!doc) {
    return Astro2.redirect("/404");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": doc.title, "description": doc.description, "image": doc.image, "url": `/docs/${doc.slug}`, "type": "article", "author": doc.author, "date": doc.date, "keywords": doc.keywords, "robots": doc.robots }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "DocContent", null, { "client:only": "react", "doc": doc, "client:component-hydration": "only", "client:component-path": "@/components/DocContent", "client:component-export": "default" })} ` })}`;
}, "/home/project/src/pages/docs/[slug].astro", void 0);

const $$file = "/home/project/src/pages/docs/[slug].astro";
const $$url = "/docs/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
