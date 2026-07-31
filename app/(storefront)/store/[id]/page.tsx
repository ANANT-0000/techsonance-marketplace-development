import { Metadata, ResolvingMetadata } from "next";
import ProductClient from "./ProductClient";
import { fetchProduct } from "@/utils/commonAPiClient";
import { ShoppingList } from "@/components/customer/ShoppingList";

const isUUID = (str: string) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  if (!isUUID(id)) {
    // Treat as dynamic collection slug
    const formatted = id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: `${formatted} Collection | Techsonance Store`,
      description: `Explore the ${formatted} collection at Techsonance Store. Find the best deals and premium products curated just for you.`,
    };
  }

  try {
    const response = await fetchProduct(id);
    const product = response?.data;

    if (!product) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
      };
    }

    // Extract the main image from the first variant if available
    const mainImage = product.variants?.[0]?.images?.[0]?.image_url;

    const seoTitle = `${product.name} - Buy Online at Best Prices | Techsonance Store`;
    const seoDescription = product.description
      ? `${product.description.slice(0, 150)}... Buy ${product.name} at Techsonance Store.`
      : `Check out full specifications, prices, customer reviews, and features for ${product.name} at Techsonance Store.`;

    return {
      title: seoTitle,
      description: seoDescription,
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        images: mainImage ? [mainImage] : [],
      },
    };
  } catch (error) {
    return {
      title: "Product Details",
      description: "View details, specifications, and reviews for this product",
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isUUID(id)) {
    // It's a collection slug
    return (
      <main className="flex gap-8 xl:pt-10 pb-8 xl:px-16 lg:px-8 md:px-4 sm:px-2 py-1 px-2">
        <section className="w-full content-visibility-auto contain-intrinsic-size-[100dvh]">
          <ShoppingList collectionSlug={id} />
        </section>
      </main>
    );
  }

  return <ProductClient id={id} />;
}
