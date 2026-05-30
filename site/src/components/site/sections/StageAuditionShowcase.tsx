import { useState, useEffect } from "react";
import Section from "../Section";
import SectionLabel from "../SectionLabel";

type Vocalist = {
  name: string;
  group: string;
  song: string;
  vpu: number;
  tone: number;
  pitch: number;
  power: number;
  image: string;
  address: string;
};

export default function StageAuditionShowcase() {
  
  // Interactive Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [activeLyricsIndex, setActiveLyricsIndex] = useState(0);

  const tracks = [
    { title: "RESDONANCE", artist: "HYPHE", duration: "3:42" },
    { title: "ECLIPSE", artist: "ARIA", duration: "3:15" },
    { title: "NEDN PULSE", artist: "HYPHE", duration: "4:01" },
  ];

  const lyrics = [
    "Loving you now · Dance alive · My heart is on fire",
    "Into the deep wave · Flowing through the night",
    "Listen to my voice · Feel the burning beat",
    "On-chain performance · Attested by the crowd",
  ];

  // Dynamic Lyrics scrolling when playing
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveLyricsIndex((prev) => (prev + 1) % lyrics.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const vocalists: Vocalist[] = [
    {
      name: "MINJI",
      group: "HYPHE",
      song: "RESDONANCE",
      vpu: 1248390,
      tone: 99,
      pitch: 98,
      power: 98,
      image: "/brand/singer-performance.png",
      address: "0x3f5c...921b",
    },
    {
      name: "ARIA",
      group: "NEO:SYNTHESIA",
      song: "ECLIPSE",
      vpu: 820410,
      tone: 96,
      pitch: 95,
      power: 97,
      image: "/brand/mobile-singing.png",
      address: "0x72a8...42cd",
    },
  ];

  return (
    <Section id="audition" className="border-t border-rule relative overflow-hidden">
      {/* Background Volumetric Light Gradients */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[300px] bg-brand/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <SectionLabel>Live Stages & Auditions</SectionLabel>

      <div className="flex flex-col lg:flex-row items-start gap-12 mt-8">
        
        {/* Left Column: Interactive Holographic Music Player ($10K Detail) */}
        <div className="w-full lg:w-5/12 flex-none">
          <div className="bg-[#0b0b14] rounded-[24px] p-6 relative overflow-hidden group border border-white/10 hover:border-brand/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* Top Backlight */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand/20 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex flex-col gap-6">
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-data text-brand uppercase tracking-[0.2em] font-semibold">
                    NOW PLAYING PREVIEW
                  </span>
                  <h3 className="font-display text-white text-[24px] font-bold mt-1 tracking-tight">
                    {tracks[currentTrack].title}
                  </h3>
                  <p className="text-white/60 text-[13px] uppercase tracking-wider font-medium">
                    {tracks[currentTrack].artist}
                  </p>
                </div>
                <span className="chip text-[10px] bg-brand/10 text-brand-on-dark border border-brand/20">
                  <span className="sw bg-brand animate-ping" />
                  LIVE DEMO
                </span>
              </div>

              {/* Rotating Soundwave Album Artwork Frame */}
              <div className="relative aspect-square w-full rounded-[16px] overflow-hidden group/album shadow-2xl">
                <img
                  src="/brand/album-artwork.png"
                  alt="Holographic Album Artwork"
                  className={`w-full h-full object-cover transition-transform duration-1000 ${
                    isPlaying ? "scale-105" : "scale-100"
                  }`}
                />
                
                {/* Overlay scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Animated Equalizer Overlay when playing */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${isPlaying ? "bg-brand animate-pulse" : "bg-white/40"}`} />
                    <span className="text-[11px] text-white/90 font-data tracking-widest uppercase">
                      {isPlaying ? "VPU STREAMING ACTIVE" : "STREAM PAUSED"}
                    </span>
                  </div>
                  {isPlaying && (
                    <div className="flex items-end gap-1 h-6">
                      <div className="w-0.5 bg-brand animate-[wave-animation_1.2s_infinite_alternate]" style={{ animationDelay: "0.1s" }} />
                      <div className="w-0.5 bg-brand animate-[wave-animation_1.2s_infinite_alternate]" style={{ animationDelay: "0.4s" }} />
                      <div className="w-0.5 bg-brand animate-[wave-animation_1.2s_infinite_alternate]" style={{ animationDelay: "0.2s" }} />
                      <div className="w-0.5 bg-brand animate-[wave-animation_1.2s_infinite_alternate]" style={{ animationDelay: "0.6s" }} />
                    </div>
                  )}
                </div>

                {/* Big Center Play Button Overlay */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-brand-pressed hover:bg-brand-hover text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110 shadow-2xl z-20"
                >
                  {isPlaying ? (
                    /* Pause Icon */
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <rect x="6" y="5" width="4" height="14" />
                      <rect x="14" y="5" width="4" height="14" />
                    </svg>
                  ) : (
                    /* Play Icon */
                    <svg className="w-6 h-6 fill-current ml-1" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Glowing Real-time Lyrics */}
              <div className="h-16 flex items-center justify-center text-center px-4 bg-white/[0.02] border border-white/5 rounded-[12px] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />
                <p 
                  key={activeLyricsIndex}
                  className={`text-[14px] font-medium text-white transition-all duration-700 font-body leading-relaxed tracking-wide ${
                    isPlaying ? "opacity-100 translate-y-0 text-glow-red" : "opacity-40 translate-y-1"
                  }`}
                >
                  {isPlaying ? lyrics[activeLyricsIndex] : "Click Play to Hear Audition Preview"}
                </p>
              </div>

              {/* Track Selector & Progress Bar */}
              <div className="space-y-4">
                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-brand rounded-full transition-all duration-1000 ${
                        isPlaying ? "w-1/3" : "w-0"
                      }`} 
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-data text-ink-soft">
                    <span>0:45</span>
                    <span>{tracks[currentTrack].duration}</span>
                  </div>
                </div>

                {/* Tracklist List */}
                <div className="space-y-2.5">
                  {tracks.map((track, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentTrack(idx);
                        setIsPlaying(true);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-[12px] transition-all text-left ${
                        currentTrack === idx 
                          ? "bg-brand/25 border border-brand/40 text-white" 
                          : "bg-white/[0.01] hover:bg-white/[0.05] border border-transparent text-white/70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-data text-[12px] opacity-75">{String(idx + 1).padStart(2, "0")}</span>
                        <div>
                          <p className="text-[14px] font-bold tracking-tight">{track.title}</p>
                          <p className="text-[11px] opacity-75 uppercase tracking-wider font-semibold">{track.artist}</p>
                        </div>
                      </div>
                      <span className="font-data text-[12px]">{track.duration}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Featured Vocalists & Attested Vocal DNA */}
        <div className="w-full lg:w-7/12 flex flex-col gap-6">
          <div className="space-y-3">
            <h2 className="font-display text-[clamp(28px,4vw,44px)] font-bold text-white tracking-tight leading-tight">
              Trending <span className="text-glow-red text-brand-on-dark italic">Vocalist Battles</span>
            </h2>
            <p className="text-ink-soft text-[16px] leading-relaxed max-w-xl">
              Real K-pop artists and fans worldwide compete in vocal battles on mobile. Precision Vocal DNA, processed by our voice indexer, is minted as real-time on-chain WAVE rewards.
            </p>
          </div>

          {/* Vocalist cards list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {vocalists.map((voc, index) => (
              <article 
                key={index}
                className="bg-[#050509]/80 backdrop-blur-md rounded-[24px] overflow-hidden relative group border border-white/10 hover:border-brand/30 shadow-xl"
              >
                {/* Card Background image (At low opacity until hover) */}
                <div className="absolute inset-0 -z-10 bg-black" />
                <div 
                  className="absolute inset-0 -z-10 media-cover opacity-20 group-hover:opacity-40 transition-opacity duration-700"
                  style={{ backgroundImage: `url(${voc.image})` }}
                />
                
                {/* Border glowing scrim on card hover */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <div className="p-6 flex flex-col justify-between min-h-[420px] relative z-10">
                  {/* Card Header: VPU Attestation */}
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-data text-brand uppercase tracking-widest font-bold">
                      #{index + 1} VOCALIST RANK
                    </span>
                    <span className="text-[11px] text-white/50 font-data uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-[4px]">
                      {voc.address}
                    </span>
                  </div>

                  {/* Vocal DNA Circular Indicators on Card center */}
                  <div className="space-y-4 my-6">
                    <div>
                      <h4 className="text-[28px] font-display font-extrabold text-white leading-tight tracking-tight">
                        {voc.name}
                      </h4>
                      <p className="text-[12px] text-white/80 uppercase tracking-widest font-semibold">
                        {voc.group} · {voc.song}
                      </p>
                    </div>

                    {/* Circular DNA Bar representation */}
                    <div className="grid grid-cols-3 gap-3 bg-black/40 backdrop-blur-md p-4 rounded-[16px] border border-white/5">
                      <div className="text-center">
                        <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">Tone</p>
                        <p className="text-[20px] font-data text-glow-red text-brand-on-dark font-extrabold">{voc.tone}%</p>
                      </div>
                      <div className="text-center border-x border-white/10">
                        <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">Pitch</p>
                        <p className="text-[20px] font-data text-glow-red text-brand-on-dark font-extrabold">{voc.pitch}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">Power</p>
                        <p className="text-[20px] font-data text-glow-red text-brand-on-dark font-extrabold">{voc.power}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: VPU Statistics & Action */}
                  <div className="space-y-4 border-t border-white/10 pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[11px] text-white/50 uppercase tracking-widest">Attested VPU Score</p>
                        <p className="text-[22px] font-data text-coral font-extrabold tnum">
                          {voc.vpu.toLocaleString()}+
                        </p>
                      </div>
                      
                      {/* Oracle Signature Badge */}
                      <div className="text-right">
                        <span className="text-[9px] font-data font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Oracle Verified
                        </span>
                      </div>
                    </div>

                    <button className="w-full btn-ghost btn-on-photo gap-2 py-2.5 text-[13px] font-semibold">
                      HEAR STAGE VOCAL
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>

                </div>
              </article>
            ))}
          </div>

          {/* Bottom Banner: Sing & Mine */}
          <div className="glass-card rounded-[20px] p-5 border border-white/5 bg-gradient-to-r from-brand-pressed/10 to-transparent flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
            <div>
              <p className="text-white text-[15px] font-bold tracking-tight">Sing directly via integration with the MagicSing mobile app!</p>
              <p className="text-ink-soft text-[13px]">Connect your wallet and upload your first vocal track to generate a limited-edition Voice DNA NFT.</p>
            </div>
            <button className="btn-primary px-6 text-[13px] font-semibold whitespace-nowrap">
              GET MagicSing APP
            </button>
          </div>

        </div>

      </div>
    </Section>
  );
}
