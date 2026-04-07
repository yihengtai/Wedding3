import { useState, useRef, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  Heart, 
  Calendar, 
  MapPin, 
  Clock, 
  Upload, 
  X, 
  Check, 
  Camera,
  Utensils,
  ChevronDown,
  Mail,
  User,
  Music,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Toaster, toast } from 'sonner';
import emailjs from '@emailjs/browser';
import './App.css';

// Wedding configuration - Edit these details
const WEDDING_CONFIG = {
  coupleNames: {
    partner1: 'Tai Yi Heng',
    partner2: 'Ng Siew Tin'
  },
  date: 'Saturday, 12 December 2026',
  time: '6:00 PM',
  venue: '满漢城酒家 The Han Room @ The Garden Mall, KL',
  address: 'T-216A, The Gardens Mall, Lingkaran Syed Putra, Mid Valley City, 59200 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur',
  rsvpDeadline: '15 June 2026',
  // Wedding date for countdown (YYYY, MM-1, DD, HH, MM)
  weddingDate: new Date(2026, 11, 12, 16, 0), // December 12, 2026 at 4:00 PM
  // Google Sheets Web App URL - Replace with your own after deployment
  googleSheetsUrl: 'https://script.google.com/macros/s/AKfycbxJNYRGmQHMXXzu2gAODAalAeh8WwnRYPUN2o4iZM6bwWxOK48D2-K2-OeLWy3mvtEUzw/exec',
  // EmailJS Configuration - Replace with your own after setup
  emailjs: {
    serviceId: 'service_2oxqvts',      // e.g., 'service_abc123'
    templateId: 'template_prwfnrp',    // e.g., 'template_xyz789'
    publicKey: 'zOech7IZ7gPgfjaTH',      // e.g., 'user_123abc'
  }
};

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

interface RSVPData {
  name: string;
  email: string;
  attending: 'yes' | 'no';
  guests: string;
  relationship: 'groom' | 'bride';
  message: string;
}

interface Photo {
  id: string;
  url: string;
  name: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Audio Context for sharing single audio instance
interface AudioContextType {
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
  hasEnded: boolean;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
}

const AudioContext = createContext<AudioContextType>({
  audio: null,
  isPlaying: false,
  hasEnded: false,
  togglePlay: () => {},
  play: () => {},
  pause: () => {},
});

// Audio Provider Component - Creates SINGLE shared audio instance
function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    // Create single audio instance ONLY ONCE
    if (!audioRef.current) {
      audioRef.current = new Audio(publicAsset('wedding-music.mp3'));
      
      if (audioRef.current) {
        audioRef.current.loop = false;
        audioRef.current.volume = 0.7;
        
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          setHasEnded(true);
        });

        audioRef.current.addEventListener('play', () => {
          setIsPlaying(true);
        });

        audioRef.current.addEventListener('pause', () => {
          setIsPlaying(false);
        });
      }
    }

    return () => {
      // Don't cleanup on unmount to keep audio playing
    };
  }, []);

  const play = () => {
    if (audioRef.current && !hasEnded) {
      audioRef.current.play().catch(() => {});
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || hasEnded) return;
    
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <AudioContext.Provider value={{
      audio: audioRef.current,
      isPlaying,
      hasEnded,
      togglePlay,
      play,
      pause
    }}>
      {children}
    </AudioContext.Provider>
  );
}

// Hook to use audio context
function useAudio() {
  return useContext(AudioContext);
}

