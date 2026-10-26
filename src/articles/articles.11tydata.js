export default {
  layout: "article.njk",
  tags: ["article"],
  permalink: (data) => `/${data.lang}/articles/${data.page.fileSlug}/`,
};
