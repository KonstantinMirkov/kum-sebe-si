// Спешни контакти. Всеки запис трябва да се проверява периодично (поле verified).
// Добавяйте нови номера само от официален източник и обновявайте датата.
export default {
  // Сменете с реалния домейн преди публикуване (или задайте SITE_URL при билд)
  url: (process.env.SITE_URL || "https://example.com").replace(/\/$/, ""),
  emergency: [
    {
      number: "112",
      tel: "112",
      bg: { name: "Единен европейски номер за спешни повиквания", desc: "Когато животът или здравето на теб или на друг човек са в непосредствена опасност. Безплатно, денонощно." },
      en: { name: "Single European emergency number", desc: "For immediate danger to life or health – yours or someone else's. Free, 24/7." },
      source: "https://www.112.bg/",
      verified: "2026-10-26",
    },
    {
      number: "116 111",
      tel: "116111",
      bg: { name: "Национална телефонна линия за деца", desc: "За деца, родители и други възрастни. Анонимно, безплатно, денонощно. Отговарят обучени психолози." },
      en: { name: "National Telephone Line for Children", desc: "For children, parents and other adults. Anonymous, free, 24/7; staffed by trained psychologists." },
      source: "https://childhelplineinternational.org/bulgaria-national-telephone-line-for-children-116-111/",
      verified: "2026-10-26",
    },
  ],
};
