import Link from 'next/link';
import { Heart } from 'lucide-react';
import AuthStatus from '@/components/AuthStatus';
import Logo from '@/components/Logo';
import LanguageSelector from '@/components/LanguageSelector';
import NotificationBell from '@/components/admin/NotificationBell';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[#f2efe6d1] backdrop-blur-md border-b border-transparent transition-all duration-200">
      <div className="max-w-[1160px] mx-auto px-6 flex items-center h-[74px] gap-5">
        <Link href="/" className="flex items-center gap-2.5 font-serif text-[22px] font-bold text-primary">
          <Logo size={34} />
          GESA
        </Link>
        <nav className="hidden md:flex gap-2 ml-2">
          <Link href="/" className="px-3 py-2 rounded-full text-[15px] font-medium text-muted-fg hover:text-primary transition-colors">Home</Link>
          <Link href="/about" className="px-3 py-2 rounded-full text-[15px] font-medium text-muted-fg hover:text-primary transition-colors">About</Link>
          <Link href="/therapists" className="px-3 py-2 rounded-full text-[15px] font-medium text-muted-fg hover:text-primary transition-colors">Our Therapists</Link>
          <Link href="/support-groups" className="px-3 py-2 rounded-full text-[15px] font-medium text-muted-fg hover:text-primary transition-colors">Support Groups</Link>
          <Link href="/blog" className="px-3 py-2 rounded-full text-[15px] font-medium text-muted-fg hover:text-primary transition-colors">Blog</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/contact?subject=Donation" className="hidden sm:inline-flex items-center gap-2 bg-primary text-primary-fg hover:bg-primary-600 px-6 py-3 rounded-full text-[15px] font-semibold transition-all shadow-soft">
            <Heart size={16} /> Donate
          </Link>
          <NotificationBell />
          <LanguageSelector />
          <AuthStatus />
        </div>
      </div>
    </header>
  );
}
