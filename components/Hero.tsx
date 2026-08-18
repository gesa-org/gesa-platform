import Link from 'next/link';
import { ArrowRight, HeartHandshake, ShieldCheck, Users, Sparkle } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Hero() {
  return (
    <section className="relative bg-background border-b border-border pt-24 pb-20 overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-soft rounded-full blur-[100px] opacity-60 translate-x-1/3 -translate-y-1/4"></div>
      </div>

      <div className="max-w-[1160px] mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.12fr] gap-12 items-center">
          {/* Text Content */}
          <div className="max-w-2xl">
            <div className="mb-6">
              <Logo size={130} />
            </div>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary bg-accent-soft rounded-full px-4 py-1.5 mb-5">
              <Sparkle size={13} /> A global volunteer support alliance
            </span>
            <h1 className="font-serif text-[clamp(38px,5vw,60px)] font-semibold text-foreground leading-[1.08] tracking-[-0.025em] mb-6">
              The path to emotional recovery begins here
            </h1>
            <p className="text-[20px] text-muted-fg leading-[1.55] mb-8 max-w-[34rem]">
              GESA (Global Emotional Support Alliance) connects you with a verified volunteer
              therapist for free, culturally sensitive emotional support.
            </p>

            <div className="flex flex-wrap gap-4 mt-6">
              <Link href="/find-your-therapist" className="inline-flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-600 px-7 py-4 rounded-full text-[15px] font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-[1px]">
                Find your therapist <ArrowRight size={18} />
              </Link>
              <Link href="/support-groups" className="inline-flex items-center justify-center gap-2 bg-white text-primary border-[1.5px] border-border hover:border-primary px-7 py-4 rounded-full text-[15px] font-semibold transition-all hover:-translate-y-[1px]">
                Explore support groups
              </Link>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-6 mt-10 text-muted-fg text-[14px] font-medium">
              <span className="flex items-center gap-2">
                <ShieldCheck className="text-accent" size={18} /> Verified Professionals
              </span>
              <span className="flex items-center gap-2">
                <HeartHandshake className="text-accent" size={18} /> 100% Free Sessions
              </span>
              <span className="flex items-center gap-2">
                <Users className="text-accent" size={18} /> Global Community
              </span>
            </div>
          </div>

          {/* Hero Image / Media */}
          <div className="relative rounded-[26px] overflow-hidden shadow-2xl aspect-[9/10] bg-gradient-to-br from-primary to-accent">
            <div className="absolute inset-0 bg-black/10 z-10"></div>
            {/* Looping background video of a therapy session (Pexels, royalty-free) —
                replaces the earlier static photo. Falls back to the same photo as a
                poster frame while the video loads, and autoplay is muted/inline so it
                works across browsers without a user gesture. */}
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=1000&auto=format&fit=crop"
              className="w-full h-full object-cover z-0 relative"
            >
              <source
                src="https://videos.pexels.com/video-files/5234724/5234724-hd_1920_1080_25fps.mp4"
                type="video/mp4"
              />
            </video>

            {/* Trust Chip Overlay */}
            <div className="absolute left-6 bottom-6 bg-white/95 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 shadow-soft z-20">
              <div className="w-10 h-10 rounded-xl bg-accent-soft text-primary flex items-center justify-center shadow-inner">
                <HeartHandshake size={20} />
              </div>
              <div className="text-[13px] font-semibold text-foreground">
                Over <span className="text-primary font-bold">5,000+</span><br/>
                Sessions Completed
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
