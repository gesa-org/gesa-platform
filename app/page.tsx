import Hero from "@/components/Hero";
import Paths from "@/components/home/Paths";
import Stats from "@/components/home/Stats";
import Testimonials from "@/components/home/Testimonials";
import DonateBand from "@/components/home/DonateBand";
import { getTestimonials } from "@/lib/queries";

export const revalidate = 300;

export default async function Home() {
  const testimonials = await getTestimonials();

  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <Paths />
      <Stats />
      <Testimonials testimonials={testimonials} />
      <DonateBand />
    </div>
  );
}
