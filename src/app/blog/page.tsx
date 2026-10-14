import { CtaBanner } from "@/components/CtaBanner";
import { JsonLd } from "@/components/JsonLd";
import { PageHeader } from "@/components/PageHeader";
import { BlogList } from "@/components/marketing/BlogList";
import type { BlogListItem } from "@/components/marketing/BlogList";
import { Breadcrumbs } from "@/components/marketing/Breadcrumbs";
import { BLOG_POSTS, getCategoryLabel } from "@/content/blog";
import { formatPhotoCount } from "@/lib/format";
import { FREE_SAMPLE_PHOTOS } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, SITE, absoluteUrl } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Blog o wirtualnym home stagingu – poradniki dla agentów i sprzedających",
  description:
    "Poradniki o wirtualnym home stagingu: ile kosztuje, jak fotografować puste mieszkanie, jaki styl wybrać, jak oznaczać wizualizacje zgodnie z prawem i jak pokazać stan deweloperski.",
  path: ROUTES.blog,
});

export default function BlogPage() {
  const items: BlogListItem[] = BLOG_POSTS.map((post) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    categoryLabel: getCategoryLabel(post.category),
    publishedAt: post.publishedAt,
    readingMinutes: post.readingMinutes,
    image: post.image,
  }));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: `Blog – ${SITE.name}`,
          url: absoluteUrl(ROUTES.blog),
          inLanguage: "pl-PL",
          blogPost: BLOG_POSTS.map((post) => ({
            "@type": "BlogPosting",
            headline: post.title,
            url: absoluteUrl(ROUTES.blogPost(post.slug)),
            datePublished: post.publishedAt,
          })),
        }}
      />
      <PageHeader
        breadcrumbs={<Breadcrumbs items={[{ name: "Blog", path: ROUTES.blog }]} />}
        eyebrow="Blog"
        title="Poradniki o wirtualnym home stagingu"
        description={
          <p>
            Praktyczna wiedza dla agentów, deweloperów i osób sprzedających mieszkanie: koszty, zdjęcia, style wnętrz i
            zasady uczciwej wizualizacji. Bez zmyślonych statystyk – szacunki zawsze oznaczamy.
          </p>
        }
      />
      <section aria-label="Lista artykułów" className="py-12 sm:py-16">
        <div className="container-x">
          <BlogList posts={items} />
        </div>
      </section>
      <CtaBanner
        title="Teoria teorią – zobacz efekt na swoim zdjęciu"
        description={`Wgraj zdjęcie pustego pokoju i odbierz wizualizację w ${SITE.turnaroundHours} h.`}
        primary={{ href: ROUTES.order, label: "Zamów wizualizację" }}
        secondary={{ href: ROUTES.freeSample, label: `${formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis na próbę` }}
      />
    </>
  );
}
