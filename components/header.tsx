import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 py-4 text-sm bg-linear-to-t from-0% to-background to-10% pb-6 sm:pb-10">
      <nav className="flex justify-between items-center gap-2 sm:gap-4">
        <Link href="/" className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
          Video to Email
        </Link>
        <div className="hidden md:flex gap-4">
          <Link href="/" className="hover:text-foreground/60 whitespace-nowrap">
            Features
          </Link>
          <Link href="/" className="hover:text-foreground/60 whitespace-nowrap">
            Pricing
          </Link>
          <div className="relative group hover:text-foreground/60">
            Ressources
            <div
              id="documentation-dropdown"
              className={`
             absolute top-[calc(100%+10px)] left-0
             hidden group-hover:flex group-hover:text-foreground/80 
             bg-background border border-gray-700 rounded-md p-2
             gap-2 w-fit animate-dropdown
            `}
            >
              <div className="flex flex-col gap-2 w-fit">
                <Link href="/" className="hover:text-foreground/80">
                  Docs
                </Link>
                <Link href="/" className="hover:text-foreground/80">
                  Changelog
                </Link>
              </div>
              <Link href="/" className="hover:text-foreground/80">
                Support
              </Link>
            </div>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-4">
          <Link
            href="/"
            className="border px-2 sm:px-3 text-xs sm:text-sm rounded-full hover:bg-foreground/10 border-gray-700 whitespace-nowrap"
          >
            Login
          </Link>
          <Link
            href="/"
            className="px-2 sm:px-3 text-xs sm:text-sm rounded-full bg-foreground text-background hover:bg-foreground/80 whitespace-nowrap"
          >
            Signup
          </Link>
        </div>
      </nav>
    </header>
  );
}
