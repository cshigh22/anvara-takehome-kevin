import Link from 'next/link';
import { NewsletterSignup } from './newsletter-signup';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[--color-border] bg-[--color-foreground]/2">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Link
              href="/"
              className="text-xl font-bold text-[--color-primary]"
              aria-label="Anvara - Home"
            >
              Anvara
            </Link>
            <p className="mt-2 text-sm text-[--color-muted]">
              Connecting sponsors with premium publishers. Find the perfect placement for your brand.
            </p>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-[--color-foreground]">
              Quick links
            </h3>
            <ul className="space-y-1.5 text-sm text-[--color-muted]">
              <li>
                <Link href="/marketplace" className="hover:text-[--color-foreground]">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[--color-foreground]">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-1">
            <NewsletterSignup
              variant="compact"
              heading="Get sponsorship insights"
              description="New opportunities, tips, and marketplace updates—no spam, unsubscribe anytime."
            />
          </div>
        </div>

        <div className="mt-10 border-t border-[--color-border] pt-6 text-center text-sm text-[--color-muted]">
          © {new Date().getFullYear()} Anvara Marketplace. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
