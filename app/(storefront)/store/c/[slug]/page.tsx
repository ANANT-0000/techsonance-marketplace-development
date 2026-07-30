import { ShoppingList } from "@/components/customer/ShoppingList";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    sort_by?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Format slug for title (e.g. "summer-sale" -> "Summer Sale")
  const formattedSlug = slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const title = `Shop ${formattedSlug} | Techsonance Store`;
  const description = `Explore the ${formattedSlug} collection at Techsonance Marketplace. Get premium products at unbeatable prices with secure delivery.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;

  return (
    <main className="flex gap-8 xl:pt-10 pb-8 xl:px-16 lg:px-8 md:px-4 sm:px-2 py-1 px-2">
      <section className="w-full content-visibility-auto contain-intrinsic-size-[100dvh]">
        <ShoppingList collectionSlug={slug} />
      </section>
    </main>
  );
}
