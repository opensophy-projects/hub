/* empty css                                  */
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../chunks/astro/server_JHJ0UGSK.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_D1-gJJUt.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const title = "Hub - Opensophy";
  const description = "Hub \u043F\u0440\u043E\u0435\u043A\u0442\u0430 Opensophy. \u041D\u043E\u0432\u043E\u0441\u0442\u0438, \u0431\u043B\u043E\u0433\u0438, \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u0446\u0438\u044F \u0438 \u0441\u0442\u0430\u0442\u044C\u0438 \u043F\u043E \u0438\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u043C\u0443 \u0438\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442\u0443, \u043A\u0438\u0431\u0435\u0440\u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438, \u0443\u044F\u0437\u0432\u0438\u043C\u043E\u0441\u0442\u044F\u043C \u0438 \u0442\u0435\u0445\u043D\u043E\u043B\u043E\u0433\u0438\u044F\u043C.";
  const keywords = "Opensophy, \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u0446\u0438\u044F, \u0438\u0441\u043A\u0443\u0441\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0438\u043D\u0442\u0435\u043B\u043B\u0435\u043A\u0442, \u043A\u0438\u0431\u0435\u0440\u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C, \u0418\u0418, AI, security, \u0441\u0442\u0430\u0442\u044C\u0438, \u0431\u043B\u043E\u0433, \u043D\u043E\u0432\u043E\u0441\u0442\u0438";
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": title, "description": description, "url": "/", "type": "website", "keywords": keywords, "robots": "index, follow" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "DocsIndex", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "@/components/DocsIndex", "client:component-export": "default" })} ` })}`;
}, "/home/project/src/pages/index.astro", void 0);

const $$file = "/home/project/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
