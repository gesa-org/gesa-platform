import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#132523] text-[#dbe0d2] py-16 mt-10">
      <div className="max-w-[1160px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2.5 font-serif text-[22px] font-bold text-white">
              <Logo size={34} />
              GESA
            </Link>
            <p className="text-[#9fb6ba] max-w-[260px] text-sm mt-3 leading-relaxed">
              Free, professional, culturally sensitive mental health support, delivered by a global network of verified volunteer therapists.
            </p>
          </div>
          <div>
            <h4 className="text-white font-sans text-[13px] uppercase tracking-[0.14em] mb-4 font-semibold">Explore</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#b7c2ab]">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/therapists" className="hover:text-white transition-colors">Our Therapists</Link></li>
              <li><Link href="/support-groups" className="hover:text-white transition-colors">Support Groups</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-sans text-[13px] uppercase tracking-[0.14em] mb-4 font-semibold">Support</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#b7c2ab]">
              <li><Link href="/intake" className="hover:text-white transition-colors">Find a Therapist</Link></li>
              <li><Link href="/support-groups" className="hover:text-white transition-colors">Join a Group</Link></li>
              <li><Link href="/contact?subject=Donation" className="hover:text-white transition-colors">Donate</Link></li>
              <li><Link href="/contact?subject=Volunteer" className="hover:text-white transition-colors">Volunteer</Link></li>
              <li><a href="tel:988" className="hover:text-white transition-colors">Emergency Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-sans text-[13px] uppercase tracking-[0.14em] mb-4 font-semibold">Legal</h4>
            <ul className="flex flex-col gap-2 text-sm text-[#b7c2ab]">
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookies-policy" className="hover:text-white transition-colors">Cookies Policy</Link></li>
              <li><Link href="/legal-notice" className="hover:text-white transition-colors">Legal Notice</Link></li>
              <li><Link href="/accessibility-statement" className="hover:text-white transition-colors">Accessibility Statement</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-5 text-[13px] text-[#9aa892] flex flex-col md:flex-row justify-between gap-4">
          <span>© {year} GESA (Global Emotional Support Alliance). A registered non-profit organization.</span>
          <span>Made with care for those on the path to healing.</span>
        </div>
      </div>
    </footer>
  );
}
