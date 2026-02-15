import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/landing/MobileNav";
import { motion, useScroll, useTransform } from "framer-motion";
import myCreatorSuiteLogo from "@/assets/mycreatorsuite-logo.png";

const mainNavLinks = [
  { label: "Features", href: "#features", isExternal: true },
  { label: "Compare", href: "#comparison", isExternal: true },
  { label: "AI Tools", href: "#tools", isExternal: true },
  { label: "Pricing", href: "#pricing", isExternal: true },
];

export function LandingNav() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0.6, 0.95]);
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 1]);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl"
      style={{
        backgroundColor: `hsl(0 0% 3% / ${bgOpacity.get()})`,
      }}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
    >
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-border"
        style={{ opacity: borderOpacity }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <img src={myCreatorSuiteLogo} alt="Creator OS" className="h-7 sm:h-8 w-auto" />
            <span className="text-base sm:text-lg font-bold text-foreground tracking-tight">Creator OS</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {mainNavLinks.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 relative"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                whileHover={{ y: -1 }}
              >
                {link.label}
              </motion.a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Login
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link to="/auth">
                <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-full px-5 font-medium">
                  Sign up
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </motion.div>
          </div>

          <MobileNav links={mainNavLinks} />
        </div>
      </div>
    </motion.nav>
  );
}
