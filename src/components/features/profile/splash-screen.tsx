import { AnimatePresence, motion } from "framer-motion";

export function SplashScreen({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950 text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="space-y-4 text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary text-4xl font-black text-primary-foreground shadow-glow">
              N
            </div>
            <div className="space-y-1">
              <p className="font-display text-4xl">NestMate</p>
              <p className="text-sm text-slate-300">
                Cyprus student accommodation and flatmates
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
