export function Footer() {
  return (
    <footer className="w-full py-10 md:py-16 mt-auto bg-surface-container-low border-t border-outline-variant/20">
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 md:px-8 max-w-7xl mx-auto gap-4 sm:gap-6">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <span className="font-heading italic text-on-surface text-xl">
            Lajoy&apos;s Recipes
          </span>
          <p className="font-label text-xs tracking-widest uppercase text-on-surface-variant opacity-70">
            &copy; {new Date().getFullYear()}{" "}Lajoy&apos;s Recipes
          </p>
        </div>
        <a
          className="font-label text-xs tracking-widest uppercase text-on-surface-variant hover:text-secondary-lajoy transition-all underline decoration-primary-container decoration-0 hover:decoration-2 underline-offset-8"
          href="mailto:support@lajoys.com"
        >
          Ondersteuning
        </a>
      </div>
    </footer>
  );
}
