import { useState, useRef, useEffect } from 'react';
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
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import emailjs from '@emailjs/browser';
import './App.css';

// Wedding configuration - Edit these details
const WEDDING_CONFIG = {
  coupleNames: {
    partner1: 'Emma',
    partner2: 'James'
  },
  date: 'Saturday, December 12, 2026',
  time: '4:00 PM',
  venue: 'Rosewood Gardens',
  address: '123 Blossom Lane, Napa Valley, CA',
  rsvpDeadline: 'November 12, 2026',
  // Wedding date for countdown (YYYY, MM-1, DD, HH, MM)
  weddingDate: new Date(2026, 11, 12, 16, 0), // December 12, 2026 at 4:00 PM
  // Google Sheets Web App URL - Replace with your own after deployment
  googleSheetsUrl: 'https://script.google.com/macros/s/AKfycbxJNYRGmQHMXXzu2gAODAalAeh8WwnRYPUN2o4iZM6bwWxOK48D2-K2-OeLWy3mvtEUzw/exec',
  // EmailJS Configuration - Replace with your own after setup
  emailjs: {
    serviceId: 'YOUR_SERVICE_ID',      // e.g., 'service_abc123'
    templateId: 'YOUR_TEMPLATE_ID',    // e.g., 'template_xyz789'
    publicKey: 'YOUR_PUBLIC_KEY',      // e.g., 'user_123abc'
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

function App() {
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

  // Send confirmation email using EmailJS
  const sendConfirmationEmail = async (data: RSVPData) => {
    try {
      const templateParams = {
        to_name: data.name,
        to_email: data.email,
        couple_names: `${WEDDING_CONFIG.coupleNames.partner1} & ${WEDDING_CONFIG.coupleNames.partner2}`,
        wedding_date: WEDDING_CONFIG.date,
        wedding_time: WEDDING_CONFIG.time,
        wedding_venue: WEDDING_CONFIG.venue,
        wedding_address: WEDDING_CONFIG.address,
        attending_status: data.attending === 'yes' ? 'Joyfully Accept' : 'Regretfully Decline',
        number_of_guests: data.guests,
        relationship: data.relationship === 'groom' ? "Groom's / Male Side" : "Bride's / Female Side",
        guest_message: data.message || 'No message',
        reply_to: 'wedding@example.com', // Replace with your email
      };

      await emailjs.send(
        WEDDING_CONFIG.emailjs.serviceId,
        WEDDING_CONFIG.emailjs.templateId,
        templateParams
      );
      
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append('name', rsvpData.name);
      formData.append('email', rsvpData.email);
      formData.append('attending', rsvpData.attending);
      formData.append('guests', rsvpData.guests);
      formData.append('relationship', rsvpData.relationship);
      formData.append('message', rsvpData.message);
      formData.append('timestamp', new Date().toISOString());

      // Simulate API call - Replace with actual fetch to Google Sheets
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Uncomment for actual Google Sheets integration:
      // await fetch(WEDDING_CONFIG.googleSheetsUrl, {
      //   method: 'POST',
      //   body: formData,
      //   mode: 'no-cors'
      // });

      // Send confirmation email
      const emailSent = await sendConfirmationEmail(rsvpData);
      
      if (emailSent) {
        toast.success('RSVP submitted! A confirmation email has been sent to you.');
      } else {
        toast.success('RSVP submitted successfully! We can\'t wait to celebrate with you!');
        toast.info('Note: Email confirmation is not configured yet. See setup instructions.');
      }

      // Reset form
      setRsvpData({
        name: '',
        email: '',
        attending: 'yes',
        guests: '1',
        relationship: 'groom',
        message: ''
      });
    } catch (error) {
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

    // Reset input
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
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-amber-50 to-rose-50">
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
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${publicAsset('hero-wedding.jpg')})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
        
        {/* Content */}
        <div className="relative z-10 text-center text-white px-4 animate-fade-in-up">
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
          
          {/* Countdown Timer */}
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

        {/* Scroll Indicator */}
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
            {/* Venue */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-3">Venue</h3>
              <p className="text-stone-600 mb-1">{WEDDING_CONFIG.venue}</p>
              <p className="text-stone-500 text-sm">{WEDDING_CONFIG.address}</p>
            </div>

            {/* Reception */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-3">Reception</h3>
              <p className="text-stone-600 mb-2">{WEDDING_CONFIG.time}</p>
              <p className="text-stone-500 text-sm">Please arrive 30 minutes early</p>
            </div>

            {/* Dinner */}
            <div className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Utensils className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-3">Dinner</h3>
              <p className="text-stone-600 mb-2">Fine Dining Experience</p>
              <p className="text-stone-500 text-sm">Immediately following reception</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12">
            <div className="flex items-start gap-4 bg-rose-50/50 rounded-xl p-6 max-w-xl mx-auto">
              <User className="w-6 h-6 text-rose-500 mt-1" />
              <div>
                <h4 className="font-semibold text-stone-800 mb-2">Dress Code</h4>
                <p className="text-stone-600 text-sm">Semi-formal attire. The venue has both indoor and outdoor spaces, so please dress accordingly.</p>
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
            <p className="text-stone-500 mb-2">Share your favorite moments with us</p>
            <button 
              onClick={() => setShowInstructions(true)}
              className="text-rose-500 text-sm hover:underline"
            >
              How to set up Google Sheets integration →
            </button>
          </div>

          {/* Default Photos */}
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

          {/* Uploaded Photos */}
          {uploadedPhotos.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-stone-700 mb-4">Your Uploaded Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedPhotos.map(photo => (
                  <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden">
                    <img 
                      src={photo.url} 
                      alt={photo.name} 
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-rose-300 text-rose-600 hover:bg-rose-50 px-8 py-6"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Photos
            </Button>
            <p className="text-stone-400 text-sm mt-3">
              Photos are stored locally in your browser
            </p>
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
              {/* Name */}
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

              {/* Email */}
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

              {/* Relationship - NEW REQUIRED FIELD */}
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

              {/* Attending */}
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

              {/* Number of Guests */}
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

              {/* Message */}
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

              {/* Submit Button */}
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

          {/* Setup Links */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setShowInstructions(true)}
              className="text-rose-500 text-sm hover:underline"
            >
              How to connect RSVP to Google Sheets →
            </button>
            <button 
              onClick={() => setShowEmailInstructions(true)}
              className="text-rose-500 text-sm hover:underline flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
              How to set up Email Confirmation →
            </button>
          </div>
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

      {/* Google Sheets Instructions Dialog */}
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
      </Dialog>

      {/* EmailJS Instructions Dialog */}
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
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
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
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-2">Step 4: Get Your Public Key</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to <strong>Account → API Keys</strong></li>
                <li>Copy your <strong>Public Key</strong></li>
              </ol>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-700 mb-2">Step 5: Update the Code</h4>
              <p className="text-sm mb-2">Replace these values in the WEDDING_CONFIG:</p>
              <pre className="bg-white p-3 rounded text-xs overflow-x-auto">
{`emailjs: {
  serviceId: 'your_service_id',     // From Step 2
  templateId: 'your_template_id',   // From Step 3
  publicKey: 'your_public_key',     // From Step 4
}`}
              </pre>
            </div>

            <p className="text-sm text-stone-500">
              <strong>Note:</strong> The free EmailJS plan includes 200 emails per month. For more, upgrade to a paid plan.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
