import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  QrCode, 
  MessageCircle, 
  Check, 
  X, 
  Smartphone, 
  Target,
  Shield,
  Zap,
  ArrowRight,
  Star,
  Users,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProviderLandingPageProps {
  onActivate: () => void;
  onBack: () => void;
}

const ProviderLandingPage: React.FC<ProviderLandingPageProps> = ({ onActivate, onBack }) => {
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(boolean | null)[]>([null, null, null]);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleQuizAnswer = (stepIndex: number, answer: boolean) => {
    const newAnswers = [...quizAnswers];
    newAnswers[stepIndex] = answer;
    setQuizAnswers(newAnswers);
    
    if (stepIndex < 2) {
      setTimeout(() => setQuizStep(stepIndex + 1), 300);
    }
  };

  const allAnswered = quizAnswers.every(a => a !== null);
  const canActivate = quizAnswers[0] === true && quizAnswers[1] === true && quizAnswers[2] === true;

  const handleWhatsAppRedirect = () => {
    const message = encodeURIComponent("Olá! Quero ativar meu app exclusivo de guincho por R$ 47,00");
    window.open(`https://wa.me/5562994389675?text=${message}`, '_blank');
  };

  const quizQuestions = [
    {
      question: "Você entende que este app:",
      options: [
        { label: "Facilita quem já chega até mim (não gera clientes automaticamente)", value: true },
        { label: "Vai gerar clientes automaticamente", value: false }
      ]
    },
    {
      question: "Você prefere:",
      options: [
        { label: "Um acesso exclusivo só meu", value: true },
        { label: "Uma vitrine disputando atenção com outros", value: false }
      ]
    },
    {
      question: "Ter seu guincho salvo no celular do cliente faz sentido?",
      options: [
        { label: "Sim, quero estar sempre à mão", value: true },
        { label: "Não, prefiro depender de buscas", value: false }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              ← Voltar
            </Button>
            <Button 
              variant="ghost" 
              onClick={onActivate}
              className="text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 font-medium"
            >
              <Users className="w-4 h-4 mr-2" />
              Prestadores Ativos
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-medium">
                <Truck className="w-4 h-4" />
                Seu Guincho Digital
              </span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-center text-white leading-tight mb-6">
              App exclusivo para{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                seus clientes
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 text-center max-w-2xl mx-auto mb-10">
              Acesso direto. Sem comissão. Sem disputa. 
              <span className="text-white font-medium"> O cliente fala só com você.</span>
            </p>

            {/* CTA Principal */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg"
                onClick={handleWhatsAppRedirect}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg px-8 py-7 rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all w-full sm:w-auto"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Ativar por R$ 47,00
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setShowQuiz(true)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white text-lg px-8 py-7 rounded-2xl w-full sm:w-auto"
              >
                Entender melhor
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Sem mensalidade</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>Funciona 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-500" />
                <span>Pagamento único</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              O que você recebe
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors"
              >
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">QR Code Exclusivo</h3>
                <p className="text-slate-400 text-sm">
                  Cole no caminhão, oficinas, postos. Cliente escaneia e cai direto no seu app.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">App no Celular</h3>
                <p className="text-slate-400 text-sm">
                  Cliente instala com um toque. Seu guincho fica salvo e pronto para chamar.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors"
              >
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Direto no WhatsApp</h3>
                <p className="text-slate-400 text-sm">
                  Chamado cai direto no seu WhatsApp. Sem intermediário, sem comissão.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 bg-slate-800/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              Por que é melhor que o Google?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Google */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <X className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-red-400">No Google</h3>
                </div>
                <ul className="space-y-3 text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0" />
                    Você vira mais um na lista
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0" />
                    Disputa atenção com concorrentes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0" />
                    Perde tempo explicando tudo
                  </li>
                </ul>
              </div>
              
              {/* Aqui */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-emerald-400">Com seu App</h3>
                </div>
                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    Cliente acessa direto o seu guincho
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    Sem comparação, sem intermediário
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    Quem entra, chama você
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-3xl p-8 text-center"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Investimento único</h2>
              <div className="text-6xl font-bold text-white my-6">
                R$ <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">47</span>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm">
                <span className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Sem mensalidade
                </span>
                <span className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Sem comissão
                </span>
                <span className="flex items-center gap-2 text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Funciona 24h
                </span>
              </div>
              
              <Button 
                size="lg"
                onClick={handleWhatsAppRedirect}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg px-10 py-7 rounded-2xl shadow-lg shadow-emerald-500/25 w-full sm:w-auto"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Ativar agora por R$ 47,00
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <AnimatePresence>
        {showQuiz && (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm overflow-y-auto"
          >
            <div className="container mx-auto px-4 py-8 min-h-screen flex items-center">
              <div className="max-w-2xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-white">Confirme antes de ativar</h2>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowQuiz(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {quizQuestions.map((q, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: quizStep >= index ? 1 : 0.3, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6",
                        quizStep < index && "pointer-events-none"
                      )}
                    >
                      <p className="font-medium text-white mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        {q.question}
                      </p>
                      <div className="grid gap-3">
                        {q.options.map((opt, optIndex) => (
                          <button
                            key={optIndex}
                            onClick={() => handleQuizAnswer(index, opt.value)}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all",
                              quizAnswers[index] === opt.value
                                ? opt.value 
                                  ? "border-emerald-500 bg-emerald-500/10" 
                                  : "border-red-500 bg-red-500/10"
                                : "border-slate-700 hover:border-slate-600"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                quizAnswers[index] === opt.value
                                  ? opt.value ? "border-emerald-500 bg-emerald-500" : "border-red-500 bg-red-500"
                                  : "border-slate-600"
                              )}>
                                {quizAnswers[index] === opt.value && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-slate-300">{opt.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {allAnswered && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8"
                  >
                    {canActivate ? (
                      <div className="text-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8">
                        <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                        <p className="text-xl font-bold text-white mb-6">
                          Perfeito! Você pode ativar seu app exclusivo
                        </p>
                        <Button 
                          size="lg"
                          onClick={handleWhatsAppRedirect}
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-lg px-8 py-6 rounded-2xl w-full sm:w-auto"
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Ativar por R$ 47,00
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
                        <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-white">
                          Este app pode não ser ideal para você agora.
                        </p>
                        <p className="text-slate-400 mt-2">
                          Se mudar de ideia, estamos aqui!
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 Guincho24hs - Seu guincho digital exclusivo</p>
        </div>
      </footer>
    </div>
  );
};

export default ProviderLandingPage;
