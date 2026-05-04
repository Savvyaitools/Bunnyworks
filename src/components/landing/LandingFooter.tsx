import { motion } from "framer-motion";
import bunnyWorksLogo from "@/assets/bunnyworks-logo.png";

export function LandingFooter() {
  return (
    <footer className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <img src={bunnyWorksLogo} alt="BunnyWorksOS" className="h-6 sm:h-7 w-auto" />
              <span className="text-sm sm:text-base font-bold text-foreground">BunnyWorksOS</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
              The #1 management platform for creator agencies. Manage creators, track revenue, and scale with AI. Powered by BunnyWorksOS.
            </p>
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-3 sm:mb-4">Product</h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm text-muted-foreground">
              {["Features", "AI Tools", "Pricing", "Compare"].map((label) => (
                <li key={label}>
                  <motion.a
                    href={`#${label.toLowerCase().replace(" ", "-")}`}
                    className="hover:text-foreground transition-colors"
                    whileHover={{ x: 2 }}
                  >
                    {label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-border"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <span className="text-muted-foreground text-[10px] sm:text-xs">© 2026 BunnyWorksOS. All rights reserved.</span>
          <span className="text-muted-foreground text-[10px] sm:text-xs">bunnyworksos.com</span>
        </motion.div>
      </div>
    </footer>
  );
}
