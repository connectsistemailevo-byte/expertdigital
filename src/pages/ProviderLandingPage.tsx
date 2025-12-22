import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  QrCode, 
  MessageCircle, 
  Check, 
  X, 
  Smartphone, 
  Shield,
  Star,
  Clock,
  ChevronRight,
  Users,
  ArrowRight
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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-yellow-500/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
            >
              ← Voltar
            </Button>
            <Button 
              onClick={onActivate}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
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
          <div className="absolute top-20 right-20 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Truck className="w-10 h-10 text-black" />
              </div>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
              Seu guincho com{' '}
              <span className="text-yellow-400">app exclusivo</span>
            </h1>
            
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Acesso direto. Sem comissão. Sem disputa.
            </p>

            {/* CTA Principal */}
            <Button 
              size="lg"
              onClick={handleWhatsAppRedirect}
              className="bg-yellow-500 hover:bg-yellow-400 text-black text-lg px-10 py-7 rounded-xl font-bold shadow-lg shadow-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/40 transition-all mb-6"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Ativar por R$ 47,00
            </Button>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-yellow-500" />
                <span>Sem mensalidade</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>Funciona 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Pagamento único</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* O que você recebe */}
      <section className="py-16 border-t border-yellow-500/10">
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
                className="bg-white/5 border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/40 transition-colors"
              >
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mb-4">
                  <QrCode className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">QR Code Exclusivo</h3>
                <p className="text-white/60 text-sm">
                  Cole no caminhão, oficinas, postos. Cliente escaneia e entra direto no seu app.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/40 transition-colors"
              >
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">App no Celular</h3>
                <p className="text-white/60 text-sm">
                  Cliente instala com um toque. Seu guincho fica salvo e pronto para chamar.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white/5 border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/40 transition-colors"
              >
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Direto no WhatsApp</h3>
                <p className="text-white/60 text-sm">
                  Chamado cai direto no seu WhatsApp. Sem intermediário, sem comissão.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparação */}
      <section className="py-16 bg-white/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
              Por que é melhor que o Google?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Google */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <X className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-400">No Google</h3>
                </div>
                <ul className="space-y-3 text-white/70">
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
              
              {/* Com seu App */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-yellow-400">Com seu App</h3>
                </div>
                <ul className="space-y-3 text-white/90">
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    Cliente acessa direto o seu guincho
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    Sem comparação, sem intermediário
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                    Quem entra, chama você
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preço */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-yellow-500/20 to-yellow-400/10 border-2 border-yellow-500/50 rounded-3xl p-8 text-center"
            >
              <h2 className="text-xl font-bold text-white mb-2">Ativação única</h2>
              <div className="text-6xl font-bold text-yellow-400 my-6">
                R$ 47
              </div>
              
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3 text-white">
                  <Check className="w-5 h-5 text-yellow-400 shrink-0" />
                  <span>Sem mensalidade</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Check className="w-5 h-5 text-yellow-400 shrink-0" />
                  <span>Sem comissão por chamado</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Check className="w-5 h-5 text-yellow-400 shrink-0" />
                  <span>App exclusivo com seu nome</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Check className="w-5 h-5 text-yellow-400 shrink-0" />
                  <span>QR Code personalizado</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Check className="w-5 h-5 text-yellow-400 shrink-0" />
                  <span>Funciona 24 horas</span>
                </div>
              </div>
              
              <Button 
                size="lg"
                onClick={handleWhatsAppRedirect}
                className="bg-yellow-500 hover:bg-yellow-400 text-black text-lg px-10 py-7 rounded-xl font-bold shadow-lg w-full"
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
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm overflow-y-auto"
          >
            <div className="container mx-auto px-4 py-8 min-h-screen flex items-center">
              <div className="max-w-2xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-white">Confirme antes de ativar</h2>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowQuiz(false)}
                    className="text-white/60 hover:text-white"
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
                        "bg-white/5 border border-yellow-500/20 rounded-2xl p-6",
                        quizStep < index && "pointer-events-none"
                      )}
                    >
                      <p className="font-medium text-white mb-4 flex items-center gap-3">
                        <span className="w-8 h-8 bg-yellow-500 text-black rounded-full flex items-center justify-center text-sm font-bold">
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
                                  ? "border-yellow-500 bg-yellow-500/10" 
                                  : "border-red-500 bg-red-500/10"
                                : "border-white/20 hover:border-white/40"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                quizAnswers[index] === opt.value
                                  ? opt.value ? "border-yellow-500 bg-yellow-500" : "border-red-500 bg-red-500"
                                  : "border-white/40"
                              )}>
                                {quizAnswers[index] === opt.value && (
                                  <Check className="w-3 h-3 text-black" />
                                )}
                              </div>
                              <span className="text-white/80">{opt.label}</span>
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
                      <div className="text-center">
                        <p className="text-yellow-400 mb-4 font-medium">
                          ✓ Você entendeu a proposta. Pode ativar!
                        </p>
                        <Button 
                          size="lg"
                          onClick={handleWhatsAppRedirect}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black text-lg px-10 py-7 rounded-xl font-bold"
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          Ativar por R$ 47,00
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                        <p className="text-red-400 mb-2">
                          Este app pode não ser ideal para você agora.
                        </p>
                        <p className="text-white/60 text-sm">
                          Ele facilita quem já chega até você, não gera clientes automaticamente.
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
      <footer className="py-8 border-t border-yellow-500/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/40 text-sm">
            Dúvidas? Fale conosco pelo WhatsApp
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ProviderLandingPage;
