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
  ChevronDown,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
        { label: "Não gera clientes automaticamente, mas facilita quem já chega até você", value: true },
        { label: "Vai gerar clientes automaticamente", value: false }
      ]
    },
    {
      question: "Você prefere:",
      options: [
        { label: "Um acesso exclusivo só seu", value: true },
        { label: "Uma vitrine disputando atenção com outros", value: false }
      ]
    },
    {
      question: "Ter seu guincho salvo no celular do cliente faz sentido para você?",
      options: [
        { label: "Sim, quero estar sempre à mão", value: true },
        { label: "Não, prefiro depender de buscas", value: false }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/95 to-primary text-primary-foreground">
      {/* Header */}
      <div className="container mx-auto px-4 py-4">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
        >
          ← Voltar
        </Button>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 md:py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-secondary/20 p-4 rounded-full">
              <Truck className="w-12 h-12 md:w-16 md:h-16 text-secondary" />
            </div>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Seu guincho com{' '}
            <span className="text-secondary">app exclusivo</span>{' '}
            para seus clientes
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Um acesso direto, sem disputa, sem comissão e sem vitrine.
          </p>

          <Button 
            size="lg"
            onClick={() => setShowQuiz(true)}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Quero ativar meu app
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* What You're Activating */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-secondary rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold">O que você está ativando</h2>
          </div>
          
          <Card className="bg-primary-foreground/10 border-primary-foreground/20 backdrop-blur">
            <CardContent className="p-6 md:p-8">
              <p className="text-lg md:text-xl mb-6">
                Ao ativar, você recebe um <strong className="text-secondary">app exclusivo do seu guincho</strong>.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <X className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                  <p className="text-primary-foreground/80">Não é um app genérico.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <p>É o <strong>seu atendimento digital</strong>, com seu nome, seu WhatsApp e seu acesso direto.</p>
                </div>
                <div className="flex items-start gap-3 bg-secondary/20 p-4 rounded-xl">
                  <MessageCircle className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <p className="font-semibold">O cliente entra e fala somente com você.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Comparison Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-secondary rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold">Por que isso é melhor que "estar no Google"?</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-destructive/20 border-destructive/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <X className="w-6 h-6 text-destructive" />
                  No Google:
                </h3>
                <ul className="space-y-3 text-primary-foreground/80">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full" />
                    Você vira mais um
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full" />
                    Disputa atenção
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full" />
                    Perde tempo explicando tudo
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-secondary/20 border-secondary/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Check className="w-6 h-6 text-secondary" />
                  Aqui:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-secondary" />
                    O cliente acessa <strong>direto o seu guincho</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-secondary" />
                    Sem lista
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-secondary" />
                    Sem comparação
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-secondary" />
                    Sem intermediário
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-secondary/10 rounded-xl text-center">
            <p className="text-lg font-semibold">
              <Target className="inline w-5 h-5 mr-2 text-secondary" />
              Quem entra no seu acesso, <span className="text-secondary">chama você</span>.
            </p>
          </div>
        </motion.div>
      </section>

      {/* How Client Arrives */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-secondary rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold">Como o cliente chega até você</h2>
          </div>
          
          <Card className="bg-primary-foreground/10 border-primary-foreground/20">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/20 p-3 rounded-full">
                  <QrCode className="w-8 h-8 text-secondary" />
                </div>
                <p className="text-lg">Você recebe um <strong>link e um QR Code exclusivos</strong></p>
              </div>
              
              <p className="mb-4 text-primary-foreground/80">Pode espalhar esse acesso em:</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {['Caminhão', 'Oficinas', 'Postos', 'Clientes antigos'].map((item) => (
                  <div key={item} className="bg-secondary/10 p-3 rounded-lg text-center">
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
              
              <div className="bg-primary/50 p-6 rounded-xl space-y-3">
                <p className="font-medium">Quando o cliente escaneia ou abre o link:</p>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-secondary" />
                  <span>Ele entra no seu app</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-secondary" />
                  <span>Preenche a situação</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-secondary" />
                  <span>O chamado cai <strong className="text-secondary">direto no seu WhatsApp</strong></span>
                </div>
              </div>
              
              <p className="mt-6 text-center text-lg font-semibold text-secondary">
                Simples. Direto. Rápido.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* PWA Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-secondary rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold">App que fica no celular do cliente</h2>
          </div>
          
          <Card className="bg-secondary/20 border-secondary/30">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <Smartphone className="w-12 h-12 text-secondary" />
                <p className="text-lg">O cliente pode <strong>instalar o app no celular</strong> com um toque.</p>
              </div>
              
              <p className="mb-4">Isso significa:</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-primary/30 p-3 rounded-lg">
                  <Check className="w-5 h-5 text-secondary" />
                  <span>Seu guincho fica <strong>salvo</strong></span>
                </div>
                <div className="flex items-center gap-3 bg-primary/30 p-3 rounded-lg">
                  <Check className="w-5 h-5 text-secondary" />
                  <span>Não precisa pesquisar</span>
                </div>
                <div className="flex items-center gap-3 bg-primary/30 p-3 rounded-lg">
                  <Check className="w-5 h-5 text-secondary" />
                  <span>Não depende de Google</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-secondary text-secondary-foreground rounded-xl text-center">
                <p className="font-bold text-lg">
                  📌 Quando ele precisar, você já está lá.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Price Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 bg-secondary rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold">Valor simbólico</h2>
          </div>
          
          <Card className="bg-gradient-to-br from-secondary/30 to-secondary/10 border-secondary/40">
            <CardContent className="p-6 md:p-8 text-center">
              <p className="text-xl mb-4">O valor para ativar tudo isso é</p>
              <div className="text-5xl md:text-6xl font-bold text-secondary mb-6">
                R$ 47,00
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center gap-2 text-primary-foreground/80">
                  <Shield className="w-5 h-5 text-secondary" />
                  <span>Sem mensalidade escondida</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-primary-foreground/80">
                  <Shield className="w-5 h-5 text-secondary" />
                  <span>Sem comissão por atendimento</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-primary-foreground/80">
                  <Shield className="w-5 h-5 text-secondary" />
                  <span>Sem taxa por chamado</span>
                </div>
              </div>
              
              <p className="text-lg text-primary-foreground/80">
                É um valor simbólico para ter um <strong>acesso digital que funciona 24h</strong>.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Quiz Section */}
      <AnimatePresence>
        {showQuiz && (
          <motion.section 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="container mx-auto px-4 py-12"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-secondary rounded-full" />
                <h2 className="text-2xl md:text-3xl font-bold">🧠 Antes de continuar, confirme</h2>
              </div>
              
              <Card className="bg-primary-foreground/10 border-primary-foreground/20">
                <CardContent className="p-6 md:p-8">
                  <div className="space-y-8">
                    {quizQuestions.map((q, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: quizStep >= index ? 1 : 0.5, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "transition-all",
                          quizStep < index && "pointer-events-none"
                        )}
                      >
                        <p className="font-semibold mb-3 flex items-center gap-2">
                          <span className="bg-secondary text-secondary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">
                            {index + 1}
                          </span>
                          {q.question}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          {q.options.map((opt, optIndex) => (
                            <button
                              key={optIndex}
                              onClick={() => handleQuizAnswer(index, opt.value)}
                              className={cn(
                                "p-4 rounded-xl border-2 text-left transition-all",
                                quizAnswers[index] === opt.value
                                  ? opt.value 
                                    ? "border-secondary bg-secondary/20" 
                                    : "border-destructive bg-destructive/20"
                                  : "border-primary-foreground/20 hover:border-primary-foreground/40"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                  quizAnswers[index] === opt.value
                                    ? opt.value ? "border-secondary bg-secondary" : "border-destructive bg-destructive"
                                    : "border-primary-foreground/40"
                                )}>
                                  {quizAnswers[index] === opt.value && (
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                  )}
                                </div>
                                <span className="text-sm md:text-base">{opt.label}</span>
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
                          <div className="bg-secondary/20 p-6 rounded-xl mb-6">
                            <Check className="w-12 h-12 text-secondary mx-auto mb-3" />
                            <p className="text-xl font-bold text-secondary">
                              🟢 Perfeito! Você pode ativar seu app exclusivo
                            </p>
                          </div>
                          
                          <Button 
                            size="lg"
                            onClick={handleWhatsAppRedirect}
                            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all w-full md:w-auto"
                          >
                            <MessageCircle className="mr-2 w-6 h-6" />
                            Ativar meu app exclusivo por R$ 47,00
                          </Button>
                          
                          <p className="mt-4 text-sm text-primary-foreground/60">
                            Você será redirecionado para o WhatsApp para finalizar
                          </p>
                        </div>
                      ) : (
                        <div className="text-center bg-destructive/20 p-6 rounded-xl">
                          <X className="w-12 h-12 text-destructive mx-auto mb-3" />
                          <p className="text-lg font-semibold">
                            Este app pode não ser ideal para você neste momento.
                          </p>
                          <p className="text-primary-foreground/80 mt-2">
                            Se mudar de ideia, estamos aqui!
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* CTA Button for non-quiz users */}
      {!showQuiz && (
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <Button 
              size="lg"
              onClick={() => {
                setShowQuiz(true);
                setTimeout(() => {
                  document.querySelector('[data-quiz]')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Zap className="mr-2 w-5 h-5" />
              Quero ativar meu app agora
              <ChevronDown className="ml-2 w-5 h-5 animate-bounce" />
            </Button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-primary-foreground/10">
        <div className="text-center text-primary-foreground/60 text-sm">
          <p>© 2024 AkiGuincho24hs - Seu guincho digital exclusivo</p>
        </div>
      </footer>
    </div>
  );
};

export default ProviderLandingPage;
