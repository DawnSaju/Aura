"use client";

import { useState, useRef } from 'react';
import { Menu, X, Play, ChevronDown, ChevronRight, Star, LogIn, LayoutDashboard } from 'lucide-react';

const HERO_POSTER = "https://images.pexels.com/photos/7238751/pexels-photo-7238751.jpeg?auto=compress&cs=tinysrgb&w=1600";
const GALLERY: string[] = [
  "https://images.pexels.com/photos/8115875/pexels-photo-8115875.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/5408682/pexels-photo-5408682.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/8356766/pexels-photo-8356766.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/8961069/pexels-photo-8961069.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/6899258/pexels-photo-6899258.jpeg?auto=compress&cs=tinysrgb&w=1400",
  "https://images.pexels.com/photos/7238751/pexels-photo-7238751.jpeg?auto=compress&cs=tinysrgb&w=1400",
];

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAuthPages, setShowAuthPages] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const workScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-white">

      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-b from-[#ffa280] to-[#ff652d] rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
              </div>
              <span className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-xl sm:text-2xl text-[#212121]">
                Aura
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-8">
              <a href="#about" className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] hover:text-[#212121] transition-colors">
                About Us
              </a>
              <a href="#services" className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] hover:text-[#212121] transition-colors">
                Services
              </a>
              <a href="#carousel" className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] hover:text-[#212121] transition-colors">
                Magic
              </a>
              <a href="#process" className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] hover:text-[#212121] transition-colors">
                Process
              </a>
              <a
                href='/auth/signin'
                className="focus-ring inline-flex items-center rounded-full px-10 py-2.5 text-[16px] font-medium text-white transition-all"
                style={{
                  background: 'linear-gradient(180deg, #5C5C5C 0%, #000 100%)',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.30), inset 0 0 0.53px rgba(255,255,255,0.04), 0 2px 5px rgba(0,0,0,0.15)',
                }}
              >
                <div className='flex justify-center items-center gap-2'>
                  <LogIn className="w-4 h-4" /> Sign In
                </div>
              </a>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#212121]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-4">
                <a href="#about" className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] hover:text-[#212121] transition-colors px-2 py-2">
                  About Us
                </a>
                <a href="#services" className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] hover:text-[#212121] transition-colors px-2 py-2">
                  Services
                </a>
                <a href="#process" className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] hover:text-[#212121] transition-colors px-2 py-2">
                  Process
                </a>
                <a href="#contact" className="font-['Inter',sans-serif] tracking-[-0.48px] text-[#757575] hover:text-[#212121] transition-colors px-2 py-2">
                  Contact
                </a>
                <button
                  onClick={() => setShowAuthPages(true)}
                  className="bg-black text-white px-6 py-2.5 rounded-full font-['Inter',sans-serif] tracking-[-0.48px] hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <section className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col items-center text-center gap-6 md:gap-8 mb-12 md:mb-16">
            <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
              <div className="w-2 h-2 bg-[#ff652d] rounded-full" />
              <span className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-black">
                AI-Powered Video Editing
              </span>
            </div>

            <div className="space-y-2 md:space-y-4">
              <h1 className="font-['SF_Pro_Display',sans-serif] tracking-[-1.92px] text-[#212121] text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                Transform your videos
              </h1>
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <span className="font-['SF_Pro_Display',sans-serif] tracking-[-1.92px] text-[#212121] text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                  with
                </span>
                <div className="bg-linear-to-b from-[#ffa280] to-[#ff652d] rounded-xl md:rounded-2xl p-2 md:p-3 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.07)]">
                  <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
                </div>
                <span className="font-['SF_Pro_Display',sans-serif] tracking-[-1.92px] text-[#212121] text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
                  Aura
                </span>
              </div>
            </div>

            <p className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-[#757575] max-w-2xl text-base sm:text-lg md:text-xl px-4">
              AI-powered video editor with smart captions, intelligent editing, and seamless export capabilities
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
              <a
                href="/signin"
                className="focus-ring inline-flex items-center rounded-full px-5 py-2.5 text-[16px] font-medium text-white transition-all"
                style={{
                  background: 'linear-gradient(180deg, #5C5C5C 0%, #000 100%)',
                  boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.30), inset 0 0 0.53px rgba(255,255,255,0.04), 0 2px 5px rgba(0,0,0,0.15)',
                }}
              >
                Get Started
              </a>
              <button className="bg-white text-black px-8 py-3.5 rounded-full font-['Inter',sans-serif] tracking-[-0.48px] border border-gray-200 hover:bg-gray-50 transition-colors w-full sm:w-auto">
                <a
                  href="#pricing"
                >
                  View pricing
                </a>
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-black shadow-2xl">
              <img src={HERO_POSTER} alt="Video Preview" className="aspect-video" />
              <button className="absolute bottom-4 left-4 md:bottom-6 md:left-6 backdrop-blur-sm bg-white/10 px-4 py-2 md:px-5 md:py-2.5 rounded-full flex items-center gap-2 hover:bg-white/20 transition-colors">
                <Play className="w-4 h-4 md:w-5 md:h-5 text-white" />
                <span className="font-['SF_Pro_Display',sans-serif] tracking-[-0.14px] text-white text-sm md:text-base">
                  Watch Demo
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-6 mb-12 md:mb-16">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-[#ff652d] rounded-full" />
              <span className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-black">
                About Us
              </span>
            </div>
            <h2 className="font-['SF_Pro_Display',sans-serif] tracking-[-1.5px] text-[#212121] text-3xl sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl">
              Intelligent video editing powered by AI
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { number: '10x', label: 'Faster Editing' },
              { number: 'AppWrite', label: 'Built With' },
              { number: 'Auto', label: 'Caption Generation' },
              { number: '24/7', label: 'AI Assistant' }
            ].map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="font-['SF_Pro_Display',sans-serif] tracking-[-1.5px] text-[#ff652d] text-3xl sm:text-4xl md:text-5xl mb-2">
                  {stat.number}
                </div>
                <div className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="carousel" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-6 mb-12 md:mb-16">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-[#ff652d] rounded-full" />
              <span className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-black">
                Aura's Magic
              </span>
            </div>
            <h2 className="font-['SF_Pro_Display',sans-serif] tracking-[-1.5px] text-[#212121] text-3xl sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl">
              See Aura in action
            </h2>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-linear-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-linear-to-l from-white to-transparent" />

            <div ref={workScrollRef} className="no-scrollbar overflow-x-auto scroll-smooth">
              <div className="flex gap-6 md:gap-8 snap-x snap-mandatory px-1">
                {GALLERY.map((img, index) => (
                  <div key={index} className="snap-center shrink-0 w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] aspect-9/16 relative rounded-3xl overflow-hidden shadow-xl bg-black">
                    <img src={img} alt={`Project ${index + 1}`} className="h-full w-full object-cover" />
                    <button className="absolute left-3 bottom-3 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-white text-sm flex items-center gap-2 hover:bg-white/20">
                      <Play className="w-4 h-4" /> Play
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              aria-label="Previous"
              onClick={() => workScrollRef.current?.scrollBy({ left: -380, behavior: 'smooth' })}
              className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 hover:shadow-lg"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => workScrollRef.current?.scrollBy({ left: 380, behavior: 'smooth' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 hover:shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <section id="services" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-6 mb-12 md:mb-16">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-[#ff652d] rounded-full" />
              <span className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-black">
                Services
              </span>
            </div>
            <h2 className="font-['SF_Pro_Display',sans-serif] tracking-[-1.5px] text-[#212121] text-3xl sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl">
              Powerful features for creators
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { title: 'AI Captions', description: 'Automatically generate accurate captions with AssemblyAI technology' },
              { title: 'Smart Editing', description: 'AI-powered editing suggestions and automated video enhancement' },
              { title: 'Multi-Format Export', description: 'Export videos with captions in SRT format for any platform' },
              { title: 'AI Chat Assistant', description: 'Natural language commands for editing tasks and guidance' },
              { title: 'Real-Time Preview', description: 'See your edits instantly with live video playback' },
              { title: 'Caption Editor', description: 'Fine-tune captions with timing and text customization' }
            ].map((service, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group">
                <div className="bg-linear-to-b from-[#ffa280] to-[#ff652d] w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
                <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] text-xl md:text-2xl mb-3">
                  {service.title}
                </h3>
                <p className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-[#757575]">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center gap-6 mb-12 md:mb-16">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-[#ff652d] rounded-full" />
              <span className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-black">
                Process
              </span>
            </div>
            <h2 className="font-['SF_Pro_Display',sans-serif] tracking-[-1.5px] text-[#212121] text-3xl sm:text-4xl md:text-5xl lg:text-6xl max-w-4xl">
              How we work
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: '01',
                title: 'Upload Your Video',
                description: 'Import your raw footage directly into Aura with drag-and-drop simplicity'
              },
              {
                step: '02',
                title: 'AI Editing Magic',
                description: 'Let our AI generate captions, suggest edits, and enhance your video automatically'
              },
              {
                step: '03',
                title: 'Export & Share',
                description: 'Download your finished video with captions ready for any platform'
              }
            ].map((process, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-['SF_Pro_Display',sans-serif] tracking-[-1.92px] text-[#ff652d] text-5xl md:text-6xl mb-4 opacity-30">
                    {process.step}
                  </div>
                  <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] text-xl md:text-2xl mb-3">
                    {process.title}
                  </h3>
                  <p className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-[#757575]">
                    {process.description}
                  </p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 -translate-y-1/2">
                    <ChevronRight className="w-6 h-6 text-[#ff652d]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 lg:p-12 shadow-xl">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="relative rounded-2xl overflow-hidden bg-black">
                <img src={"https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg"} alt="Testimonial" className="w-full h-auto" />
                <button className="absolute bottom-4 left-4 md:bottom-6 md:left-6 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                  <Play className="w-4 h-4 text-white" />
                  <span className="font-['SF_Pro_Display',sans-serif] tracking-[-0.14px] text-white text-sm">
                    Play
                  </span>
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-['SF_Pro_Display',sans-serif] tracking-[-0.66px] text-black text-xl md:text-2xl">
                      Alan Andrews
                    </h3>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-[#ffa280] text-[#ffa280]" />
                    ))}
                  </div>
                </div>

                <p className="font-['SF_Pro_Display',sans-serif] tracking-[-1.02px] text-[#757575] text-2xl md:text-3xl lg:text-4xl leading-relaxed">
                  Aura transformed my video editing workflow! The AI captions are incredibly accurate, and the chat assistant makes complex edits feel effortless. I can now produce professional videos in minutes instead of hours.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#ff652d] rotate-270" />
                    <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-black">
                      Content Creator
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-[#ff652d] rotate-270" />
                    <span className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-black">
                      500K+ Followers
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center gap-6 mb-12 md:mb-16">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 bg-[#ff652d] rounded-full" />
              <span className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-black">
                FAQ
              </span>
            </div>
            <h2 className="font-['SF_Pro_Display',sans-serif] tracking-[-1.5px] text-[#212121] text-3xl sm:text-4xl md:text-5xl">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                question: 'What video formats does Aura support?',
                answer: 'Aura supports all major video formats including MP4, MOV, AVI, WebM, and more. Simply upload your video and our platform handles the rest.'
              },
              {
                question: 'How accurate are the AI-generated captions?',
                answer: 'Our captions are powered by AssemblyAI with 95%+ accuracy. You can also edit any caption text and timing in the built-in editor.'
              },
              {
                question: 'Can I export captions separately?',
                answer: 'Yes! Aura exports both your video file and a separate SRT caption file, making it easy to use across different platforms.'
              },
              {
                question: 'How does the AI Chat Assistant work?',
                answer: 'Simply describe what you want to do in natural language, and our AI assistant will guide you through editing tasks or execute commands automatically.'
              },
              {
                question: 'Is my video data secure?',
                answer: 'Absolutely! All videos are stored securely using Appwrite cloud infrastructure with enterprise-grade encryption and privacy controls.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-['SF_Pro_Display',sans-serif] tracking-[-0.6px] text-[#212121] text-lg md:text-xl pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#757575] shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''
                      }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 pt-0">
                    <p className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-[#757575]">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-white py-6 md:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#ff652d] rounded-2xl md:rounded-3xl lg:rounded-4xl px-6 md:px-8 lg:px-12 pt-8 md:pt-10 lg:pt-12 pb-6 md:pb-8 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-12 mb-8 md:mb-12">
              <div className="flex items-start">
                <div className="bg-[rgba(255,255,255,0.1)] rounded-xl md:rounded-[14px] p-2 md:p-2.5">
                </div>
              </div>

              <div>
                <h4 className="font-['Inter',sans-serif] font-medium tracking-[-0.9px] text-white text-lg md:text-xl mb-4">
                  Quick Links
                </h4>
                <ul className="space-y-3 md:space-y-4">
                  <li>
                    <a href="#about" className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-white hover:text-white/80 transition-colors text-base md:text-lg">
                      About us
                    </a>
                  </li>
                  <li>
                    <a href="#carousel" className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-white hover:text-white/80 transition-colors text-base md:text-lg">
                      Magic
                    </a>
                  </li>
                  <li>
                    <a href="#services" className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-white hover:text-white/80 transition-colors text-base md:text-lg">
                      Services
                    </a>
                  </li>
                  <li>
                    <a href="#process" className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-white hover:text-white/80 transition-colors text-base md:text-lg">
                      How it work
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-['Inter',sans-serif] font-medium tracking-[-0.9px] text-white text-lg md:text-xl mb-4">
                  Contact
                </h4>
                <ul className="space-y-3 md:space-y-4">
                  <li>
                    <a href="mailto:dawnsaju@aura.com" className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-white hover:text-white/80 transition-colors text-base md:text-lg">
                      dawnsaju@aura.com
                    </a>
                  </li>
                  <li>
                    <span className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-white text-base md:text-lg">
                      AI Powered Support 24/7
                    </span>
                  </li>
                  <li>
                    <a href="https://github.com/aura-editor" target="_blank" rel="noopener noreferrer" className="font-['Inter',sans-serif] font-medium tracking-[-0.72px] text-white hover:text-white/80 transition-colors text-base md:text-lg">
                      Open Source on GitHub
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-['Inter',sans-serif] font-medium tracking-[-0.9px] text-white text-lg md:text-xl mb-4">
                  Follow us
                </h4>
                <ul className="space-y-3 md:space-y-4">
                  <li>
                    <a href="https://x.com/" target="_blank" rel="noopener noreferrer" className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-white hover:text-white/80 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="white" viewBox="0 0 16 16">
                        <path clipRule="evenodd" fillRule="evenodd" />
                      </svg>
                      <span>Twitter</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-white hover:text-white/80 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="white" viewBox="0 0 16 16">
                        <path stroke="white" strokeWidth="0.0625" />
                      </svg>
                      <span>Linkedin</span>
                    </a>
                  </li>
                  <li>
                    <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="font-['Inter',sans-serif] font-medium tracking-[-0.48px] text-white hover:text-white/80 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="white" viewBox="0 0 16 16">
                        <path stroke="white" strokeWidth="0.5" />
                      </svg>
                      <span>Facebook</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="relative overflow-hidden h-28 sm:h-32 md:h-40 lg:h-48">
              <h2 className="font-['HelveticaNeue',sans-serif] text-white text-[15vw] sm:text-[12vw] md:text-[10vw] lg:text-[180px] xl:text-[244px] tracking-tighter leading-none absolute left-0 top-0 whitespace-nowrap">
                Aura 2025
              </h2>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
