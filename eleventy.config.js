import sections from "./src/_data/sections.js";
import ui from "./src/_data/ui.js";
import site from "./src/_data/site.js";

const LANGS = ["bg", "en"];
const TOPIC_BASE = { bg: "/bg/temi/", en: "/en/topics/" };

const BG_MAP = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
};

export function slugify(str) {
  return String(str)
    .toLowerCase()
    .split("")
    .map((c) => BG_MAP[c] ?? c)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const toDate = (d) => (d instanceof Date ? d : new Date(d));
const lastChange = (item) => toDate(item.data.updated || item.data.published);
const newestFirst = (a, b) => lastChange(b) - lastChange(a);
const stripHtml = (html) =>
  String(html || "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
const sectionOf = (key, lang) => sections[lang].find((s) => s.key === key);

export default function (eleventyConfig) {
  // GitHub Pages на подадрес (напр. /kum-sebe-si): добавя префикс към вътрешните адреси при билд
  const prefix = (process.env.PATH_PREFIX || "").replace(/[/]$/, "");
  if (prefix) {
    eleventyConfig.addTransform("pathPrefix", function (content) {
      if (!(this.page.outputPath || "").endsWith(".html")) return content;
      return content
        .replace(/(href|src|action|data-index)="[/](?![/])/g, `$1="${prefix}/`)
        .replace(/url[(]'[/](?![/])/g, `url('${prefix}/`)
        .replace(/url=[/](?![/])/g, `url=${prefix}/`)
        .replace(/replace[(]"[/]/g, `replace("${prefix}/`);
    });
  }

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/admin");

  const published = (api) => api.getFilteredByTag("article").filter((i) => !i.data.draft);

  eleventyConfig.addCollection("articles", (api) => published(api).sort(newestFirst));
  for (const lang of LANGS) {
    eleventyConfig.addCollection(`articles_${lang}`, (api) =>
      published(api).filter((i) => i.data.lang === lang).sort(newestFirst)
    );
    // Една страница за всяка тема (таг)
    eleventyConfig.addCollection(`topicPages_${lang}`, (api) => {
      const counts = new Map();
      for (const item of published(api).filter((i) => i.data.lang === lang)) {
        for (const t of item.data.topics || []) counts.set(t, (counts.get(t) || 0) + 1);
      }
      return [...counts]
        .map(([name, count]) => ({ lang, name, count, url: `${TOPIC_BASE[lang]}${slugify(name)}/` }))
        .sort((a, b) => a.name.localeCompare(b.name, lang));
    });
  }

  eleventyConfig.addFilter("slug", slugify);
  eleventyConfig.addFilter("topicUrl", (name, lang) => `${TOPIC_BASE[lang]}${slugify(name)}/`);
  eleventyConfig.addFilter("fmtDate", (d, lang) =>
    d
      ? new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "bg-BG", {
          day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
        }).format(toDate(d))
      : ""
  );
  eleventyConfig.addFilter("isoDate", (d) => (d ? toDate(d).toISOString().slice(0, 10) : ""));
  eleventyConfig.addFilter("readingTime", (html) =>
    Math.max(1, Math.round(stripHtml(html).split(" ").length / 200))
  );
  eleventyConfig.addFilter("bySection", (list, key) => list.filter((i) => i.data.section === key));
  eleventyConfig.addFilter("withTopic", (list, name) => list.filter((i) => (i.data.topics || []).includes(name)));
  eleventyConfig.addFilter("topicsOf", (list, lang) =>
    [...new Set(list.flatMap((i) => i.data.topics || []))].sort((a, b) => a.localeCompare(b, lang))
  );
  eleventyConfig.addFilter("featured", (list) => list.filter((i) => i.data.featured));
  eleventyConfig.addFilter("findSection", sectionOf);
  eleventyConfig.addFilter("translationUrl", (list, key, lang) => {
    if (!key) return "";
    const match = list.find((i) => i.data.translationKey === key && i.data.lang === lang);
    return match ? match.url : "";
  });

  // Свързани статии: изрично посочени > общи теми > същия раздел
  eleventyConfig.addFilter("relatedArticles", (list, url, keys = [], topics = [], section, limit = 3) =>
    list
      .filter((i) => i.url !== url)
      .map((i) => {
        let score = 0;
        if ((keys || []).includes(i.data.translationKey)) score += 10;
        score += 2 * (i.data.topics || []).filter((t) => (topics || []).includes(t)).length;
        if (i.data.section === section) score += 1;
        return { i, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.i)
  );

  eleventyConfig.addFilter("searchIndex", (list, lang) =>
    JSON.stringify(
      list.map((i) => ({
        url: i.url,
        title: i.data.title,
        description: i.data.description || "",
        topics: i.data.topics || [],
        sectionTitle: sectionOf(i.data.section, lang)?.title || "",
        cw: Boolean(i.data.contentWarning),
        text: stripHtml(i.templateContent).slice(0, 6000),
      }))
    )
  );

  // Структурирани данни (JSON-LD) за търсачките
  eleventyConfig.addFilter("jsonLd", function () {
    const d = this.ctx || {};
    const lang = d.lang;
    if (!lang) return "";
    const t = ui[lang];
    const abs = (u) => site.url + u;
    const pageUrl = d.page?.url || "/";
    const org = { "@type": "Organization", name: t.siteName, url: abs(`/${lang}/`) };
    const sec = d.section ? sectionOf(d.section, lang) : null;
    const img = abs(`/assets/img/${d.section || "hero"}.webp`);
    const crumbs = [{ name: t.home, url: abs(`/${lang}/`) }];
    if (sec && pageUrl !== sec.url) crumbs.push({ name: sec.title, url: abs(sec.url) });
    if (d.published || (sec && pageUrl === sec.url)) crumbs.push({ name: d.title, url: abs(pageUrl) });
    const graph = [];
    if (pageUrl === `/${lang}/`) {
      graph.push({ "@type": "WebSite", name: t.siteName, url: abs(pageUrl), inLanguage: lang, description: t.siteDesc });
    } else {
      graph.push({
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
      });
    }
    if (d.published) {
      graph.push({
        "@type": "Article",
        headline: d.title,
        description: d.description,
        inLanguage: lang,
        image: img,
        datePublished: toDate(d.published).toISOString().slice(0, 10),
        dateModified: toDate(d.updated || d.published).toISOString().slice(0, 10),
        mainEntityOfPage: abs(pageUrl),
        author: org,
        publisher: org,
        ...(d.reviewedBy ? { reviewedBy: { "@type": "Person", name: d.reviewedBy } } : {}),
      });
    }
    return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).split("<").join(String.fromCharCode(92) + "u003c");
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
