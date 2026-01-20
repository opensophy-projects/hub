/* empty css                                  */
import { c as createComponent, r as renderComponent, a as renderTemplate } from '../chunks/astro/server_JHJ0UGSK.mjs';
import 'piccolore';
import { $ as $$Layout } from '../chunks/Layout_CWlFfa8B.mjs';
export { renderers } from '../renderers.mjs';

const $$404 = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "404 - \u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430", "description": "\u0417\u0430\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u0435\u043C\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430", "url": "/404", "robots": "noindex, nofollow" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "NotFound", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "@/components/NotFound", "client:component-export": "default" })} ` })}`;
}, "/home/project/src/pages/404.astro", void 0);

const $$file = "/home/project/src/pages/404.astro";
const $$url = "/404";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$404,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
