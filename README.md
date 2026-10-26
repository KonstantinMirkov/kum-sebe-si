# Към себе си / Towards Yourself

Двуезичен (BG/EN) образователен сайт. Статичен сайт с Eleventy; статиите са Markdown файлове.

## Стартиране
```
npm install
npm start          # http://localhost:8080/bg/
npm run build      # резултат в _site/
```

## Добавяне и редактиране на статии
**Вариант 1 – админ панел:** в два терминала `npm run cms` и `npm start`, после http://localhost:8080/admin/
(за онлайн работа сменете `backend` в `src/admin/config.yml` – напр. GitHub + Netlify).

**Вариант 2 – файл:** добавете `src/articles/bg/<id>.md` и `src/articles/en/<id>.md`
със същия `translationKey` (връзката между езиците и „Свързани теми“ зависи от него).

Полета: `title, description, translationKey, section (conditions|trauma|therapies|support), topics, published, updated,
reviewedBy, contentWarning, featured, draft, related, sources`.

- `updated` – показва се като дата на последна актуализация.
- `contentWarning` – читателят потвърждава преди да види статията.
- Без `reviewedBy` статията показва бележка, че не е прегледана от специалист.
- `draft: true` скрива статията.

## Спешни контакти
`src/_data/site.js` – добавяйте само проверени номера от официален източник и обновявайте `verified`.

## Преди публикуване
- Примерните статии са **чернови** – да се прегледат от психолог/психотерапевт/лекар.
- Проверете отново всички източници и спешни номера.
- Снимките са от Unsplash (виж `src/assets/img/CREDITS.md`).

## SEO
- Задайте реалния домейн при билд: `SITE_URL=https://вашият-домейн.bg npm run build` (или в `src/_data/site.js`). Нужен е за canonical, sitemap.xml и hreflang.
- Автоматично се генерират: мета описания, Open Graph, hreflang BG/EN, JSON-LD (Article, BreadcrumbList), sitemap.xml, robots.txt, 404.
- Пишете за всяка статия кратко и конкретно `description` (до ~155 знака).

## Публикуване в GitHub Pages
Пуша се в `main` и `.github/workflows/pages.yml` билдва и публикува автоматично.
Workflow-ът сам определя адреса (`https://<потребител>.github.io/<репо>/`) и префикса на линковете.
При собствен домейн: задайте `SITE_URL` (и оставете `PATH_PREFIX` празно) в стъпката „Set site URL“.
