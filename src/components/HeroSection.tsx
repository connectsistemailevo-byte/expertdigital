import { motion } from 'framer-motion';
import heroWoman from '@/assets/hero-woman.png';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[120px]"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-accent-500/15 rounded-full blur-[120px]"
        />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-[150px]"
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="container mx-auto px-6 lg:px-12 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full"
            >
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-foreground/80">Disponível para novos projetos</span>
            </motion.div>

            <h1 className="font-display font-extrabold text-4xl lg:text-6xl xl:text-7xl leading-[1.1]">
              <span className="text-foreground">Criação de</span>
              <br />
              <span className="gradient-text">Landing Pages</span>
              <br />
              <span className="text-foreground">& Sistemas</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Soluções digitais personalizadas para estética, odontologia, imobiliárias, advocacia e muito mais.
            </p>

            {/* Highlight badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-3 px-5 py-3 bg-primary-500/10 border border-primary-500/30 rounded-full"
            >
              <i className="ri-timer-flash-line text-primary-400 text-xl" />
              <span className="font-semibold text-primary-300">Landing Page em até 48h</span>
            </motion.div>

            <div className="flex flex-wrap gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-primary-500 hover:bg-primary-400 text-primary-foreground font-semibold rounded-xl shadow-lg glow-primary transition-all duration-300 cursor-pointer"
              >
                Solicitar Orçamento
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 glass hover:bg-white/10 text-foreground font-semibold rounded-xl transition-all duration-300 cursor-pointer"
              >
                Ver Portfólio
              </motion.button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-6">
              <div>
                <div className="font-display font-bold text-3xl text-foreground">50+</div>
                <div className="text-sm text-muted-foreground">Projetos</div>
              </div>
              <div className="w-px bg-border" />
              <div>
                <div className="font-display font-bold text-3xl text-foreground">98%</div>
                <div className="text-sm text-muted-foreground">Satisfação</div>
              </div>
              <div className="w-px bg-border" />
              <div>
                <div className="font-display font-bold text-3xl text-foreground">48h</div>
                <div className="text-sm text-muted-foreground">Entrega</div>
              </div>
            </div>
          </motion.div>

          {/* Photo Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative z-10">
              <div className="relative mx-auto w-full max-w-md">
                {/* Glow behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-accent-500/30 rounded-3xl blur-3xl scale-110" />
                
                <div className="relative rounded-3xl overflow-hidden glass p-2">
                  <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '4/5' }}>
                    <img
                      alt="Expert Digital"
                      className="w-full h-full object-cover object-center"
                      src={heroWoman}
                    />
                  </div>
                </div>
              </div>

              {/* Floating card - Dashboard */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 w-20 h-20 glass rounded-2xl flex items-center justify-center glow-primary"
              >
                <i className="ri-dashboard-line text-3xl text-primary-400" />
              </motion.div>

              {/* Floating card - Code */}
              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 w-20 h-20 glass rounded-2xl flex items-center justify-center glow-accent"
              >
                <i className="ri-code-s-slash-line text-3xl text-accent-400" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator with arrow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        onClick={() => document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer group"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground/60 uppercase tracking-widest group-hover:text-primary-400 transition-colors">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-10 h-10 rounded-full glass border border-muted-foreground/20 flex items-center justify-center group-hover:border-primary-400/50 group-hover:glow-primary transition-all duration-300"
          >
            <motion.i 
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="ri-arrow-down-line text-xl text-muted-foreground group-hover:text-primary-400 transition-colors"
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
