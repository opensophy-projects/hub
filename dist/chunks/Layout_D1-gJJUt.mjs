import { b as createAstro, c as createComponent, a as renderTemplate, d as renderScript, e as renderSlot, f as renderHead, u as unescapeHTML, g as addAttribute } from './astro/server_JHJ0UGSK.mjs';
import 'piccolore';
import 'clsx';
/* empty css                          */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro("https://hub.opensophy.com");
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const {
    title,
    description,
    image,
    url,
    type = "article",
    author,
    date,
    keywords,
    canonical,
    robots = "index, follow",
    lang = "ru"
  } = Astro2.props;
  const siteUrl = "https://hub.opensophy.com";
  const fullUrl = new URL(url, siteUrl).toString();
  const ogImage = image || `${siteUrl}/banner.png`;
  const jsonLd = type === "article" ? {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: ogImage,
    author: {
      "@type": "Person",
      name: author
    },
    datePublished: date,
    dateModified: date
  } : {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: fullUrl
  };
  return renderTemplate(_a || (_a = __template(["<html", `> <head><meta charset="UTF-8"><link rel="icon" type="image/png" href="/favicon.png?v=1"><link rel="icon" type="image/x-icon" href="/favicon.png?v=1"><link rel="shortcut icon" href="/favicon.png?v=1"><link rel="apple-touch-icon" href="/favicon.png?v=1" sizes="180x180"><link rel="apple-touch-icon-precomposed" href="/favicon.png?v=1" sizes="180x180"><script>
      (function() {
        const theme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme ? theme === 'dark' : prefersDark;
        
        const html = document.documentElement;
        
        if (isDark) {
          html.classList.add('dark');
          html.style.backgroundColor = '#0a0a0a';
          html.style.color = '#ffffff';
          html.style.colorScheme = 'dark';
        } else {
          html.classList.remove('dark');
          html.style.backgroundColor = '#E8E7E3';
          html.style.color = '#000000';
          html.style.colorScheme = 'light';
        }
      })();
    <\/script><style>
      body {
        margin: 0;
        padding: 0;
      }
      
      html.dark body {
        background-color: #0a0a0a;
        color: #ffffff;
      }
      
      html:not(.dark) body {
        background-color: #E8E7E3;
        color: #000000;
      }
    </style><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="description"`, ">", "", "", '<meta name="theme-color" content="#0a0a0a"><meta name="msapplication-TileColor" content="#0a0a0a"><meta name="msapplication-TileImage" content="/favicon.png?v=1"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="format-detection" content="telephone=no"><meta property="og:title"', '><meta property="og:description"', '><meta property="og:image"', '><meta property="og:url"', '><meta property="og:type"', '><meta property="og:locale" content="ru_RU"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title"', '><meta name="twitter:description"', '><meta name="twitter:image"', ">", "", '<link rel="sitemap" href="/sitemap.xml" type="application/xml"><title>', ' | Opensophy</title><script type="application/ld+json">', "<\/script>", '</head> <body> <div id="theme-provider-root"> ', " </div> ", " </body> </html>"])), addAttribute(lang, "lang"), addAttribute(description, "content"), keywords && renderTemplate`<meta name="keywords"${addAttribute(keywords, "content")}>`, robots && renderTemplate`<meta name="robots"${addAttribute(robots, "content")}>`, canonical && renderTemplate`<link rel="canonical"${addAttribute(canonical, "href")}>`, addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), addAttribute(fullUrl, "content"), addAttribute(type, "content"), addAttribute(title, "content"), addAttribute(description, "content"), addAttribute(ogImage, "content"), author && renderTemplate`<meta name="author"${addAttribute(author, "content")}>`, date && renderTemplate`<meta property="article:published_time"${addAttribute(date, "content")}>`, title, unescapeHTML(JSON.stringify(jsonLd)), renderHead(), renderSlot($$result, $$slots["default"]), renderScript($$result, "/home/project/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts"));
}, "/home/project/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
