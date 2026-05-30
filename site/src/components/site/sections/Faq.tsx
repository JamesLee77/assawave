import { useState } from "react";
import Section from "../Section";
import SectionLabel from "../SectionLabel";

type FAQItem = {
  question: string;
  answer: string;
};

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems: FAQItem[] = [
    {
      question: "What is ASSA WAVE?",
      answer: "ASSA WAVE is a fan-centric web3 ecosystem powered by a four-engine economy, blending the robust global mobile karaoke infrastructure of MagicSing with the high-performance Base blockchain. Moving beyond simple streaming, it is the first skill-based vocal reward protocol where mobile singing (Sing-to-Earn), token burn-and-mint dynamics (BME), and node operations form an organic, value-generating loop.",
    },
    {
      question: "How does Sing-to-Earn work, and what is VPU?",
      answer: "When you sing inside the MagicSing mobile app, our patented real-time audio indexer measures your pitch, tempo, and timbre to generate an objective vocal score called Voice Power Unit (VPU). Once verified by decentralized oracle signatures, your VPU is recorded as an on-chain attestation of vocal performance on the Base network, unlocking real-time skill-based $ASSA token rewards.",
    },
    {
      question: "Is it true that veASSA lockup provides zero APY interest?",
      answer: "Yes, that is correct. To completely prevent hyperinflation and sell pressure caused by high artificial APY rewards common in legacy DeFi protocols, ASSA WAVE enforces a strict Zero-Yield lockup structure. Instead of interest, lockup participants receive highly valuable fandom privileges, including star-ranking vote weight multiplier, early access to concert tickets/goods, and governance voting power, matching tiers from Bronze to Legend.",
    },
    {
      question: "How do the BME (Burn-and-Mint Equilibrium) and buyback systems work?",
      answer: "Our economy operates on a Burn-and-Mint Equilibrium (BME) model where usage permanently shrinks supply. When fans purchase tickets, limited-edition merchandise, or high-fidelity audio contents, 70% of the paid $ASSA is immediately and permanently burned by smart contracts. In addition, the foundation uses external service revenues (20% of B2C and 30-40% of B2B) to execute market buybacks and burn additional tokens, continuously building scarcity.",
    },
    {
      question: "Can anyone participate in the K-Node network and mine tokens?",
      answer: "Yes, absolutely. K-Nodes (scheduled for Phase 4) are highly energy-efficient and run inside lightweight Docker containers on standard home edge-AI devices (Reference Hardware: SpacemiT K3 RISC-V SoC based AIBOX-K3) or even high-end mobile devices. By hosting a K-Node to verify vocal attestations and cache real-time VPU computations, operators are rewarded with a fair share of the network's emission pool.",
    },
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Section id="faq" className="border-t border-rule relative overflow-hidden">
      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 right-10 w-[400px] h-[200px] bg-brand/5 blur-[100px] rounded-full pointer-events-none" />

      <SectionLabel>FAQ</SectionLabel>

      <div className="mt-12 max-w-4xl mx-auto space-y-6">
        <div className="space-y-3 mb-10 text-center">
          <h2 className="font-display text-[clamp(28px,4vw,44px)] font-bold text-ink tracking-tight leading-tight">
            Frequently Asked <span className="text-glow-red text-brand-on-dark italic">Questions</span>
          </h2>
          <p className="text-ink-soft text-[16px] leading-relaxed max-w-xl mx-auto">
            Frequently asked questions regarding the ASSA WAVE ecosystem, token utility, and on-chain singing rewards.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqItems.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className={`glass-card rounded-[20px] border transition-all duration-300 ${
                  isOpen 
                    ? "border-brand/30 bg-brand/[0.02] shadow-[0_10px_25px_rgba(239,37,37,0.06)]" 
                    : "border-rule hover:border-rule-strong"
                }`}
              >
                {/* Question Trigger */}
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <h3 className="font-display font-bold text-[16px] md:text-[18px] text-ink tracking-tight pr-6">
                    {item.question}
                  </h3>
                  
                  {/* Chevron Icon */}
                  <span className={`flex-none w-8 h-8 rounded-full bg-ink/5 flex items-center justify-center text-ink transition-transform duration-300 ${
                    isOpen ? "rotate-180 bg-brand/20 text-brand-on-dark" : ""
                  }`}>
                    <svg 
                      className="w-4 h-4 stroke-current" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                {/* Answer Content Panel */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-[300px] border-t border-white/5" : "max-h-0"
                  }`}
                >
                  <p className="p-6 text-[15px] leading-relaxed text-ink-soft font-body bg-black/10">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