// Full Screen Envelope Overlay Component
function FullScreenEnvelope({ onOpen, isOpen }: { onOpen: () => void; isOpen: boolean }) {
  const [sealBroken, setSealBroken] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const { play } = useAudio();

  // Start music immediately when envelope mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      play();
    }, 100);
    return () => clearTimeout(timer);
  }, [play]);

  // Handle click to open
  const handleClick = () => {
    if (isOpen) return;
    
    // Ensure music is playing
    play();

    // Break seal
    setSealBroken(true);
    
    // Show letter
    setTimeout(() => {
      setShowLetter(true);
    }, 300);

    // Trigger open
    setTimeout(() => {
      onOpen();
    }, 2800);
  };

  // Handle scroll to open
  useEffect(() => {
    const handleScroll = () => {
      if (!isOpen && window.scrollY > 30) {
        handleClick();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen, onOpen]);

  if (isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] envelope-overlay">
      {/* Envelope Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e8d5b7] via-[#d4c4a8] to-[#c9b896]">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Envelope Flap (Top) */}
      <div 
        className={`absolute top-0 left-0 right-0 h-[55vh] origin-top transition-all duration-700 ease-in-out z-20 ${
          sealBroken ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          transform: sealBroken ? 'rotateX(180deg)' : 'rotateX(0deg)',
          transformOrigin: 'top',
          clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
          background: 'linear-gradient(135deg, #e8d5b7 0%, #d4c4a8 100%)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          perspective: '1000px'
        }}
      />

      {/* Envelope Bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[55vh] z-10"
        style={{
          clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
          background: 'linear-gradient(135deg, #c9b896 0%, #b8a885 100%)'
        }}
      />

      {/* Left Side */}
      <div 
        className="absolute top-0 left-0 w-1/2 h-full z-10"
        style={{
          clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
          background: 'linear-gradient(135deg, #d4c4a8 0%, #c9b896 100%)'
        }}
      />

      {/* Right Side */}
      <div 
        className="absolute top-0 right-0 w-1/2 h-full z-10"
        style={{
          clipPath: 'polygon(100% 0, 0 50%, 100% 100%)',
          background: 'linear-gradient(135deg, #d4c4a8 0%, #c9b896 100%)'
        }}
      />

      {/* Letter Content */}
      <div 
        className={`absolute inset-0 flex items-center justify-center z-15 transition-all duration-500 ${
          showLetter ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <div className="bg-gradient-to-b from-white to-rose-50 p-8 md:p-12 rounded-lg shadow-2xl max-w-md text-center mx-4 border-4 border-[#e8d5b7]">
          <Heart className="w-10 h-10 mx-auto text-rose-500 mb-4 animate-pulse" fill="currentColor" />
          <h2 className="font-script text-3xl md:text-4xl text-stone-800 mb-3">
            You're Invited
          </h2>
          <p className="text-stone-600 mb-2">To the wedding of</p>
          <h3 className="font-script text-2xl md:text-3xl text-rose-600 mb-4">
            {WEDDING_CONFIG.coupleNames.partner1}
          </h3>
          <h4 className="font-script text-2xl md:text-3xl text-rose-600 mb-4">
            &
          </h4>
          <h5 className="font-script text-2xl md:text-3xl text-rose-600 mb-4">
            {WEDDING_CONFIG.coupleNames.partner2}
          </h5>
          <p className="text-stone-600 mb-2">.</p>
          <p className="text-stone-600 mb-2">..</p>
          <p className="text-stone-600 mb-2">...</p>
          <p className="text-stone-600 mb-2">....</p>
          <p className="text-stone-600 mb-2">.....</p>
          <p className="text-stone-600 mb-2">......</p>
          <p className="text-stone-600 mb-2">.......</p>
          <p className="text-stone-600 mb-2">........</p>
          <p className="text-stone-600 mb-2">.........</p>
          <div className="border-t border-b border-rose-200 py-3 my-4">
            <p className="text-stone-700 font-medium">{WEDDING_CONFIG.date}</p>
            <p className="text-stone-500 text-sm mt-1">{WEDDING_CONFIG.venue}</p>
          </div>
        </div>
      </div>

      {/* Wax Seal */}
      <div 
        onClick={handleClick}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer transition-all duration-500 ${
          sealBroken ? 'scale-0 opacity-0 rotate-45' : 'scale-100 opacity-100 hover:scale-110'
        }`}
      >
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-rose-600 to-rose-800 shadow-2xl flex items-center justify-center relative overflow-hidden border-4 border-rose-700">
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-700/50 to-transparent" />
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-2 border-rose-400/50 flex items-center justify-center relative">
            <Heart className="w-10 h-10 md:w-14 md:h-14 text-rose-200" fill="currentColor" />
            <div className="absolute top-1 left-1 w-4 h-4 bg-white/30 rounded-full blur-sm" />
          </div>
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/20 rounded-full blur-md" />
        <div className="absolute inset-0 rounded-full border-4 border-rose-400/30 animate-ping" />
      </div>

      {/* Seal Pieces */}
      {sealBroken && (
        <>
          <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-rose-700 rounded-full animate-fly-out-1 z-40" />
          <div className="absolute top-1/2 left-1/2 w-5 h-5 bg-rose-600 rounded-full animate-fly-out-2 z-40" />
          <div className="absolute top-1/2 left-1/2 w-7 h-7 bg-rose-800 rounded-full animate-fly-out-3 z-40" />
          <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-rose-500 rounded-full animate-fly-out-4 z-40" />
        </>
      )}

      {/* Click Hint */}
      <div className={`absolute bottom-16 left-0 right-0 text-center transition-opacity duration-300 ${sealBroken ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-stone-600 text-lg font-light tracking-widest animate-bounce">
          Click the seal to open
        </p>
      </div>
    </div>
  );
}

// Background Music Player Component - Uses shared audio
function BackgroundMusic() {
  const { isPlaying, hasEnded, togglePlay } = useAudio();

  if (hasEnded) return null;

  // return (
  //   <div className="fixed bottom-6 right-6 z-50">
  //     <button
  //       onClick={togglePlay}
  //       className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-rose-50 transition-all border border-rose-100"
  //     >
  //       {isPlaying ? (
  //         <Volume2 className="w-5 h-5 text-rose-500" />
  //       ) : (
  //         <VolumeX className="w-5 h-5 text-stone-400" />
  //       )}
  //     </button>
  //     {isPlaying && (
  //       <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
  //         <span className="text-xs text-stone-500 bg-white/80 px-2 py-1 rounded-full">
  //           <Music className="w-3 h-3 inline mr-1" />
  //           Playing
  //         </span>
  //       </div>
  //     )}
  //   </div>
  // );
}

// Countdown Timer Component
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const weddingTime = WEDDING_CONFIG.weddingDate.getTime();
      const difference = weddingTime - now;

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center mb-2">
        <span className="text-2xl md:text-3xl font-bold text-rose-600">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs md:text-sm text-stone-600 font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-3 md:gap-6">
      <TimeUnit value={timeLeft.days} label="Days" />
      <span className="text-2xl md:text-4xl text-rose-400 font-bold">:</span>
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <span className="text-2xl md:text-4xl text-rose-400 font-bold">:</span>
      <TimeUnit value={timeLeft.minutes} label="Minutes" />
      <span className="text-2xl md:text-4xl text-rose-400 font-bold">:</span>
      <TimeUnit value={timeLeft.seconds} label="Seconds" />
    </div>
  );
}

// Main App Content Component
function AppContent() {
  const [rsvpData, setRsvpData] = useState<RSVPData>({
    name: '',
    email: '',
    attending: 'yes',
    guests: '1',
    relationship: 'groom',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showEmailInstructions, setShowEmailInstructions] = useState(false);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [showMainContent, setShowMainContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init(WEDDING_CONFIG.emailjs.publicKey);
  }, []);

  // Load photos from localStorage on mount
  useEffect(() => {
    const savedPhotos = localStorage.getItem('weddingPhotos');
    if (savedPhotos) {
      setUploadedPhotos(JSON.parse(savedPhotos));
    }
  }, []);

  // Save photos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('weddingPhotos', JSON.stringify(uploadedPhotos));
  }, [uploadedPhotos]);

  const handleEnvelopeOpen = () => {
    setEnvelopeOpened(true);
    // Show main content immediately with animation
    setShowMainContent(true);
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', rsvpData.name);
      formData.append('email', rsvpData.email);
      formData.append('attending', rsvpData.attending);
      formData.append('guests', rsvpData.guests);
      formData.append('relationship', rsvpData.relationship);
      formData.append('message', rsvpData.message);
      formData.append('timestamp', new Date().toISOString());

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await fetch(WEDDING_CONFIG.googleSheetsUrl, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });

      toast.success('Wedding details have been sent to your email.');

      setRsvpData({
        name: '',
        email: '',
        attending: 'yes',
        guests: '1',
        relationship: 'groom',
        message: ''
      });
    } catch (error) {
      console.error('RSVP submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newPhoto: Photo = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          url: event.target?.result as string,
          name: file.name
        };
        setUploadedPhotos(prev => [...prev, newPhoto]);
        toast.success(`Photo "${file.name}" uploaded successfully!`);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (id: string) => {
    setUploadedPhotos(prev => prev.filter(photo => photo.id !== id));
    toast.success('Photo removed');
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Toaster component */}
      <Toaster position="top-center" richColors closeButton />
      
      {/* Main Content - Always rendered, animates in when envelope opens */}
      <main className={`transition-all duration-1000 ${showMainContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-rose-100/50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="font-script text-xl text-rose-600">
              {WEDDING_CONFIG.coupleNames.partner1} & {WEDDING_CONFIG.coupleNames.partner2}
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <button onClick={() => scrollToSection('details')} className="text-stone-600 hover:text-rose-600 transition-colors">Details</button>
              <button onClick={() => scrollToSection('gallery')} className="text-stone-600 hover:text-rose-600 transition-colors">Gallery</button>
              <button onClick={() => scrollToSection('rsvp')} className="text-stone-600 hover:text-rose-600 transition-colors">RSVP</button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${publicAsset('hero-wedding.jpg')})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
          
          <div className="relative z-10 text-center text-white px-4">
            <div className="mb-6">
              <Heart className="w-8 h-8 mx-auto text-rose-300 animate-float" fill="currentColor" />
            </div>
            <p className="text-lg md:text-xl font-light tracking-widest mb-4 text-rose-100">
              WE'RE GETTING MARRIED
            </p>
            <h1 className="font-script text-5xl md:text-7xl lg:text-8xl mb-6 text-shadow">
              {WEDDING_CONFIG.coupleNames.partner1} & {WEDDING_CONFIG.coupleNames.partner2}
            </h1>
            <div className="flex items-center justify-center gap-4 text-lg md:text-xl mb-8">
              <span className="w-12 h-px bg-white/50" />
              <span className="font-light">{WEDDING_CONFIG.date}</span>
              <span className="w-12 h-px bg-white/50" />
            </div>
            
            <div className="mb-10">
              <p className="text-sm text-rose-100 mb-4 tracking-wider">COUNTDOWN TO OUR SPECIAL DAY</p>
              <CountdownTimer />
            </div>

            <Button 
              onClick={() => scrollToSection('rsvp')}
              className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              RSVP Now
            </Button>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 animate-bounce">
            <ChevronDown className="w-8 h-8" />
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 md:py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Heart className="w-6 h-6 mx-auto text-rose-400 mb-6" />
            <h2 className="text-4xl md:text-5xl font-script text-stone-800 mb-8">
              Our Love Story
            </h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <img 
                  src={publicAsset('couple-sunset.jpg')} 
                  alt="Couple" 
                  className="rounded-2xl shadow-2xl w-full h-96 object-cover"
                />
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-rose-100 rounded-full -z-10" />
                <div className="absolute -top-4 -left-4 w-16 h-16 bg-amber-100 rounded-full -z-10" />
              </div>
              <div className="text-left">
                <p className="text-stone-600 leading-relaxed mb-6 text-lg">
                  It all started with a chance encounter at a coffee shop on a rainy Tuesday morning. 
                  What began as sharing an umbrella turned into sharing our lives.
                </p>
                <p className="text-stone-600 leading-relaxed mb-6 text-lg">
                  Through adventures, laughter, and countless memories, we've grown together 
                  and realized that home isn't a place—it's wherever we are together.
                </p>
                <p className="text-stone-600 leading-relaxed text-lg italic">
                  "In you, I've found the love of my life and my closest friend."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Wedding Details Section */}
        <section id="details" className="py-20 md:py-32 px-4 bg-white/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-script text-stone-800 mb-4">
                Wedding Details
              </h2>
              <p className="text-stone-500">We can't wait to celebrate with you</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold text-stone-800 mb-3">Venue</h3>
                <p className="text-stone-600 mb-1">{WEDDING_CONFIG.venue}</p>
                <p className="text-stone-500 text-sm">{WEDDING_CONFIG.address}</p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-semibold text-stone-800 mb-3">Reception</h3>
                <p className="text-stone-600 mb-2">{WEDDING_CONFIG.time}</p>
                <p className="text-stone-500 text-sm">There will be photobooth available</p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Utensils className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-semibold text-stone-800 mb-3">Dinner</h3>
                <p className="text-stone-600 mb-2">7:00 PM</p>
                <p className="text-stone-500 text-sm">Please arrive 30 minutes early</p>
              </div>
            </div>

            <div className="mt-12">
              <div className="flex items-start gap-4 bg-rose-50/50 rounded-xl p-6 max-w-xl mx-auto">
                <User className="w-6 h-6 text-rose-500 mt-1" />
                <div>
                  <h4 className="font-semibold text-stone-800 mb-2">Dress Code</h4>
                  <p className="text-stone-600 text-sm">Smart Casual Attire</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Photo Gallery Section */}
        <section id="gallery" className="py-20 md:py-32 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Camera className="w-6 h-6 mx-auto text-rose-400 mb-4" />
              <h2 className="text-4xl md:text-5xl font-script text-stone-800 mb-4">
                Photo Gallery
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div 
                className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedPhoto({ id: 'default1', url: publicAsset('wedding-venue.jpg'), name: 'Wedding Venue' })}
              >
                <img src={publicAsset('wedding-venue.jpg')} alt="Venue" className="w-full h-full object-cover" />
              </div>
              <div 
                className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedPhoto({ id: 'default2', url: publicAsset('wedding-flowers.jpg'), name: 'Wedding Flowers' })}
              >
                <img src={publicAsset('wedding-flowers.jpg')} alt="Flowers" className="w-full h-full object-cover" />
              </div>
              <div 
                className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedPhoto({ id: 'default3', url: publicAsset('hero-wedding.jpg'), name: 'Wedding Rings' })}
              >
                <img src={publicAsset('hero-wedding.jpg')} alt="Rings" className="w-full h-full object-cover" />
              </div>
              <div 
                className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedPhoto({ id: 'default4', url: publicAsset('couple-sunset.jpg'), name: 'Couple' })}
              >
                <img src={publicAsset('couple-sunset.jpg')} alt="Couple" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* RSVP Section */}
        <section id="rsvp" className="py-20 md:py-32 px-4 bg-white/50">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <Calendar className="w-6 h-6 mx-auto text-rose-400 mb-4" />
              <h2 className="text-4xl md:text-5xl font-script text-stone-800 mb-4">
                RSVP
              </h2>
              <p className="text-stone-500">
                Please respond by {WEDDING_CONFIG.rsvpDeadline}
              </p>
            </div>

            <form onSubmit={handleRSVPSubmit} className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-stone-700">Full Name *</Label>
                  <Input
                    id="name"
                    value={rsvpData.name}
                    onChange={(e) => setRsvpData({ ...rsvpData, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-stone-700">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={rsvpData.email}
                    onChange={(e) => setRsvpData({ ...rsvpData, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-stone-700 mb-3 block">Relationship *</Label>
                  <RadioGroup
                    value={rsvpData.relationship}
                    onValueChange={(value: 'groom' | 'bride') => setRsvpData({ ...rsvpData, relationship: value })}
                    className="flex flex-col sm:flex-row gap-4"
                    required
                  >
                    <div className="flex items-center space-x-2 bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
                      <RadioGroupItem value="groom" id="groom" />
                      <Label htmlFor="groom" className="cursor-pointer text-stone-700">
                        <span className="font-medium">Groom's / Male Side</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-rose-50 px-4 py-3 rounded-lg border border-rose-100">
                      <RadioGroupItem value="bride" id="bride" />
                      <Label htmlFor="bride" className="cursor-pointer text-stone-700">
                        <span className="font-medium">Bride's / Female Side</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-stone-700 mb-3 block">Will you be attending? *</Label>
                  <RadioGroup
                    value={rsvpData.attending}
                    onValueChange={(value: 'yes' | 'no') => setRsvpData({ ...rsvpData, attending: value })}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes" className="cursor-pointer">Joyfully Accept</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no" className="cursor-pointer">Regretfully Decline</Label>
                    </div>
                  </RadioGroup>
                </div>

                {rsvpData.attending === 'yes' && (
                  <div>
                    <Label htmlFor="guests" className="text-stone-700">Number of Guests *</Label>
                    <select
                      id="guests"
                      value={rsvpData.guests}
                      onChange={(e) => setRsvpData({ ...rsvpData, guests: e.target.value })}
                      className="w-full mt-2 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    >
                      <option value="1">1 Guest</option>
                      <option value="2">2 Guests</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4 Guests</option>
                    </select>
                  </div>
                )}

                <div>
                  <Label htmlFor="message" className="text-stone-700">Message for the Couple</Label>
                  <Textarea
                    id="message"
                    value={rsvpData.message}
                    onChange={(e) => setRsvpData({ ...rsvpData, message: e.target.value })}
                    placeholder="Share your well wishes..."
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white py-6 text-lg rounded-xl"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Submit RSVP
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 bg-stone-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <Heart className="w-8 h-8 mx-auto text-rose-400 mb-4" fill="currentColor" />
            <h3 className="font-script text-3xl mb-4">
              {WEDDING_CONFIG.coupleNames.partner1} & {WEDDING_CONFIG.coupleNames.partner2}
            </h3>
            <p className="text-stone-400 mb-2">{WEDDING_CONFIG.date}</p>
            <p className="text-stone-500 text-sm">
              Made with love for our special day
            </p>
          </div>
        </footer>

        {/* Photo Lightbox */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
            {selectedPhoto && (
              <img 
                src={selectedPhoto.url} 
                alt={selectedPhoto.name}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Google Sheets Instructions Dialog
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-script">Connect to Google Sheets</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-stone-600">
              <p>Follow these steps to connect your RSVP form to Google Sheets:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to <a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">sheets.new</a> to create a new Google Sheet</li>
                <li>Name your sheet (e.g., "Wedding RSVPs")</li>
                <li>Add column headers in row 1: Timestamp, Name, Email, Relationship, Attending, Guests, Message</li>
                <li>Go to <strong>Extensions → Apps Script</strong></li>
                <li>Replace the default code with this script:</li>
              </ol>
              <pre className="bg-stone-100 p-4 rounded-lg text-xs overflow-x-auto">
{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = e.parameter;
  
  sheet.appendRow([
    data.timestamp,
    data.name,
    data.email,
    data.relationship,
    data.attending,
    data.guests,
    data.message
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({
    'result': 'success'
  })).setMimeType(ContentService.MimeType.JSON);
}`}
              </pre>
              <ol className="list-decimal list-inside space-y-2 text-sm" start={6}>
                <li>Click <strong>Deploy → New deployment</strong></li>
                <li>Select type: <strong>Web app</strong></li>
                <li>Set Execute as: <strong>Me</strong></li>
                <li>Set Who has access: <strong>Anyone</strong></li>
                <li>Click <strong>Deploy</strong> and authorize the script</li>
                <li>Copy the Web App URL</li>
                <li>In the code, replace <code>https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec</code> with your URL</li>
              </ol>
              <p className="text-sm text-stone-500 mt-4">
                <strong>Note:</strong> The current demo stores data locally. Uncomment the fetch code in the handleRSVPSubmit function to enable Google Sheets integration.
              </p>
            </div>
          </DialogContent>
        </Dialog> */}

        {/* EmailJS Instructions Dialog
        <Dialog open={showEmailInstructions} onOpenChange={setShowEmailInstructions}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-script flex items-center gap-2">
                <Mail className="w-6 h-6" />
                Set Up Email Confirmation
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-stone-600">
              <p>Follow these steps to send automatic confirmation emails to your guests:</p>
              
              <div className="bg-rose-50 p-4 rounded-lg">
                <h4 className="font-semibold text-rose-700 mb-2">Step 1: Create EmailJS Account</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to <a href="https://www.emailjs.com/" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">emailjs.com</a></li>
                  <li>Sign up for a free account</li>
                  <li>Verify your email address</li>
                </ol>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-700 mb-2">Step 2: Add Email Service</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to <strong>Email Services</strong> in your dashboard</li>
                  <li>Click <strong>Add New Service</strong></li>
                  <li>Choose your email provider (Gmail, Outlook, etc.)</li>
                  <li>Connect your email account</li>
                  <li>Copy the <strong>Service ID</strong></li>
                </ol>
              </div> */}

              {/* <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-700 mb-2">Step 3: Create Email Template</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to <strong>Email Templates</strong></li>
                  <li>Click <strong>Create New Template</strong></li>
                  <li>Use these template variables:</li>
                </ol>
                <pre className="bg-white p-3 rounded mt-2 text-xs overflow-x-auto">
{`Subject: RSVP Confirmation - {{couple_names}} Wedding

Dear {{to_name}},

Thank you for your RSVP to {{couple_names}}'s wedding!

Here are the details of your submission:

📅 Wedding Date: {{wedding_date}}
🕐 Time: {{wedding_time}}
📍 Venue: {{wedding_venue}}
🏠 Address: {{wedding_address}}

Your Response:
✓ Attending: {{attending_status}}
👥 Number of Guests: {{number_of_guests}}
👤 Relationship: {{relationship}}
💌 Your Message: {{guest_message}}

We look forward to celebrating with you!

With love,
{{couple_names}}`}
                </pre>
                <p className="text-sm mt-2">Save the template and copy the <strong>Template ID</strong></p>
              </div> */}

              {/* <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-700 mb-2">Step 4: Get Your Public Key</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Go to <strong>Account → API Keys</strong></li>
                  <li>Copy your <strong>Public Key</strong></li>
                </ol>
              </div> */}

              {/* <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-700 mb-2">Step 5: Update the Code</h4>
                <p className="text-sm mb-2">Replace these values in the WEDDING_CONFIG:</p>
                <pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`emailjs: {
  serviceId: 'your_service_id',     // From Step 2
  templateId: 'your_template_id',   // From Step 3
  publicKey: 'your_public_key',     // From Step 4
}`}
                </pre>
              </div> */}

              {/* <p className="text-sm text-stone-500">
                <strong>Note:</strong> The free EmailJS plan includes 200 emails per month. For more, upgrade to a paid plan.
              </p> */}
            {/* </div>
          </DialogContent>
        </Dialog> */}
      </main>

      {/* Full Screen Envelope - Rendered AFTER main content so it appears on top */}
      <FullScreenEnvelope onOpen={handleEnvelopeOpen} isOpen={envelopeOpened} />
      
      {/* Background Music Player */}
      <BackgroundMusic />
    </>
  );
}

// Main App Component with Audio Provider
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-amber-50 to-rose-50">
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </div>
  );
}

export default App;