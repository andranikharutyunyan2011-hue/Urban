import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Car, 
  Search, 
  Plus, 
  LogIn, 
  LogOut, 
  MapPin, 
  Trash2, 
  Info,
  Filter,
  X,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  LifeBuoy,
  BookOpen,
  User as UserIcon,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Send,
  Lock,
  Upload,
  Edit,
  Monitor,
  Smartphone,
  QrCode,
  RefreshCw,
  Wifi,
  Battery,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  doc,
  setDoc,
  getDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Types
type Listing = {
  id: string;
  type: 'car' | 'building';
  category: 'rent' | 'buy';
  title: string;
  price: number;
  location: string;
  image: string;
  description?: string;
  authorId: string;
  authorName?: string;
  createdAt: any;
  specs?: Record<string, string>;
};

type UserProfile = {
  uid: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  role: 'user' | 'admin';
  phone?: string;
  vipStatus?: 'standard' | 'vip' | 'elite';
};

type ServiceRequest = {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  serviceName: string;
  message?: string;
  preferredDate?: string;
  status: 'pending' | 'reviewed' | 'contacted';
  createdAt: any;
};

type SupportTicket = {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  subject: string;
  category: 'general' | 'billing' | 'technical' | 'verification';
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: any;
};

// Firestore Error Handling Compliance
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error details for diagnosing rules: ', JSON.stringify(errInfo));
}

// Support Tab FAQs definition
const FAQS = [
  {
    q: "Ինչպե՞ս է կատարվում գույքի կամ մեքենայի փոխանցումը:",
    a: "Մեր Premium Concierge ծառայությունը զբաղվում է բոլոր փաստաթղթային ձևակերպումներով, ապահովագրությամբ և գույքի/մեքենայի առաքմամբ հենց ձեր նախընտրած հասցեով՝ ապահովելով առավելագույն գաղտնիություն ու արագություն:"
  },
  {
    q: "Կարո՞ղ եմ վճարել կրիպտոարժույթով կամ արտարժույթով:",
    a: "Այո, UrbanAm-ը համագործակցում է լիցենզավորված ֆինանսական գործընկերների հետ, ինչը թույլ է տալիս կատարել վճարումներ ինչպես ավանդական բանկային փոխանցումներով, այնպես էլ խոշոր կրիպտոարժույթներով (USDT, BTC)՝ երաշխավորելով լիարժեք իրավաբանական անվտանգություն:"
  },
  {
    q: "Ի՞նչ արտոնություններ ունեն VIP և Elite օգտատերերը:",
    a: "VIP և Elite կարգավիճակ ունեցող օգտատերերն ստանում են անհատական մենեջեր, առաջնահերթ սպասարկում աջակցության կենտրոնում, էքսկլյուզիվ (չհրապարակված) առաջարկների հասանելիություն և զեղչեր շքեղ մեքենաների վարձակալության համար:"
  },
  {
    q: "Ինչպե՞ս ստանալ Verified (Վավերացված) պրոֆիլ:",
    a: "Վավերացման համար անհրաժեշտ է Support բաժնում բացել 'Verification' կատեգորիայի տոմս (Ticket) և կցել պահանջվող փաստաթղթերը կամ կապ հաստատել մեր գործակալի հետ: Մեր թիմը կստուգի տվյալները 24 ժամվա ընթացքում:"
  }
];

// Luxury Services definition
const SERVICES = [
  {
    id: "chauffeur",
    title: "Շքեղ Մեքենաների Վարձույթ և Չարթեր",
    subtitle: "Luxury Chauffeur & Charter",
    description: "VIP դասի ավտոմեքենաների տրամադրում անձնական վարորդով կամ առանց: Ներառում է օդանավակայանի դիմավորում, անվտանգության ապահովում և էլիտար սպասարկում ողջ Հայաստանում:",
    icon: Car,
    bgColor: "bg-amber-50 text-amber-600 border-amber-100",
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "brokerage",
    title: "Էլիտար Անշարժ Գույքի Բրոքերաժ",
    subtitle: "VIP Real Estate Brokerage",
    description: "Լյուքս դասի պենտհաուսների, առանձնատների և կոմերցիոն տարածքների առք, վաճառք և վարձակալություն: Լիարժեք իրավաբանական աջակցություն և գաղտնիության երաշխիք:",
    icon: Building2,
    bgColor: "bg-blue-50 text-blue-600 border-blue-100",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "helicopter",
    title: "Ուղղաթիռային Չարթեր և Տուրեր",
    subtitle: "Helicopter Charter & Sightseeing",
    description: "Անհատական թռիչքներ Հայաստանի ցանկացած կետ, էքսկլյուզիվ տուրեր դեպի տեսարժան վայրեր և Սևանա լիճ: Արագ, ապահով և տպավորիչ տեղաշարժ:",
    icon: Sparkles,
    bgColor: "bg-purple-50 text-purple-600 border-purple-100",
    image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "interior",
    title: "Ինտերիեր Դիզայն և Կոնսուլտացիա",
    subtitle: "Premium Architecture & Interior Design",
    description: "Շքեղ անշարժ գույքի ինտերիերի և էքստերիերի դիզայնի մշակում աշխարհահռչակ ճարտարապետների կողմից: Ինտեգրված 'Smart Home' լուծումներ:",
    icon: Building2,
    bgColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800"
  }
];

export default function App() {
  // Navigation & View States
  const [currentView, setCurrentView] = useState<'marketplace' | 'services' | 'support' | 'profile' | 'admin'>('marketplace');
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Data States
  const [listings, setListings] = useState<Listing[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  // Filtering & Modal States
  const [activeType, setActiveType] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNavBlocked, setIsNavBlocked] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [showMyListings, setShowMyListings] = useState(false);
  const [selectedListingForDetail, setSelectedListingForDetail] = useState<Listing | null>(null);

  // Dynamic Add/Edit Listing type states
  const [addListingType, setAddListingType] = useState<'car' | 'building'>('car');
  const [editListingType, setEditListingType] = useState<'car' | 'building'>('car');

  // Detailed Marketplace Filtering States
  const [filterCarModel, setFilterCarModel] = useState<string>('all');
  const [filterCarEngineMin, setFilterCarEngineMin] = useState<string>('all');
  const [filterCarColor, setFilterCarColor] = useState<string>('all');
  const [filterCarBody, setFilterCarBody] = useState<string>('all');

  const [filterBuildingType, setFilterBuildingType] = useState<string>('all');
  const [filterBuildingBedrooms, setFilterBuildingBedrooms] = useState<string>('all');
  const [filterBuildingFloor, setFilterBuildingFloor] = useState<string>('all');
  
  // Form Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // FAQ Accordion Active state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Profile Edit fields
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Image Uploading States and Handlers
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isSubmittingListing, setIsSubmittingListing] = useState<boolean>(false);
  const [imageDragOver, setImageDragOver] = useState<boolean>(false);

  // Auto-detect mobile devices and mobile query parameter
  useEffect(() => {
    const checkMobile = () => {
      const params = new URLSearchParams(window.location.search);
      const forceMobile = params.get('view') === 'mobile' || params.get('device') === 'mobile';
      setIsMobile(forceMobile || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listing Editing States
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editingImageBase64, setEditingImageBase64] = useState<string>('');

  // Sync editing image state with selected listing
  useEffect(() => {
    if (!editingListing) {
      setEditingImageBase64('');
    } else {
      setEditingImageBase64(editingListing.image || '');
    }
  }, [editingListing]);

  // Auto reset uploaded image when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      setUploadedImageBase64('');
    }
  }, [isModalOpen]);

  // Prevent ghost clicks/tap-throughs to bottom navigation when modal closes
  useEffect(() => {
    if (isModalOpen) {
      setIsNavBlocked(true);
    } else {
      const timer = setTimeout(() => {
        setIsNavBlocked(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      triggerToast("Խնդրում ենք ընտրել միայն նկար ֆայլեր:", "error");
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize logic to compress the image
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress as low-size jpeg with 0.75 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
          setUploadedImageBase64(compressedBase64);
        } else {
          // Fallback if canvas context is not supported
          setUploadedImageBase64(event.target?.result as string);
        }
        setIsUploadingImage(false);
        triggerToast("Նկարը հաջողությամբ բեռնվեց:");
      };
      img.onerror = () => {
        setIsUploadingImage(false);
        triggerToast("Նկարի վերլուծության սխալ:", "error");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
      triggerToast("Ֆայլի ընթերցման սխալ:", "error");
    };
    reader.readAsDataURL(file);
  };

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth & Database listeners
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Fetch custom user profile
        const userDocRef = doc(db, 'users', u.uid);
        try {
          const userSnap = await getDoc(userDocRef);
          const isAdminEmail = u.email === 'andranik.harutyunyan2011@gmail.com';
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            if (isAdminEmail && (data.role !== 'admin' || data.vipStatus !== 'elite')) {
              const updatedProfile: UserProfile = { 
                ...data, 
                role: 'admin', 
                vipStatus: 'elite' 
              };
              await setDoc(userDocRef, updatedProfile, { merge: true });
              setProfile(updatedProfile);
            } else {
              setProfile(data);
            }
            setPhoneInput(data.phone || '');
            setNameInput(data.displayName || u.displayName || '');
          } else {
            // Create user profile in Firestore
            const newProfile: UserProfile = {
              uid: u.uid,
              displayName: u.displayName || 'Անանուն Օգտատեր',
              email: u.email || '',
              photoURL: u.photoURL || '',
              role: isAdminEmail ? 'admin' : 'user',
              vipStatus: isAdminEmail ? 'elite' : 'standard'
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
            setPhoneInput('');
            setNameInput(newProfile.displayName || '');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
      }
    });

    // Marketplace Listings listener
    const listingsQuery = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const unsubListings = onSnapshot(listingsQuery, (snapshot) => {
      setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'listings');
    });

    return () => { 
      unsubAuth(); 
      unsubListings(); 
    };
  }, []);

  // Auto-delete specific Mercedes w219 listings as requested
  useEffect(() => {
    if (listings.length > 0) {
      const targetListing = listings.find(item => {
        const title = (item.title || '').toLowerCase();
        return title.includes('w219') || 
               (title.includes('merceds') && title.includes('20000')) || 
               (title.includes('mercedes') && title.includes('20000')) || 
               title.includes('merceds cls') ||
               title.includes('cls w219');
      });
      if (targetListing) {
        deleteDoc(doc(db, 'listings', targetListing.id))
          .then(() => {
            triggerToast(`Mercedes w219 հայտարարությունը հաջողությամբ ջնջվեց:`);
          })
          .catch(err => {
            console.error("Error auto-deleting:", err);
          });
      }
    }
  }, [listings]);

  // Listeners that depend on the active User & Role
  useEffect(() => {
    if (!user) {
      setServiceRequests([]);
      setSupportTickets([]);
      return;
    }

    const isAdmin = profile?.role === 'admin' || user.email === 'andranik.harutyunyan2011@gmail.com';

    // Support Tickets listener
    const ticketsQuery = isAdmin
      ? query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'supportTickets'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubTickets = onSnapshot(ticketsQuery, (snapshot) => {
      setSupportTickets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'supportTickets');
    });

    // Service Requests listener
    const requestsQuery = isAdmin
      ? query(collection(db, 'serviceRequests'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'serviceRequests'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
      setServiceRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'serviceRequests');
    });

    return () => {
      unsubTickets();
      unsubRequests();
    };
  }, [user, profile?.role]);

  // Handle Google Log In
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      triggerToast("Մուտքը հաջողությամբ կատարվեց:");
    } catch (error) {
      triggerToast("Մուտքի սխալ: Խնդրում ենք փորձել կրկին:", "error");
    }
  };

  // Update Profile details
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: nameInput,
        phone: phoneInput
      });
      if (profile) {
        setProfile({ ...profile, displayName: nameInput, phone: phoneInput });
      }
      triggerToast("Պրոֆիլի տվյալները թարմացվեցին:");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      triggerToast("Խնդիր տվյալների թարմացման ժամանակ:", "error");
    }
  };

  // Post Listing
  const handleAddListing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingListing) return;
    if (!user) {
      triggerToast("Հայտարարություն տեղադրելու համար նախ մուտք գործեք:", "error");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      setIsSubmittingListing(true);
      const specs: Record<string, string> = {};
      if (data.type === 'car') {
        specs['Model'] = String(data.spec_car_model || 'BMW');
        specs['Engine'] = String(data.spec_car_engine ? data.spec_car_engine + ' L' : '2.0 L');
        specs['Color'] = String(data.spec_car_color || 'Black');
        specs['Body'] = String(data.spec_car_body || 'Sedan');
        specs['Transmission'] = String(data.spec_car_transmission || 'Automatic');
      } else {
        specs['Type'] = String(data.spec_building_type || 'Apartment');
        specs['Bedrooms'] = String(data.spec_building_bedrooms || '2');
        specs['Size'] = String(data.spec_building_size ? data.spec_building_size + ' sqft' : '1,200 sqft');
        specs['Floor'] = String(data.spec_building_floor || '3');
      }

      const listingData: any = {
        title: data.title,
        type: data.type,
        category: data.category,
        price: Number(data.price),
        location: data.location,
        description: data.description || '',
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || 'Անանուն',
        createdAt: serverTimestamp(),
        specs: specs
      };

      if (uploadedImageBase64) {
        listingData.image = uploadedImageBase64;
      }

      await addDoc(collection(db, 'listings'), listingData);
      setUploadedImageBase64('');
      triggerToast("Հայտարարությունը հաջողությամբ տեղադրվեց:");
      
      // Delay closing modal slightly to prevent tap-through/ghost click on underlying mobile layout buttons (e.g. support/chat button)
      setTimeout(() => {
        setIsModalOpen(false);
        setIsSubmittingListing(false);
      }, 450);
    } catch (error) {
      setIsSubmittingListing(false);
      handleFirestoreError(error, OperationType.CREATE, 'listings');
      triggerToast("Սխալ հայտարարություն ավելացնելիս:", "error");
    }
  };

  // Submit Support Ticket
  const handleSubmitTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      triggerToast("Տոմս բացելու համար անհրաժեշտ է մուտք գործել:", "error");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await addDoc(collection(db, 'supportTickets'), {
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Անանուն',
        userEmail: user.email || '',
        subject: data.subject,
        category: data.category,
        message: data.message,
        status: 'open',
        createdAt: serverTimestamp()
      });
      e.currentTarget.reset();
      triggerToast("Աջակցության տոմսը հաջողությամբ ուղարկվեց: Մեր թիմը շուտով կպատասխանի ձեզ:");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'supportTickets');
      triggerToast("Չհաջողվեց ուղարկել աջակցության հարցումը:", "error");
    }
  };

  // Book Concierge Service Booking
  const handleBookService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      triggerToast("Ծառայություն պատվիրելու համար անհրաժեշտ է մուտք գործել:", "error");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await addDoc(collection(db, 'serviceRequests'), {
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Անանուն',
        userEmail: user.email || '',
        serviceName: selectedService,
        message: data.message || '',
        preferredDate: data.preferredDate || '',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setIsBookingModalOpen(false);
      triggerToast("Ձեր հայտը հաջողությամբ ընդունվել է: Կապ կհաստատենք շատ արագ:");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'serviceRequests');
      triggerToast("Չհաջողվեց պատվիրել ծառայությունը:", "error");
    }
  };

  // Submit Listing Inquiry
  const handleInquirySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (!selectedListingForDetail) return;

    try {
      await addDoc(collection(db, 'serviceRequests'), {
        userId: user ? user.uid : 'anonymous',
        userName: user ? (profile?.displayName || user.displayName || 'Անանուն') : (data.name || 'Անանուն Հարցնող'),
        userEmail: user ? (user.email || '') : (data.email || 'no-email@anonymous.com'),
        serviceName: `Հարցում՝ ${selectedListingForDetail.title}`,
        message: `Հեռախոս՝ ${data.phone || 'Չի նշվել'}. Հարց՝ ${data.message || 'Հետաքրքրված է այս հայտարարությամբ'}`,
        preferredDate: new Date().toLocaleDateString('hy-AM'),
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSelectedListingForDetail(null);
      triggerToast("Ձեր հարցումը հաջողությամբ ուղարկվեց: Մեր մասնագետը կապ կհաստատի Ձեզ հետ:");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'serviceRequests');
      triggerToast("Չհաջողվեց ուղարկել հարցումը:", "error");
    }
  };

  // Delete Listing
  const handleDeleteListing = async (id: string) => {
    setConfirmDialog({
      title: "Ջնջել Հայտարարությունը",
      message: "Դուք վստա՞հ եք, որ ցանկանում եք ջնջել այս հայտարարությունը: Այս գործողությունը անդառնալի է:",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'listings', id));
          triggerToast("Հայտարարությունը ջնջված է:");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `listings/${id}`);
          triggerToast("Ջնջման սխալ:", "error");
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  // Update Listing
  const handleUpdateListing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingListing) return;
    if (!user) {
      triggerToast("Գործողությունը կատարելու համար նախ մուտք գործեք:", "error");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      setIsSubmittingListing(true);
      const updatedData: any = {
        title: data.title,
        type: data.type,
        category: data.category,
        price: Number(data.price),
        location: data.location,
        description: data.description || '',
      };

      if (editingImageBase64) {
        updatedData.image = editingImageBase64;
      }

      const specs: Record<string, string> = {};
      if (data.type === 'car') {
        specs['Model'] = String(data.spec_car_model || 'BMW');
        specs['Engine'] = String(data.spec_car_engine ? data.spec_car_engine + ' L' : '2.0 L');
        specs['Color'] = String(data.spec_car_color || 'Black');
        specs['Body'] = String(data.spec_car_body || 'Sedan');
        specs['Transmission'] = String(data.spec_car_transmission || 'Automatic');
      } else {
        specs['Type'] = String(data.spec_building_type || 'Apartment');
        specs['Bedrooms'] = String(data.spec_building_bedrooms || '2');
        specs['Size'] = String(data.spec_building_size ? data.spec_building_size + ' sqft' : '1,200 sqft');
        specs['Floor'] = String(data.spec_building_floor || '3');
      }
      updatedData.specs = specs;

      await updateDoc(doc(db, 'listings', editingListing.id), updatedData);
      triggerToast("Հայտարարությունը հաջողությամբ թարմացվեց:");
      setEditingListing(null);
      setEditingImageBase64('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `listings/${editingListing.id}`);
      triggerToast("Սխալ հայտարարությունը թարմացնելիս:", "error");
    } finally {
      setIsSubmittingListing(false);
    }
  };

  const handleEditImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      triggerToast("Խնդրում ենք ընտրել միայն նկար ֆայլեր:", "error");
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
          setEditingImageBase64(compressedBase64);
        } else {
          setEditingImageBase64(event.target?.result as string);
        }
        setIsUploadingImage(false);
        triggerToast("Նկարը հաջողությամբ բեռնվեց:");
      };
      img.onerror = () => {
        setIsUploadingImage(false);
        triggerToast("Նկարի վերլուծության սխալ:", "error");
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsUploadingImage(false);
      triggerToast("Ֆայլի ընթերցման սխալ:", "error");
    };
    reader.readAsDataURL(file);
  };

  // Delete Service Request
  const handleDeleteServiceRequest = async (id: string) => {
    setConfirmDialog({
      title: "Ջնջել Ծառայության Հայտը",
      message: "Դուք վստա՞հ եք, որ ցանկանում եք ջնջել այս ծառայության հայտը:",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'serviceRequests', id));
          triggerToast("Ծառայության հայտը ջնջված է:");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `serviceRequests/${id}`);
          triggerToast("Ջնջման սխալ:", "error");
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  // Update Service Request Status
  const handleUpdateServiceRequestStatus = async (id: string, status: 'pending' | 'reviewed' | 'contacted') => {
    try {
      await updateDoc(doc(db, 'serviceRequests', id), { status });
      triggerToast("Կարգավիճակը թարմացվեց:");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `serviceRequests/${id}`);
      triggerToast("Թարմացման սխալ:", "error");
    }
  };

  // Delete Support Ticket
  const handleDeleteSupportTicket = async (id: string) => {
    setConfirmDialog({
      title: "Ջնջել Աջակցության Տոմսը",
      message: "Դուք վստա՞հ եք, որ ցանկանում եք ջնջել այս աջակցության տոմսը:",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'supportTickets', id));
          triggerToast("Աջակցության տոմսը ջնջված է:");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `supportTickets/${id}`);
          triggerToast("Ջնջման սխալ:", "error");
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };
  // Update Support Ticket Status
  const handleUpdateSupportTicketStatus = async (id: string, status: 'open' | 'in-progress' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'supportTickets', id), { status });
      triggerToast("Կարգավիճակը թարմացվեց:");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `supportTickets/${id}`);
      triggerToast("Թարմացման սխալ:", "error");
    }
  };

  // Filter listings
  const filteredListings = listings.filter(item => {
    const mType = activeType === 'all' || item.type === activeType;
    const mCat = activeCategory === 'all' || item.category === activeCategory;
    const mSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.specs?.Model && item.specs.Model.toLowerCase().includes(searchQuery.toLowerCase()));
    const mMine = !showMyListings || (user && item.authorId === user.uid);

    // Detailed car filters
    let mCarModel = true;
    let mCarEngine = true;
    let mCarColor = true;
    let mCarBody = true;
    if (activeType === 'car') {
      if (filterCarModel !== 'all') {
        mCarModel = item.specs?.Model === filterCarModel;
      }
      if (filterCarEngineMin !== 'all') {
        const itemEngine = parseFloat(item.specs?.Engine || '0');
        const minEngine = parseFloat(filterCarEngineMin);
        mCarEngine = itemEngine >= minEngine;
      }
      if (filterCarColor !== 'all') {
        mCarColor = item.specs?.Color === filterCarColor;
      }
      if (filterCarBody !== 'all') {
        mCarBody = item.specs?.Body === filterCarBody;
      }
    }

    // Detailed building filters
    let mBuildingType = true;
    let mBuildingBedrooms = true;
    let mBuildingFloor = true;
    if (activeType === 'building') {
      if (filterBuildingType !== 'all') {
        mBuildingType = item.specs?.Type === filterBuildingType;
      }
      if (filterBuildingBedrooms !== 'all') {
        mBuildingBedrooms = item.specs?.Bedrooms === filterBuildingBedrooms;
      }
      if (filterBuildingFloor !== 'all') {
        mBuildingFloor = item.specs?.Floor === filterBuildingFloor;
      }
    }

    return mType && mCat && mSearch && mMine && mCarModel && mCarEngine && mCarColor && mCarBody && mBuildingType && mBuildingBedrooms && mBuildingFloor;
  });

  const renderMobileView = (isInSimulator = false) => {
    return (
      <div className={`flex flex-col ${isInSimulator ? 'h-full overflow-y-auto pb-20' : 'min-h-screen pb-24'} bg-[#F4F6F8] text-left relative`}>
        {/* App Sticky Mobile Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm px-5 py-3.5 border-b border-gray-100 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#111] rounded-xl flex items-center justify-center text-white shadow-md">
              <Building2 size={15} className="text-amber-400" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight block text-[#111]">UrbanAm</span>
              <p className="text-[7px] text-amber-600 font-black uppercase tracking-widest leading-none">Armenia Premium</p>
            </div>
          </div>

          {/* Profile icon in Mobile Header */}
          {user ? (
            <div className="flex items-center gap-2">
              <img 
                onClick={() => setCurrentView('profile')}
                src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120'} 
                className="w-7 h-7 rounded-full border border-amber-400 cursor-pointer shadow-sm active:scale-95"
                alt="avatar" 
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-3 py-1.5 bg-[#111] text-white text-[9px] font-extrabold rounded-full flex items-center gap-1 active:scale-95"
            >
              <LogIn size={9} /> Login
            </button>
          )}
        </div>

        {/* =========================================
            MOBILE VIEW: MARKETPLACE (Գլխավոր)
            ========================================= */}
        {currentView === 'marketplace' && (
          <div className="p-4 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Որոնել մեքենաներ կամ բնակարաններ..."
                className="w-full bg-white border border-gray-200 rounded-2xl py-2.5 pl-10 pr-9 text-xs focus:outline-none focus:border-amber-500 shadow-xs"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Horizontal Scroll for Types (All / Cars / Properties) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: '⚡ Բոլորը' },
                { id: 'car', label: '🚗 Cars' },
                { id: 'building', label: '🏢 Real Estate' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setActiveType(btn.id)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${
                    activeType === btn.id 
                      ? 'bg-[#111] text-white shadow-md' 
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Rent / Buy Horizontal Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'Բոլոր Գործարքները' },
                { id: 'rent', label: '🔑 Վարձակալություն' },
                { id: 'buy', label: '💎 Վաճառք' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setActiveCategory(btn.id)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                    activeCategory === btn.id 
                      ? 'bg-amber-400 text-black font-black shadow-sm' 
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Listings Grid */}
            <div className="space-y-4">
              {filteredListings.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-xs">
                   <Search className="mx-auto text-gray-300 mb-2" size={24} />
                   <p className="text-xs font-bold text-gray-500">Հայտարարություններ չեն գտնվել</p>
                </div>
              ) : (
                filteredListings.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedListingForDetail(item)}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer group relative text-left"
                  >
                    {/* Rent/Buy Badge */}
                    <span className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm ${
                      item.category === 'rent' ? 'bg-[#111] text-amber-400' : 'bg-amber-400 text-black'
                    }`}>
                      {item.category === 'rent' ? 'Վարձակալություն' : 'Վաճառք'}
                    </span>

                    {/* Image */}
                    <div className="h-44 w-full relative bg-gray-100 overflow-hidden">
                      <img 
                        src={item.image || (item.type === 'car' 
                          ? "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800"
                          : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800")} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={item.title} 
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-2">
                      <span className="text-[9px] font-extrabold text-amber-600 tracking-wider uppercase block">
                        {item.type === 'car' ? 'Luxury Vehicle' : 'Premium Property'}
                      </span>
                      <h3 className="text-xs font-black text-[#111] line-clamp-1 leading-tight">{item.title}</h3>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1">
                        <MapPin size={10} className="text-amber-500 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>

                      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 mt-2">
                        <span className="text-[13px] font-black text-[#111]">
                          ${item.price.toLocaleString()}
                        </span>
                        
                        {/* Edit/Delete Actions for Owners */}
                        {(user?.uid === item.authorId || profile?.role === 'admin' || user?.email === 'andranik.harutyunyan2011@gmail.com') && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => {
                                setEditingListing(item);
                                setEditListingType(item.type);
                              }}
                              className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                            >
                              <Edit size={12} />
                            </button>
                            <button 
                              onClick={() => handleDeleteListing(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Floating Action Add Button */}
            {user && (
              <button
                onClick={() => {
                  setAddListingType('car');
                  setIsModalOpen(true);
                }}
                className={`${isInSimulator ? 'absolute bottom-20 right-4' : 'fixed bottom-24 right-6'} z-40 w-12 h-12 bg-[#111] hover:bg-amber-400 text-white hover:text-black rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all`}
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        )}

        {/* =========================================
            MOBILE VIEW: SERVICES (Կոնսիեռժ)
            ========================================= */}
        {currentView === 'services' && (
          <div className="p-4 space-y-4">
            <div className="bg-[#111] text-white p-5 rounded-2xl relative overflow-hidden shadow-lg">
              <Sparkles size={120} className="absolute right-0 bottom-0 opacity-5 pointer-events-none" />
              <span className="text-[8px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                Armenia Exclusive
              </span>
              <h3 className="text-sm font-black mt-2">VIP Կոնսիեռժ Ծառայություններ</h3>
              <p className="text-[10px] text-[#888] mt-1 leading-relaxed">Ամրագրեք բարձրակարգ և շքեղ ծառայություններ հենց Ձեր հեռախոսից։</p>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {[
                { id: 'Helicopter Charter', name: '🚁 Ուղղաթիռի Վարձույթ', desc: 'Բացահայտեք Հայաստանը երկնքից՝ VIP ուղղաթիռներով', image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800' },
                { id: 'Luxury Yacht', name: '🛥️ Լյուքս Զբոսանավ Սևանում', desc: 'Բարձրակարգ հանգիստ Սևանա լճում՝ լավագույն զբոսանավերով', image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=400' },
                { id: 'Personal Bodyguard', name: '🛡️ Անձնական Թիկնապահ', desc: 'Պրոֆեսիոնալ անվտանգության ապահովում 24/7 ռեժիմով', image: 'https://images.unsplash.com/photo-1557804506-6fd015796b4f?auto=format&fit=crop&w=400' },
                { id: 'Private Chef & Jet', name: '🧑‍🍳 Մասնավոր Խոհարար / Ջեթ', desc: 'Գաստրոնոմիական շքեղություն և մասնավոր թռիչքներ', image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400' }
              ].map(service => (
                <div key={service.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs flex flex-col">
                  <div className="h-28 w-full bg-gray-100 relative">
                    <img src={service.image} className="w-full h-full object-cover" alt={service.name} referrerPolicy="no-referrer" />
                  </div>
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-[#111]">{service.name}</h4>
                      <p className="text-[9px] text-gray-500 leading-tight mt-1">{service.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedService(service.id);
                        setIsBookingModalOpen(true);
                      }}
                      className="w-full py-2.5 bg-[#111] text-white text-[10px] font-black rounded-xl hover:bg-amber-400 hover:text-black transition-colors"
                    >
                      Պատվիրել (Book Now)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================
            MOBILE VIEW: SUPPORT (Աջակցություն)
            ========================================= */}
        {currentView === 'support' && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-[#111] flex items-center gap-1.5">
                <LifeBuoy size={14} className="text-amber-500" />
                Աջակցության Կենտրոն
              </h3>
              <p className="text-[10px] text-gray-500 leading-tight">
                Ունե՞ք հարցեր կամ խնդիրներ։ Լրացրեք ստորև ներկայացված հայտը, և մեր թիմը կկապնվի Ձեզ հետ։
              </p>

              {/* Support Form */}
              <form onSubmit={handleSubmitTicket} className="space-y-3 pt-1">
                <div>
                  <label className="text-[9px] font-extrabold text-gray-500 block mb-1">ՀԱՐՑԻ ԹԵՄԱՆ (SUBJECT)</label>
                  <input 
                    name="subject" 
                    required 
                    type="text" 
                    placeholder="Մուտքագրեք թեման..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                
                <div>
                  <label className="text-[9px] font-extrabold text-gray-500 block mb-1">ԲԱԺԻՆ (CATEGORY)</label>
                  <select 
                    name="category"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="General">Ընդհանուր հարցեր</option>
                    <option value="VIP Request">VIP Ծառայություն</option>
                    <option value="Technical">Տեխնիկական խնդիր</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-extrabold text-gray-500 block mb-1">ՆԿԱՐԱԳՐՈՒԹՅՈՒՆ (MESSAGE)</label>
                  <textarea 
                    name="message" 
                    required
                    rows={3} 
                    placeholder="Նկարագրեք Ձեր հարցը..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-black text-[10px] font-black rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Send size={11} /> Ուղարկել Տոմսը
                </button>
              </form>
            </div>

            {/* Mobile FAQs */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-[#111]">🤔 Հաճախ Տրվող Հարցեր</h3>
              <div className="space-y-2">
                {[
                  { q: "Ինչպե՞ս դառնալ VIP անդամ", a: "VIP անդամ դառնալու համար անհրաժեշտ է ակտիվ օգտվել մեր կոնսիերժ ծառայություններից կամ դիմել աջակցման կենտրոն VIP կարգավիճակ ստանալու համար:" },
                  { q: "Արդյո՞ք կան վճարներ տեղադրելիս", a: "Ոչ, հայտարարությունների տեղադրումն ամբողջությամբ անվճար է բոլոր օգտատերերի համար:" },
                  { q: "Ինչպե՞ս է աշխատում կոնսիերժը", a: "Ամրագրումից հետո մեր VIP մենեջերը կապ է հաստատում Ձեզ հետ հեռախոսով՝ քննարկելու պատվերի բոլոր շքեղ մանրամասները:" }
                ].map((faq, idx) => (
                  <div key={idx} className="border-b border-gray-50 pb-2 last:border-none last:pb-0">
                    <button 
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between text-left text-[10px] font-bold text-[#111] hover:text-amber-500"
                    >
                      <span>{faq.q}</span>
                      <ChevronRight size={10} className={`transform transition-transform ${activeFaq === idx ? 'rotate-90 text-amber-500' : ''}`} />
                    </button>
                    {activeFaq === idx && (
                      <p className="text-[9px] text-gray-500 mt-1 leading-relaxed pl-1">{faq.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            MOBILE VIEW: PROFILE (Իմ Էջը)
            ========================================= */}
        {currentView === 'profile' && (
          <div className="p-4 space-y-4">
            {!user ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-xs space-y-4">
                <UserIcon size={36} className="mx-auto text-amber-500 animate-bounce" />
                <h3 className="text-xs font-black text-[#111]">Մուտք գործեք Ձեր Էջը</h3>
                <p className="text-[10px] text-gray-400">
                  Մուտք գործեք համակարգ՝ Ձեր հայտարարությունները կառավարելու և VIP ծառայություններ ամրագրելու համար։
                </p>
                <button 
                  onClick={handleLogin}
                  className="w-full py-2.5 bg-[#111] text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 active:scale-95"
                >
                  <LogIn size={12} /> Google Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User Badge Card */}
                <div className="bg-[#111] text-white rounded-2xl p-4 relative overflow-hidden shadow-md">
                  <div className="flex items-center gap-3 relative z-10">
                    <img 
                      src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120'} 
                      className="w-12 h-12 rounded-full border-2 border-amber-400 shadow-md"
                      alt="avatar" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-black">{profile?.displayName || user.displayName || 'Օգտատեր'}</h4>
                      <p className="text-[9px] text-gray-400 truncate max-w-[170px]">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500 text-black text-[8px] font-black rounded-full uppercase">
                        {profile?.vipStatus === 'elite' ? '👑 Elite VIP' : profile?.vipStatus === 'vip' ? '💎 VIP' : '✨ Member'}
                      </span>
                    </div>
                  </div>
                  <Sparkles size={80} className="absolute right-0 bottom-0 opacity-10 pointer-events-none animate-pulse" />
                </div>

                {/* Profile Edit Form */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                  <h3 className="text-xs font-black text-[#111] flex items-center gap-1.5">
                    <UserIcon size={12} className="text-amber-500" />
                    Խմբագրել Տվյալները
                  </h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <div>
                      <label className="text-[9px] font-extrabold text-gray-500 block mb-1">ԱՆՈՒՆ ԱԶԳԱՆՈՒՆ</label>
                      <input 
                        type="text" 
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Ձեր անունը..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold text-gray-500 block mb-1">ՀԵՌԱԽՈՍԱՀԱՄԱՐ</label>
                      <input 
                        type="tel" 
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+374 XX XX XX"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-2 bg-[#111] text-white text-[10px] font-black rounded-lg hover:bg-amber-400 hover:text-black transition-colors"
                    >
                      Պահպանել Փոփոխությունները
                    </button>
                  </form>
                </div>

                {/* Admin Button for Admins */}
                {(profile?.role === 'admin' || user?.email === 'andranik.harutyunyan2011@gmail.com') && (
                  <button 
                    onClick={() => {
                      setCurrentView('admin');
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock size={12} /> 👑 Admin (Կառավարում)
                  </button>
                )}

                {/* Log Out */}
                <button 
                  onClick={() => signOut(auth).then(() => triggerToast("Դուրս եկաք համակարգից:"))}
                  className="w-full py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={12} /> Դուրս Գալ
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            MOBILE VIEW: ADMIN CONTROL PANEL (Ադմին Կառավարում)
            ========================================= */}
        {currentView === 'admin' && (profile?.role === 'admin' || user?.email === 'andranik.harutyunyan2011@gmail.com') && (
          <div className="p-4 space-y-4 pb-12 text-left">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-2">
              <span className="px-2.5 py-0.5 bg-amber-500 text-black text-[8px] font-black uppercase tracking-wider rounded-full shadow-sm">
                👑 Admin Portal
              </span>
              <h3 className="text-xs font-black text-[#111]">Կառավարման Վահանակ</h3>
              <p className="text-[10px] text-gray-500">
                Դուք մուտք եք գործել որպես համակարգի ադմինիստրատոր։
              </p>
            </div>

            {/* Service Requests in Admin Mobile View */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-[#111] flex items-center gap-1.5">
                🛎️ VIP Պատվերներ ({serviceRequests.length})
              </h4>
              <div className="space-y-3">
                {serviceRequests.length === 0 ? (
                  <p className="text-[10px] text-gray-400">Պատվերներ չկան</p>
                ) : (
                  serviceRequests.map(req => (
                    <div key={req.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-[10px]">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-[#111]">{req.serviceName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                          req.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-gray-500"><span className="font-bold">Պատվիրատու՝</span> {req.userName} ({req.userEmail})</p>
                      {req.message && <p className="text-gray-600 italic">"{req.message}"</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Support Tickets in Admin Mobile View */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-[#111] flex items-center gap-1.5">
                🎫 Տոմսեր ({supportTickets.length})
              </h4>
              <div className="space-y-3">
                {supportTickets.length === 0 ? (
                  <p className="text-[10px] text-gray-400">Տոմսեր չկան</p>
                ) : (
                  supportTickets.map(ticket => (
                    <div key={ticket.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-[10px]">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-[#111]">{ticket.subject}</span>
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold bg-blue-50 text-blue-600">
                          {ticket.category}
                        </span>
                      </div>
                      <p className="text-gray-500">{ticket.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Mobile Tab Navigation Bar */}
        <div className={`${isInSimulator ? 'absolute' : 'fixed'} bottom-0 left-0 right-0 h-[65px] bg-white border-t border-gray-100 flex items-center justify-around pb-5 z-40 shadow-lg`}>
          {[
            { id: 'marketplace', label: 'Գլխավոր', icon: Sparkles },
            { id: 'services', label: 'VIP Կոնսիեռժ', icon: ShieldCheck },
            { id: 'support', label: 'Աջակցություն', icon: LifeBuoy },
            { id: 'profile', label: 'Իմ էջը', icon: UserIcon }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id || (tab.id === 'profile' && currentView === 'admin');
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isNavBlocked) return;
                  setCurrentView(tab.id as any);
                }}
                className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${
                  isActive ? 'text-amber-500 font-bold scale-[1.02]' : 'text-gray-400'
                }`}
              >
                <Icon size={15} />
                <span className="text-[8px] font-black tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#111111] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white pb-28 md:pb-12">

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-semibold border ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Luxury Navigation Header */}
      {!isMobile && (
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5EAEF] px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => setCurrentView('marketplace')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-[#111111] rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Building2 size={20} className="text-amber-400" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#111]">UrbanAm</span>
              <p className="text-[9px] text-[#999] tracking-widest uppercase font-bold">Armenia Luxury</p>
            </div>
          </div>
          
          {/* Main Navigation Tabs */}
          <div className="hidden md:flex items-center gap-2 bg-[#EEF2F6] p-1.5 rounded-2xl">
            {[
              { id: 'marketplace', label: 'Marketplace (Հայտարարություններ)', icon: Sparkles },
              { id: 'services', label: 'Premium Services (Ծառայություններ)', icon: ShieldCheck },
              { id: 'support', label: 'Support & Help (Աջակցություն)', icon: LifeBuoy },
              ...((profile?.role === 'admin' || user?.email === 'andranik.harutyunyan2011@gmail.com') 
                ? [{ id: 'admin', label: '👑 Admin (Կառավարում)', icon: Lock }] 
                : [])
            ].map(tab => {
              const IconComponent = tab.icon;
              const isActive = currentView === tab.id;
              return (
                <button 
                  key={tab.id} 
                  onClick={() => {
                    if (isNavBlocked) return;
                    setCurrentView(tab.id as any);
                    setShowMyListings(false);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-white text-[#111] shadow-sm scale-[1.02]' 
                      : 'text-[#666] hover:text-[#111]'
                  }`}
                >
                  <IconComponent size={16} className={isActive ? 'text-amber-500' : 'text-[#888]'} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* User Sign In / Profile */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* List button shortcut */}
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-5 py-2.5 bg-[#111111] text-white text-xs font-bold rounded-full hover:bg-amber-500 hover:text-black transition-all shadow-md active:scale-95"
                >
                  <Plus size={14} /> List Property
                </button>

                {/* Profile Widget */}
                <div 
                  onClick={() => setCurrentView('profile')}
                  className={`flex items-center gap-2.5 p-1.5 pr-4 rounded-full border border-[#E5EAEF] bg-white cursor-pointer hover:border-amber-400 transition-all ${
                    currentView === 'profile' ? 'border-amber-500 bg-amber-50/40' : ''
                  }`}
                >
                  <img 
                    src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120'} 
                    className="w-8 h-8 rounded-full shadow-sm border border-white" 
                    alt="avatar" 
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-[#111] leading-none truncate max-w-[120px]">
                      {profile?.displayName || user.displayName || 'Օգտատեր'}
                    </p>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600 leading-none">
                      {profile?.vipStatus === 'elite' ? '👑 Elite VIP' : profile?.vipStatus === 'vip' ? '💎 VIP' : '✨ Member'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => signOut(auth).then(() => triggerToast("Դուրս եկաք համակարգից:"))}
                  title="Logout"
                  className="p-2.5 text-[#888] hover:text-red-500 bg-white border border-[#E5EAEF] rounded-full hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="px-6 py-2.5 bg-[#111111] text-white text-xs font-bold rounded-full hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2 shadow-lg active:scale-95"
              >
                <LogIn size={15} /> Մուտք (Sign In)
              </button>
            )}
          </div>
        </div>
      </nav>
      )}

      {!isMobile && (
      <main className="max-w-7xl mx-auto px-6 mt-10">
        <AnimatePresence mode="wait">
          {/* =========================================
              VIEW: MARKETPLACE (Հայտարարություններ)
              ========================================= */}
          {currentView === 'marketplace' && (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-10"
            >
              {/* Main Banner */}
              <header className="relative overflow-hidden bg-[#111111] text-white rounded-[2.5rem] p-10 md:p-16 shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                  <Sparkles size={300} />
                </div>
                <div className="max-w-xl space-y-6 relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-extrabold tracking-wider uppercase">
                    <Sparkles size={12} />
                    VIP Marketplace in Armenia
                  </div>
                  <h1 className="text-4xl md:text-6xl font-serif font-light tracking-tight leading-tight">
                    Շքեղություն <br />
                    <span className="italic font-normal text-amber-400">յուրաքանչյուր մանրուքում:</span>
                  </h1>
                  <p className="text-white/75 text-sm md:text-base leading-relaxed">
                    Ամենաէքսկլյուզիվ մեքենաների և պրեմիում դասի անշարժ գույքի հարթակը Հայաստանում: Գտեք ձեր երազանքների գույքը կամ տեղադրեք ձեր անհատական առաջարկը:
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <button 
                      onClick={() => { setActiveType('car'); }}
                      className="px-6 py-3 bg-white text-black text-xs font-extrabold rounded-full hover:bg-amber-400 hover:text-black transition-all"
                    >
                      Browse Luxury Cars
                    </button>
                    <button 
                      onClick={() => { setActiveType('building'); }}
                      className="px-6 py-3 bg-[#222] text-white text-xs font-extrabold rounded-full hover:bg-[#333] border border-white/10 transition-all"
                    >
                      Browse Estates
                    </button>
                  </div>
                </div>
              </header>

              {/* Search & Filter Controls */}
              <section className="bg-white p-3 rounded-[2rem] shadow-md border border-[#E5EAEF]">
                <div className="flex flex-col lg:flex-row gap-3">
                  {/* Search bar input */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#999]" size={18} />
                    <input 
                      type="text" 
                      placeholder="Փնտրել մեքենաներ, բնակարաններ, լոֆթեր, առանձնատներ..."
                      className="w-full pl-14 pr-6 py-4 bg-transparent outline-none text-base font-medium placeholder-[#999] text-[#111]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filter actions */}
                  <div className="flex flex-wrap items-center gap-2 p-1 bg-[#EEF2F6] rounded-2xl w-full lg:w-auto">
                    <button 
                      onClick={() => setActiveType('all')}
                      className={`flex-1 lg:flex-initial px-5 py-3 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center transition-all ${activeType === 'all' ? 'bg-white text-[#111] shadow-sm' : 'text-[#666] hover:text-[#111]'}`}
                    >
                      Բոլորը (All)
                    </button>
                    <button 
                      onClick={() => setActiveType('car')}
                      className={`flex-1 lg:flex-initial px-5 py-3 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeType === 'car' ? 'bg-white text-[#111] shadow-sm' : 'text-[#666] hover:text-[#111]'}`}
                    >
                      <Car size={14} className="text-amber-500" /> Մեքենաներ (Cars)
                    </button>
                    <button 
                      onClick={() => setActiveType('building')}
                      className={`flex-1 lg:flex-initial px-5 py-3 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeType === 'building' ? 'bg-white text-[#111] shadow-sm' : 'text-[#666] hover:text-[#111]'}`}
                    >
                      <Building2 size={14} className="text-blue-500" /> Գույք (Estates)
                    </button>
                  </div>
                </div>
              </section>

              {/* Main Content Layout */}
              <div className="flex flex-col lg:flex-row gap-10">
                {/* Side Categories & Actions */}
                <aside className="w-full lg:w-64 shrink-0 space-y-8">
                  <div className="bg-white p-6 rounded-[2rem] border border-[#E5EAEF] space-y-6 shadow-sm">
                    <div>
                      <h3 className="text-[10px] uppercase tracking-widest font-extrabold text-[#999] mb-4">Գործարքի Տեսակը</h3>
                      <div className="space-y-1.5">
                        {[
                          { id: 'all', label: 'Բոլոր տեսակները' },
                          { id: 'rent', label: 'Վարձակալություն (Rent)' },
                          { id: 'buy', label: 'Գնում (Purchase)' }
                        ].map(cat => (
                          <button 
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`w-full text-left px-4 py-3 min-h-[44px] flex items-center rounded-xl text-xs font-bold transition-all ${
                              activeCategory === cat.id 
                                ? 'bg-[#111111] text-white shadow-md' 
                                : 'text-[#555] hover:bg-[#EEF2F6]'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {user && (
                      <div className="pt-4 border-t border-[#EEF2F6]">
                        <h3 className="text-[10px] uppercase tracking-widest font-extrabold text-[#999] mb-4">Ձեր Գործունեությունը</h3>
                        <button 
                          onClick={() => setShowMyListings(!showMyListings)}
                          className={`w-full text-left px-4 py-3 min-h-[44px] flex items-center rounded-xl text-xs font-bold transition-all ${
                            showMyListings 
                              ? 'bg-amber-500 text-black shadow-md' 
                              : 'text-[#555] hover:bg-[#EEF2F6]'
                          }`}
                        >
                          {showMyListings ? 'Ցույց տալ Բոլորը' : 'Իմ հայտարարությունները'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Detailed Specifications Filters */}
                  {activeType !== 'all' && (
                    <div className="bg-white p-6 rounded-[2rem] border border-[#E5EAEF] space-y-6 shadow-sm">
                      <div className="flex items-center justify-between pb-3 border-b border-[#F0F4F8]">
                        <h3 className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Լրացուցիչ Ֆիլտրեր</h3>
                        <button 
                          onClick={() => {
                            setFilterCarModel('all');
                            setFilterCarEngineMin('all');
                            setFilterCarColor('all');
                            setFilterCarBody('all');
                            setFilterBuildingType('all');
                            setFilterBuildingBedrooms('all');
                            setFilterBuildingFloor('all');
                          }}
                          className="text-[10px] text-amber-600 hover:underline font-bold"
                        >
                          Մաքրել (Clear)
                        </button>
                      </div>

                      {activeType === 'car' ? (
                        <div className="space-y-4">
                          {/* Car Model */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Մոդել (Model)</label>
                            <select 
                              value={filterCarModel} 
                              onChange={(e) => setFilterCarModel(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs cursor-pointer"
                            >
                              <option value="all">Բոլոր Մոդելները</option>
                              <option value="BMW">BMW</option>
                              <option value="Mercedes">Mercedes-Benz</option>
                              <option value="Audi">Audi</option>
                              <option value="Porsche">Porsche</option>
                              <option value="Bentley">Bentley</option>
                              <option value="Rolls-Royce">Rolls-Royce</option>
                              <option value="Tesla">Tesla</option>
                              <option value="Lexus">Lexus</option>
                              <option value="Other">Այլ (Other)</option>
                            </select>
                          </div>

                          {/* Engine size */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Շարժիչի ծավալ (Engine L+)</label>
                            <select 
                              value={filterCarEngineMin} 
                              onChange={(e) => setFilterCarEngineMin(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs cursor-pointer"
                            >
                              <option value="all">Բոլորը</option>
                              <option value="0.8">0.8 L-ից սկսած</option>
                              <option value="1.6">1.6 L-ից սկսած</option>
                              <option value="2.0">2.0 L-ից սկսած</option>
                              <option value="3.0">3.0 L-ից սկսած</option>
                              <option value="4.0">4.0 L-ից սկսած</option>
                              <option value="5.0">5.0 L-ից սկսած</option>
                            </select>
                          </div>

                          {/* Color */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Գույն (Color)</label>
                            <select 
                              value={filterCarColor} 
                              onChange={(e) => setFilterCarColor(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs cursor-pointer"
                            >
                              <option value="all">Բոլորը</option>
                              <option value="Black">Սև (Black)</option>
                              <option value="White">Սպիտակ (White)</option>
                              <option value="Gray">Մոխրագույն (Gray)</option>
                              <option value="Silver">Արծաթափայլ (Silver)</option>
                              <option value="Blue">Կապույտ (Blue)</option>
                              <option value="Red">Կարմիր (Red)</option>
                              <option value="Custom">Այլ (Custom)</option>
                            </select>
                          </div>

                          {/* Body Type */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Թափք (Body Type)</label>
                            <select 
                              value={filterCarBody} 
                              onChange={(e) => setFilterCarBody(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs cursor-pointer"
                            >
                              <option value="all">Բոլորը</option>
                              <option value="Sedan">Սեդան (Sedan)</option>
                              <option value="SUV">Ամենագնաց (SUV)</option>
                              <option value="Coupe">Կուպե (Coupe)</option>
                              <option value="Convertible">Կաբրիոլետ (Convertible)</option>
                              <option value="Other">Այլ (Other)</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Property Type */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Գույքի Տեսակ (Type)</label>
                            <select 
                              value={filterBuildingType} 
                              onChange={(e) => setFilterBuildingType(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs cursor-pointer"
                            >
                              <option value="all">Բոլոր Տեսակները</option>
                              <option value="Apartment">Բնակարան (Apartment)</option>
                              <option value="Penthouse">Պենտհաուս (Penthouse)</option>
                              <option value="Villa">Վիլլա (Villa)</option>
                              <option value="House">Առանձնատուն (House)</option>
                              <option value="Office">Գրասենյակ (Office)</option>
                            </select>
                          </div>

                          {/* Bedrooms */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Ննջասենյակներ (Bedrooms)</label>
                            <select 
                              value={filterBuildingBedrooms} 
                              onChange={(e) => setFilterBuildingBedrooms(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs cursor-pointer"
                            >
                              <option value="all">Բոլորը</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5+">5+</option>
                            </select>
                          </div>

                          {/* Floor */}
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Հարկ (Floor)</label>
                            <select 
                              value={filterBuildingFloor} 
                              onChange={(e) => setFilterBuildingFloor(e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs cursor-pointer"
                            >
                              <option value="all">Բոլորը</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                              <option value="6">6</option>
                              <option value="7">7</option>
                              <option value="8">8</option>
                              <option value="9">9</option>
                              <option value="10+">10+</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Concierge Side Banner */}
                  <div className="relative group overflow-hidden bg-[#111111] rounded-[2rem] p-8 text-white shadow-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                      <ShieldCheck size={120} className="text-amber-400" />
                    </div>
                    <h4 className="text-lg font-bold mb-2 relative z-10">Premium Concierge</h4>
                    <p className="text-white/60 text-xs mb-6 leading-relaxed relative z-10">
                      Մեր VIP մասնագետները կհոգան ձեր բոլոր իրավաբանական և կազմակերպչական հարցերը:
                    </p>
                    <button 
                      onClick={() => setCurrentView('services')}
                      className="w-full py-3.5 bg-white text-black rounded-xl text-xs font-extrabold hover:bg-amber-400 transition-all relative z-10"
                    >
                      Պատվիրել Խորհրդատվություն
                    </button>
                  </div>
                </aside>

                {/* Listings Grid container */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-[#888] uppercase tracking-wider">
                      Գտնվել է <span className="text-[#111] font-black">{filteredListings.length}</span> էլիտար առաջարկ
                    </p>
                    <div className="text-xs font-bold text-[#666] flex items-center gap-1.5">
                      <Filter size={12} />
                      <span>Տեսակավորում՝ Ըստ թարմության</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <AnimatePresence mode='popLayout'>
                      {filteredListings.map((item) => (
                        <motion.div 
                          layout
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4 }}
                          className="group bg-white rounded-[2rem] overflow-hidden border border-[#E5EAEF] hover:shadow-xl transition-all duration-300 flex flex-col"
                        >
                          {/* Image Box */}
                          <div className="relative h-60 overflow-hidden bg-[#E5EAEF]">
                            <img 
                              src={item.image || (item.type === 'car' 
                                ? "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800"
                                : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800")} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer"
                              alt={item.title}
                            />
                            <div className="absolute top-4 left-4 flex gap-2">
                              <span className="px-3.5 py-1 bg-white/95 backdrop-blur-md rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-sm text-[#111] border border-black/5">
                                {item.category === 'rent' ? 'Rent (Վարձույթ)' : 'Buy (Գնում)'}
                              </span>
                              <span className="px-3.5 py-1 bg-[#111111] text-amber-400 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-md">
                                {item.type === 'car' ? '🚗 Automobile' : '🏢 Real Estate'}
                              </span>
                            </div>
                          </div>

                          {/* Details Box */}
                          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1.5">
                                  <h3 className="text-xl font-bold tracking-tight text-[#111] group-hover:text-amber-600 transition-colors line-clamp-1">
                                    {item.title}
                                  </h3>
                                  <div className="flex items-center gap-1 text-[#888] text-xs font-semibold">
                                    <MapPin size={12} className="text-amber-500 shrink-0" />
                                    <span>{item.location}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-xl font-black text-[#111]">
                                    ${item.price.toLocaleString()}
                                  </p>
                                  <p className="text-[10px] text-[#888] font-bold">
                                    {item.category === 'rent' ? '/ monthly' : 'total'}
                                  </p>
                                </div>
                              </div>

                              {item.description && (
                                <p className="text-xs text-[#666] line-clamp-2 leading-relaxed">
                                  {item.description}
                                </p>
                              )}

                              {item.authorName && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEF2F6] rounded-full text-[10px] font-bold text-[#666]">
                                  <UserIcon size={10} />
                                  <span>Հայտարարատու՝ {item.authorName}</span>
                                </div>
                              )}
                            </div>

                            {/* Specifications */}
                            <div className="flex items-center justify-between pt-4 border-t border-[#F0F4F8]">
                              <div className="flex gap-4">
                                {item.specs && Object.entries(item.specs).slice(0, 2).map(([k, v]) => (
                                  <div key={k} className="text-left">
                                    <p className="text-[9px] uppercase tracking-wider font-extrabold text-[#999] mb-0.5">{k}</p>
                                    <p className="text-xs font-bold text-[#333]">{v}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {user && (item.authorId === user.uid || profile?.role === 'admin' || user.email === 'andranik.harutyunyan2011@gmail.com') && (
                                  <>
                                    <button 
                                      onClick={() => setEditingListing(item)}
                                      className="p-2 text-amber-500 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-xl transition-all"
                                      title="Խմբագրել հայտարարությունը"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteListing(item.id)}
                                      className="p-2 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all"
                                      title="Ջնջել հայտարարությունը"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={() => setSelectedListingForDetail(item)}
                                  className="p-2.5 bg-[#EEF2F6] rounded-xl hover:bg-[#111111] hover:text-white transition-all transform group-hover:translate-x-1"
                                  title="Դիտել մանրամասները"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {filteredListings.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-24 bg-white rounded-[2.5rem] border border-[#E5EAEF]"
                    >
                      <div className="w-16 h-16 bg-[#EEF2F6] rounded-full flex items-center justify-center mx-auto mb-4 text-[#999]">
                        <Search size={24} />
                      </div>
                      <h3 className="text-lg font-bold">Ոչինչ չի գտնվել</h3>
                      <p className="text-[#666] text-xs max-w-xs mx-auto mt-1">
                        Ձեր որոնման տվյալներով ոչ մի առաջարկ չհաջողվեց գտնել: Փորձեք փոխել ֆիլտրերը:
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================
              VIEW: PREMIUM SERVICES (Ծառայություններ)
              ========================================= */}
          {currentView === 'services' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              {/* Header Title */}
              <div className="text-center max-w-xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck size={14} /> Elite Luxury Concierge Services
                </div>
                <h2 className="text-4xl font-serif font-light tracking-tight leading-tight">
                  Բացառիկ Ծառայություններ <br />
                  <span className="italic font-normal">հատուկ Ձեզ համար</span>
                </h2>
                <p className="text-[#666] text-sm">
                  Մենք կազմակերպում ենք ամենաբարձր մակարդակի VIP դիմավորումներ, տրանսպորտային չարթերներ և անշարժ գույքի ձեռքբերման աջակցություն Հայաստանում:
                </p>
              </div>

              {/* Layout: Bookings Panel & Services List */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Bookings & Active Inquiries sidebar */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-[2rem] border border-[#E5EAEF] space-y-6 shadow-sm">
                    <div className="flex items-center gap-2 pb-4 border-b border-[#F0F4F8]">
                      <Calendar size={18} className="text-amber-500" />
                      <h3 className="font-bold text-sm">Ձեր Ակտիվ Հայտերը (Your Bookings)</h3>
                    </div>

                    {!user ? (
                      <div className="text-center py-6 space-y-3">
                        <Lock size={24} className="mx-auto text-gray-300" />
                        <p className="text-xs text-[#777] leading-relaxed">
                          Մուտք գործեք համակարգ՝ ձեր պատվիրած ծառայությունների կարգավիճակին հետևելու համար:
                        </p>
                        <button 
                          onClick={handleLogin}
                          className="px-4 py-2 bg-[#111111] text-white text-xs font-bold rounded-xl hover:bg-amber-500 hover:text-black transition-all"
                        >
                          Login to View
                        </button>
                      </div>
                    ) : serviceRequests.length === 0 ? (
                      <div className="text-center py-8 text-[#999] space-y-1">
                        <Info size={16} className="mx-auto text-[#bbb]" />
                        <p className="text-xs font-medium">Ակտիվ հայտեր չկան:</p>
                        <p className="text-[10px]">Ընտրեք ծառայություն և լրացրեք հայտը աջ կողմում:</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                        {serviceRequests.map((req) => (
                          <div key={req.id} className="p-4 bg-[#F8F9FA] rounded-xl border border-[#EEF2F6] space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-extrabold text-[#111] truncate max-w-[150px]">{req.serviceName}</h4>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                  req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  req.status === 'reviewed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {req.status === 'pending' ? 'Սպասման մեջ' : req.status === 'reviewed' ? 'Դիտված է' : 'Կապվել են'}
                                </span>
                                {(profile?.role === 'admin' || user?.email === 'andranik.harutyunyan2011@gmail.com') && (
                                  <button 
                                    onClick={() => handleDeleteServiceRequest(req.id)}
                                    className="p-1 text-rose-500 hover:bg-rose-100 rounded-md transition-all"
                                    title="Ջնջել հարցումը"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {req.message && <p className="text-[10px] text-[#666] line-clamp-1">{req.message}</p>}
                            {(profile?.role === 'admin' || user?.email === 'andranik.harutyunyan2011@gmail.com') && (
                              <p className="text-[9px] text-[#888] font-bold">Հայտատու՝ {req.userName || 'Անանուն'} ({req.userEmail})</p>
                            )}
                            <div className="flex justify-between items-center text-[9px] text-[#999] pt-2 border-t border-black/5">
                              <span>Պլանավորվող օր՝ {req.preferredDate || 'Չի նշվել'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Guaranteed Badge info card */}
                  <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] space-y-3">
                    <ShieldCheck size={24} className="text-amber-600" />
                    <h4 className="font-bold text-sm text-amber-900">100% Ապահովություն և Գաղտնիություն</h4>
                    <p className="text-xs text-amber-800/80 leading-relaxed">
                      Մենք երաշխավորում ենք ձեր անձնական տվյալների և գործարքների լիարժեք կոնֆիդենցիալությունը: Բոլոր վարորդներն ու գործակալներն անցնում են հատուկ ստուգում:
                    </p>
                  </div>
                </div>

                {/* Services List Catalog */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {SERVICES.map((serv) => {
                    const IconComponent = serv.icon;
                    return (
                      <div 
                        key={serv.id}
                        className="bg-white rounded-[2rem] border border-[#E5EAEF] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                      >
                        <div className="h-44 overflow-hidden relative">
                          <img src={serv.image} className="w-full h-full object-cover" alt="service thumbnail" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                          <div className="absolute bottom-4 left-4 flex items-center gap-2">
                            <div className={`p-2 rounded-xl bg-white text-black shadow-md`}>
                              <IconComponent size={16} />
                            </div>
                            <div>
                              <p className="text-white text-xs font-extrabold tracking-wide uppercase">{serv.subtitle}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <h3 className="font-bold text-lg text-[#111]">{serv.title}</h3>
                            <p className="text-xs text-[#666] leading-relaxed">
                              {serv.description}
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedService(serv.title);
                              setIsBookingModalOpen(true);
                            }}
                            className="w-full py-3 bg-[#111] text-white hover:bg-amber-500 hover:text-black rounded-xl text-xs font-bold transition-colors"
                          >
                            Հայտագրվել Ծառայությանը
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================
              VIEW: SUPPORT & TICKET CENTER (Աջակցություն)
              ========================================= */}
          {currentView === 'support' && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              {/* Header block */}
              <div className="text-center max-w-xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-bold uppercase tracking-wider">
                  <LifeBuoy size={14} /> UrbanAm Support & FAQ Center
                </div>
                <h2 className="text-4xl font-serif font-light tracking-tight leading-tight">
                  Ինչպե՞ս կարող ենք <br />
                  <span className="italic font-normal">օգնել Ձեզ</span>
                </h2>
                <p className="text-[#666] text-sm">
                  Մեր հաճախորդների աջակցության կենտրոնն աշխատում է շուրջօրյա՝ ապահովելով ձեր հարցերի պատասխաններն ու անհրաժեշտ օգնությունը:
                </p>
              </div>

              {/* Chief Admin Direct Contact Banner */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="space-y-3 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm">
                    👑 Owner & Chief Admin
                  </div>
                  <h3 className="text-2xl font-serif font-light text-[#111]">
                    Ուղիղ կապ <span className="italic font-normal text-amber-600">Գլխավոր Ադմինիստրատորի</span> հետ
                  </h3>
                  <p className="text-[#666] text-xs max-w-xl leading-relaxed">
                    Հարցերի, առաջարկների կամ VIP համագործակցության համար կարող եք անմիջապես կապ հաստատել հարթակի հիմնադրի և գլխավոր ադմինիստրատորի հետ նշված կապի միջոցներով:
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
                  <a 
                    href="mailto:andranik.harutyunyan2011@gmail.com"
                    className="flex items-center justify-center gap-2.5 px-6 py-4 bg-[#111111] text-white text-xs font-extrabold rounded-2xl hover:bg-amber-500 hover:text-black transition-all shadow-md group"
                  >
                    <Mail size={14} className="text-amber-400 group-hover:text-black" />
                    andranik.harutyunyan2011@gmail.com
                  </a>
                  <a 
                    href="https://t.me/Andranik404" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2.5 px-6 py-4 bg-[#0088cc] text-white text-xs font-extrabold rounded-2xl hover:bg-[#0077b5] transition-all shadow-md"
                  >
                    <Send size={14} className="text-white" />
                    Telegram: @Andranik404
                  </a>
                </div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Column 1: FAQ accordion */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-amber-500" />
                    <h3 className="font-bold text-lg text-[#111]">Հաճախ Տրվող Հարցեր (FAQ)</h3>
                  </div>

                  <div className="space-y-4">
                    {FAQS.map((faq, idx) => {
                      const isOpen = activeFaq === idx;
                      return (
                        <div 
                          key={idx}
                          className="bg-white border border-[#E5EAEF] rounded-2xl overflow-hidden shadow-sm transition-all"
                        >
                          <button 
                            onClick={() => setActiveFaq(isOpen ? null : idx)}
                            className="w-full text-left p-5 flex justify-between items-center gap-4 font-bold text-sm text-[#111] hover:bg-[#F9FAFB] transition-colors"
                          >
                            <span>{faq.q}</span>
                            <ChevronRight size={16} className={`transform transition-transform text-[#999] ${isOpen ? 'rotate-90 text-amber-500' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-[#F0F4F8]"
                              >
                                <p className="p-5 text-xs text-[#555] leading-relaxed bg-[#FDFEFE]">
                                  {faq.a}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Column 2: Send Ticket form & My tickets */}
                <div className="space-y-8">
                  {/* Inquiry Form */}
                  <div className="bg-white p-8 rounded-[2rem] border border-[#E5EAEF] shadow-sm space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-[#F0F4F8]">
                      <MessageSquare size={18} className="text-blue-500" />
                      <h3 className="font-bold text-sm">Ուղարկել Աջակցության Հարցում (Open Ticket)</h3>
                    </div>

                    <form onSubmit={handleSubmitTicket} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Թեմա / Վերնագիր (Subject)</label>
                        <input name="subject" required type="text" placeholder="Գրեք ձեր հարցի հակիրճ թեման..." className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs" />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Կատեգորիա (Category)</label>
                        <select name="category" className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="general">Ընդհանուր հարցեր (General Inquiry)</option>
                          <option value="billing">Վճարումներ և հաշիվներ (Payments / Billing)</option>
                          <option value="technical">Տեխնիկական խնդիրներ (Technical Help)</option>
                          <option value="verification">Վավերացում (Verification / VIP status)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Հաղորդագրություն (Detailed Message)</label>
                        <textarea name="message" required rows={4} placeholder="Նկարագրեք ձեր խնդիրը կամ հարցը մանրամասն..." className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs resize-none" />
                      </div>

                      <button type="submit" className="w-full py-4 bg-[#111111] text-white rounded-xl text-xs font-extrabold hover:bg-amber-500 hover:text-black transition-colors flex items-center justify-center gap-2">
                        <Send size={14} /> Ուղարկել Հարցումը
                      </button>
                    </form>
                  </div>

                  {/* Logged in Tickets dashboard */}
                  <div className="bg-white p-6 rounded-[2rem] border border-[#E5EAEF] shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-[#F0F4F8]">
                      <LifeBuoy size={16} className="text-blue-500" />
                      <h4 className="font-bold text-xs">Ձեր Ակտիվ Տոմսերը (Your Ticket Status)</h4>
                    </div>

                    {!user ? (
                      <div className="text-center py-6">
                        <p className="text-[11px] text-[#777] mb-3">Մուտք գործեք՝ ձեր տոմսերը տեսնելու համար:</p>
                        <button onClick={handleLogin} className="px-4 py-1.5 bg-[#EEF2F6] hover:bg-[#111] hover:text-white rounded-xl text-[10px] font-bold transition-all">
                          Մուտք (Sign In)
                        </button>
                      </div>
                    ) : supportTickets.length === 0 ? (
                      <p className="text-center py-6 text-xs text-[#999]">Դուք դեռ չունեք ակտիվ տոմսեր:</p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {supportTickets.map((t) => (
                          <div key={t.id} className="p-4 bg-[#F8F9FA] rounded-xl border border-[#EEF2F6] space-y-2 text-left">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase font-extrabold text-[#999]">{t.category}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                                  t.status === 'open' ? 'bg-amber-100 text-amber-800' :
                                  t.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {t.status === 'open' ? 'Բաց' : t.status === 'in-progress' ? 'Ընթացքի մեջ' : 'Լուծված'}
                                </span>
                                {(profile?.role === 'admin' || user?.email === 'andranik.harutyunyan2011@gmail.com') && (
                                  <button 
                                    onClick={() => handleDeleteSupportTicket(t.id)}
                                    className="p-1 text-rose-500 hover:bg-rose-100 rounded-md transition-all"
                                    title="Ջնջել տոմսը"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <h4 className="font-bold text-xs text-[#111]">{t.subject}</h4>
                            <p className="text-[11px] text-[#666] line-clamp-2 leading-relaxed">{t.message}</p>
                            {(profile?.role === 'admin' || user?.email === 'andranik.harutyunyan2011@gmail.com') && (
                              <p className="text-[9px] text-[#888] font-bold pt-1 border-t border-black/5">Տոմսատու՝ {t.userName || 'Անանուն'} ({t.userEmail})</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================
              VIEW: USER PROFILE / SETTINGS (Պրոֆիլ)
              ========================================= */}
          {currentView === 'profile' && user && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-3xl mx-auto space-y-10"
            >
              {/* Profile Card Header */}
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-[#E5EAEF] shadow-sm text-center md:text-left flex flex-col md:flex-row items-center gap-8">
                <img 
                  src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160'} 
                  className="w-24 h-24 rounded-full border-4 border-amber-400 shadow-lg shrink-0" 
                  alt="Avatar big"
                />
                <div className="space-y-4 flex-1">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                      <h2 className="text-3xl font-serif font-light text-[#111]">
                        {profile?.displayName || user.displayName || 'Անանուն'}
                      </h2>
                      <span className="px-3.5 py-1 bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm">
                        {profile?.vipStatus === 'elite' ? '👑 Elite VIP' : profile?.vipStatus === 'vip' ? '💎 VIP Member' : '✨ Standard Member'}
                      </span>
                    </div>
                    <p className="text-xs text-[#777] font-semibold">{user.email}</p>
                  </div>

                  {/* Profile stats info */}
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="px-5 py-3 bg-[#EEF2F6] rounded-2xl text-center">
                      <p className="text-lg font-black text-[#111] leading-none">{listings.filter(i => i.authorId === user.uid).length}</p>
                      <span className="text-[9px] text-[#888] font-bold uppercase tracking-wider">listings</span>
                    </div>
                    <div className="px-5 py-3 bg-[#EEF2F6] rounded-2xl text-center">
                      <p className="text-lg font-black text-[#111] leading-none">{supportTickets.length}</p>
                      <span className="text-[9px] text-[#888] font-bold uppercase tracking-wider">tickets</span>
                    </div>
                    <div className="px-5 py-3 bg-[#EEF2F6] rounded-2xl text-center">
                      <p className="text-lg font-black text-[#111] leading-none">{serviceRequests.length}</p>
                      <span className="text-[9px] text-[#888] font-bold uppercase tracking-wider">service requests</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* List Property Quick Action Card */}
              <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-[#111] text-white p-8 md:p-10 rounded-[2.5rem] shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="px-3 py-1 bg-white/20 text-white text-[9px] font-black uppercase tracking-wider rounded-full backdrop-blur-md">
                    ⚡ Quick Action
                  </span>
                  <h3 className="text-2xl font-serif font-light">
                    Ցանկանո՞ւմ եք <span className="italic font-normal text-amber-300">նոր հայտարարություն տեղադրել</span>
                  </h3>
                  <p className="text-white/85 text-xs max-w-xl leading-relaxed">
                    Ավելացրեք ձեր մեքենան կամ անշարժ գույքը UrbanAm VIP հարթակում: Ձեր հայտարարությունը ակնթարթորեն հասանելի կդառնա բոլոր այցելուներին:
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-black text-xs font-black rounded-2xl hover:bg-amber-400 hover:text-black transition-all shadow-xl hover:scale-105 active:scale-95 shrink-0 w-full md:w-auto"
                >
                  <Plus size={16} /> Ավելացնել Հայտարարություն (List Property)
                </button>
              </div>

              {/* Edit Details form & Password block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Editing panel */}
                <div className="bg-white p-8 rounded-[2rem] border border-[#E5EAEF] shadow-sm space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-[#F0F4F8]">
                    <UserIcon size={18} className="text-amber-500" />
                    <h3 className="font-bold text-sm text-[#111]">Թարմացնել Պրոֆիլը (Update Profile)</h3>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Անուն Ազգանուն (Nickname / Name)</label>
                      <input 
                        type="text" 
                        value={nameInput} 
                        onChange={(e) => setNameInput(e.target.value)}
                        required
                        className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Հեռախոսահամար (Phone Number)</label>
                      <input 
                        type="text" 
                        value={phoneInput} 
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="օր. +374 99 999999"
                        className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs" 
                      />
                    </div>

                    <button type="submit" className="w-full py-4 bg-[#111111] text-white hover:bg-amber-500 hover:text-black rounded-xl text-xs font-extrabold transition-colors">
                      Պահպանել Փոփոխությունները
                    </button>
                  </form>
                </div>

                {/* Account Details / VIP information */}
                <div className="bg-white p-8 rounded-[2rem] border border-[#E5EAEF] shadow-sm space-y-6">
                  <div className="flex items-center gap-2 pb-4 border-b border-[#F0F4F8]">
                    <ShieldCheck size={18} className="text-amber-500" />
                    <h3 className="font-bold text-sm text-[#111]">VIP Արտոնություններ & Վավերացում</h3>
                  </div>

                  <div className="space-y-4 text-xs leading-relaxed text-[#555]">
                    <p>
                      UrbanAm-ի վավերացված անդամները ստանում են բացառիկ վստահություն և իրավունք՝ տեղադրելու անսահմանափակ թվով հայտարարություններ:
                    </p>
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2 text-[#666]">
                      <div className="flex items-center gap-2 text-amber-800 font-bold">
                        <Sparkles size={14} />
                        <span>Ինչպե՞ս դառնալ VIP.</span>
                      </div>
                      <p className="text-[11px]">
                        VIP անդամության համար անհրաժեշտ է աջակցության բաժնում բացել տոմս կամ պատվիրել էլիտար ծառայություններից որևէ մեկը:
                      </p>
                    </div>

                    <button 
                      onClick={() => setCurrentView('support')} 
                      className="w-full py-4 bg-[#EEF2F6] hover:bg-[#E5EAEF] text-black rounded-xl text-xs font-bold transition-all"
                    >
                      Անցնել Support բաժին
                    </button>
                  </div>
                </div>
              </div>

              {/* My Listings Section */}
              <div className="bg-white p-8 rounded-[2rem] border border-[#E5EAEF] shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#F0F4F8]">
                  <div className="flex items-center gap-2">
                    <Car className="text-amber-500" size={18} />
                    <h3 className="font-bold text-base text-[#111]">Իմ հայտարարությունները (My Listings)</h3>
                  </div>
                  <span className="px-3.5 py-1 bg-[#EEF2F6] text-[#555] text-xs font-bold rounded-full">
                    {listings.filter(item => item.authorId === user.uid).length} հայտարարություն
                  </span>
                </div>

                {listings.filter(item => item.authorId === user.uid).length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-xs text-[#777] font-semibold">Դուք դեռևս չունեք տեղադրած հայտարարություններ:</p>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="px-6 py-3 bg-amber-500 text-black text-xs font-black rounded-xl hover:scale-105 transition-transform"
                    >
                      Տեղադրել առաջին հայտարարությունը
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {listings.filter(item => item.authorId === user.uid).map(item => (
                      <div key={item.id} className="group bg-[#F9FAFB] rounded-2xl overflow-hidden border border-[#E5EAEF] hover:shadow-md transition-all flex flex-col">
                        <div className="relative h-40 bg-[#E5EAEF]">
                          <img 
                            src={item.image || (item.type === 'car' 
                              ? "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800"
                              : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800")} 
                            className="w-full h-full object-cover"
                            alt={item.title} 
                          />
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            <span className="px-2.5 py-0.5 bg-white/95 rounded-full text-[8px] font-black uppercase tracking-wider text-black border border-black/5">
                              {item.category === 'rent' ? 'Rent' : 'Buy'}
                            </span>
                            <span className="px-2.5 py-0.5 bg-[#111] text-amber-400 rounded-full text-[8px] font-black uppercase tracking-wider">
                              {item.type === 'car' ? 'Automobile' : 'Real Estate'}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <h4 className="font-bold text-xs text-[#111] truncate">{item.title}</h4>
                            <p className="text-[10px] text-[#777] font-medium flex items-center gap-0.5">
                              <MapPin size={10} /> {item.location}
                            </p>
                            <p className="text-xs font-black text-amber-600">${item.price.toLocaleString()}</p>
                          </div>

                          {/* Specs summary */}
                          {item.specs && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5">
                              {Object.entries(item.specs).slice(0, 3).map(([k, v]) => (
                                <span key={k} className="text-[9px] bg-[#EEF2F6] px-2 py-0.5 rounded-md text-[#555] font-semibold">
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
                            <button 
                              onClick={() => setEditingListing(item)}
                              className="px-3 py-1.5 bg-amber-500/10 text-amber-700 hover:bg-amber-500 hover:text-black rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                              title="Խմբագրել"
                            >
                              <Edit size={10} /> Խմբագրել
                            </button>
                            <button 
                              onClick={() => handleDeleteListing(item.id)}
                              className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                              title="Ջնջել"
                            >
                              <Trash2 size={10} /> Ջնջել
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* =========================================
              VIEW: ADMIN CONTROL PANEL (Ադմին Կառավարում)
              ========================================= */}
          {currentView === 'admin' && (profile?.role === 'admin' || user?.email === 'andranik.harutyunyan2011@gmail.com') && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-10"
            >
              {/* Header Title */}
              <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-[#E5EAEF] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="px-3.5 py-1 bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm">
                    👑 System Administrator Portal
                  </span>
                  <h2 className="text-3xl font-serif font-light text-[#111]">
                    Գլխավոր <span className="italic font-normal text-amber-600">Կառավարման Վահանակ</span>
                  </h2>
                  <p className="text-xs text-[#777] max-w-xl leading-relaxed">
                    Այստեղից դուք կարող եք կառավարել ամբողջ կայքի բովանդակությունը՝ ջնջել ցանկացած հայտարարություն, աջակցության տոմս կամ ծառայության հայտ, ինչպես նաև փոխել դրանց կարգավիճակները:
                  </p>
                </div>
                
                {/* Stats Cards */}
                <div className="flex flex-wrap gap-4 shrink-0 justify-center">
                  <div className="px-5 py-3 bg-[#EEF2F6] rounded-2xl text-center shadow-sm">
                    <p className="text-2xl font-black text-[#111] leading-none">{listings.length}</p>
                    <span className="text-[9px] text-[#888] font-bold uppercase tracking-wider">listings</span>
                  </div>
                  <div className="px-5 py-3 bg-[#EEF2F6] rounded-2xl text-center shadow-sm">
                    <p className="text-2xl font-black text-[#111] leading-none">{supportTickets.length}</p>
                    <span className="text-[9px] text-[#888] font-bold uppercase tracking-wider">tickets</span>
                  </div>
                  <div className="px-5 py-3 bg-[#EEF2F6] rounded-2xl text-center shadow-sm">
                    <p className="text-2xl font-black text-[#111] leading-none">{serviceRequests.length}</p>
                    <span className="text-[9px] text-[#888] font-bold uppercase tracking-wider">requests</span>
                  </div>
                </div>
              </div>

              {/* Admin inner Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Section 1: Listings Management */}
                <div className="bg-white p-6 rounded-[2rem] border border-[#E5EAEF] space-y-6 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between pb-4 border-b border-[#F0F4F8]">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-amber-500" />
                      <h3 className="font-bold text-sm">Հայտարարություններ ({listings.length})</h3>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 flex-1">
                    {listings.length === 0 ? (
                      <p className="text-center py-12 text-xs text-[#999]">Հայտարարություններ չկան:</p>
                    ) : (
                      listings.map(item => (
                        <div key={item.id} className="p-4 bg-[#F8F9FA] rounded-xl border border-[#EEF2F6] space-y-3 flex flex-col justify-between">
                          <div className="flex gap-3">
                            <img 
                              src={item.image || (item.type === 'car' 
                                ? "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800"
                                : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800")} 
                              className="w-14 h-14 object-cover rounded-lg border border-black/5" 
                              alt={item.title} 
                            />
                            <div className="space-y-1 flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-[#111] truncate">{item.title}</h4>
                              <p className="text-[10px] text-[#777] font-semibold">{item.location}</p>
                              <span className="text-[10px] font-black text-amber-600">${item.price.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-black/5">
                            <span className="text-[9px] text-[#999] truncate max-w-[120px]">Հեղինակ՝ {item.authorName || 'Անանուն'}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setEditingListing(item)}
                                className="p-1.5 text-amber-500 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-lg transition-all"
                                title="Խմբագրել հայտարարությունը"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteListing(item.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"
                                title="Ջնջել հայտարարությունը"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Section 2: Support Tickets Management */}
                <div className="bg-white p-6 rounded-[2rem] border border-[#E5EAEF] space-y-6 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between pb-4 border-b border-[#F0F4F8]">
                    <div className="flex items-center gap-2">
                      <LifeBuoy size={18} className="text-blue-500" />
                      <h3 className="font-bold text-sm">Աջակցության Տոմսեր ({supportTickets.length})</h3>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 flex-1">
                    {supportTickets.length === 0 ? (
                      <p className="text-center py-12 text-xs text-[#999]">Ակտիվ տոմսեր չկան:</p>
                    ) : (
                      supportTickets.map(t => (
                        <div key={t.id} className="p-4 bg-[#F8F9FA] rounded-xl border border-[#EEF2F6] space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[9px] uppercase font-extrabold text-[#999]">{t.category}</span>
                              <button 
                                onClick={() => handleDeleteSupportTicket(t.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"
                                title="Ջնջել տոմսը"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <h4 className="font-bold text-xs text-[#111]">{t.subject}</h4>
                            <p className="text-[10px] text-[#555] leading-relaxed">{t.message}</p>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-black/5 space-y-1 text-[9px] text-[#666]">
                            <p><span className="font-bold">Օգտատեր՝</span> {t.userName || 'Անանուն'}</p>
                            <p className="truncate"><span className="font-bold">Email՝</span> {t.userEmail}</p>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-black/5">
                            <span className="text-[9px] text-[#999]">Կարգավիճակ՝</span>
                            <select 
                              value={t.status}
                              onChange={(e) => handleUpdateSupportTicketStatus(t.id, e.target.value as any)}
                              className="px-2 py-1 bg-white border border-[#E5EAEF] rounded-lg text-[10px] font-bold outline-none cursor-pointer"
                            >
                              <option value="open">Բաց (Open)</option>
                              <option value="in-progress">Ընթացքի մեջ (In Progress)</option>
                              <option value="resolved">Լուծված (Resolved)</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Section 3: Service Requests Management */}
                <div className="bg-white p-6 rounded-[2rem] border border-[#E5EAEF] space-y-6 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between pb-4 border-b border-[#F0F4F8]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-500" />
                      <h3 className="font-bold text-sm">Ծառայությունների Հարցումներ ({serviceRequests.length})</h3>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1 flex-1">
                    {serviceRequests.length === 0 ? (
                      <p className="text-center py-12 text-xs text-[#999]">Ակտիվ հարցումներ չկան:</p>
                    ) : (
                      serviceRequests.map(req => (
                        <div key={req.id} className="p-4 bg-[#F8F9FA] rounded-xl border border-[#EEF2F6] space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-bold text-xs text-[#111]">{req.serviceName}</h4>
                              <button 
                                onClick={() => handleDeleteServiceRequest(req.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-all"
                                title="Ջնջել հարցումը"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            {req.message && <p className="text-[10px] text-[#555] leading-relaxed">{req.message}</p>}
                            <p className="text-[9px] text-[#999]">Պլանավորվող օր՝ {req.preferredDate || 'Չի նշվել'}</p>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-black/5 space-y-1 text-[9px] text-[#666]">
                            <p><span className="font-bold">Պատվիրատու՝</span> {req.userName || 'Անանուն'}</p>
                            <p className="truncate"><span className="font-bold">Email՝</span> {req.userEmail}</p>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-black/5">
                            <span className="text-[9px] text-[#999]">Կարգավիճակ՝</span>
                            <select 
                              value={req.status}
                              onChange={(e) => handleUpdateServiceRequestStatus(req.id, e.target.value as any)}
                              className="px-2 py-1 bg-white border border-[#E5EAEF] rounded-lg text-[10px] font-bold outline-none cursor-pointer"
                            >
                              <option value="pending">Սպասման մեջ (Pending)</option>
                              <option value="reviewed">Դիտված է (Reviewed)</option>
                              <option value="contacted">Կապվել ենք (Contacted)</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      )}

      {/* Footer bar */}
      {!isMobile && (
      <footer className="bg-white border-t border-[#E5EAEF] py-16 px-6 mt-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center text-white">
                <Building2 size={16} className="text-amber-400" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#111]">UrbanAm</span>
            </div>
            <p className="text-[#666] text-xs leading-relaxed max-w-xs">
              Հայաստանի ամենաէլիտար տրանսպորտային և բնակարանային առաջարկների կոնսիերժ հարթակը:
            </p>
          </div>
          <div>
            <h5 className="font-extrabold text-xs uppercase tracking-widest text-[#999] mb-4">Marketplace</h5>
            <ul className="space-y-2 text-xs font-bold text-[#666]">
              <li><button onClick={() => { setCurrentView('marketplace'); setActiveType('car'); }} className="hover:text-[#111] transition-colors">Rent Luxury Cars</button></li>
              <li><button onClick={() => { setCurrentView('marketplace'); setActiveType('building'); }} className="hover:text-[#111] transition-colors">Luxury Apartments</button></li>
              <li><button onClick={() => { setCurrentView('marketplace'); setActiveCategory('rent'); }} className="hover:text-[#111] transition-colors">Properties for Rent</button></li>
            </ul>
          </div>
          <div>
            <h5 className="font-extrabold text-xs uppercase tracking-widest text-[#999] mb-4">Connect</h5>
            <ul className="space-y-2 text-xs font-bold text-[#666]">
              <li><button onClick={() => setCurrentView('support')} className="hover:text-[#111] transition-colors">Customer Support (Աջակցություն)</button></li>
              <li><a href="mailto:andranik.harutyunyan2011@gmail.com" className="hover:text-amber-500 transition-colors block">Email: andranik.harutyunyan2011@gmail.com</a></li>
              <li><a href="https://t.me/Andranik404" target="_blank" rel="noreferrer" className="hover:text-[#0088cc] transition-colors block">Telegram: @Andranik404</a></li>
            </ul>
          </div>
        </div>
      </footer>
      )}

      {/* =========================================
          MOBILE VIEW LAYOUT (Գլխավոր Մոբայլ Տեսք)
          ========================================= */}
      {isMobile && renderMobileView(false)}


      {/* =========================================
          MODAL: ADD LISTING (Հայտարարություն տեղադրել)
          ========================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#111111]/75 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl p-10 md:p-12 z-10 border border-amber-500/10 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 p-3 bg-[#EEF2F6] rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-3xl font-serif font-light tracking-tight mb-8">
                Ավելացնել նոր <span className="italic font-normal text-amber-500 underline decoration-amber-500/20">էքսկլյուզիվ</span> հայտարարություն
              </h2>
              
              <form onSubmit={handleAddListing} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Տեսակը (Type)</label>
                    <select 
                      name="type" 
                      value={addListingType}
                      onChange={(e) => setAddListingType(e.target.value as 'car' | 'building')}
                      className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer"
                    >
                      <option value="car">🚗 Automobile (Ավտոմեքենա)</option>
                      <option value="building">🏢 Real Estate (Անշարժ գույք)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Գործարք (Category)</label>
                    <select name="category" className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                      <option value="rent">Վարձակալություն (Rent)</option>
                      <option value="buy">Վաճառք (Purchase)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Անվանում / Մոդել (Title)</label>
                  <input name="title" required type="text" placeholder="օր. Porsche 911 GT3 RS կամ Cascade Loft Penthouse" className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl border border-transparent focus:border-[#111] focus:bg-white outline-none transition-all font-bold text-xs" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Գին (USD)</label>
                    <input name="price" required type="number" placeholder="Գինը դոլարով..." className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl border border-transparent focus:border-[#111] focus:bg-white outline-none transition-all font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Լոկացիա / Հասցե (Location)</label>
                    <input name="location" required type="text" placeholder="օր. Հյուսիսային Պողոտա, Երևան" className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl border border-transparent focus:border-[#111] focus:bg-white outline-none transition-all font-bold text-xs" />
                  </div>
                </div>

                {/* Dynamic Specifications */}
                {addListingType === 'car' ? (
                  <div className="p-6 bg-amber-50/10 border border-amber-500/10 rounded-2xl space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Մեքենայի Լրացուցիչ Տվյալներ (Car Specifications)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Մոդել / Մակնիշ (Brand)</label>
                        <select name="spec_car_model" className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="BMW">BMW</option>
                          <option value="Mercedes">Mercedes-Benz</option>
                          <option value="Audi">Audi</option>
                          <option value="Porsche">Porsche</option>
                          <option value="Bentley">Bentley</option>
                          <option value="Rolls-Royce">Rolls-Royce</option>
                          <option value="Tesla">Tesla</option>
                          <option value="Lexus">Lexus</option>
                          <option value="Other">Այլ (Other)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Շարժիչի ծավալ (Engine L)</label>
                        <input name="spec_car_engine" type="number" step="0.1" min="0.1" placeholder="օր. 3.0" className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Գույն (Color)</label>
                        <select name="spec_car_color" className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="Black">Սև (Black)</option>
                          <option value="White">Սպիտակ (White)</option>
                          <option value="Gray">Մոխրագույն (Gray)</option>
                          <option value="Silver">Արծաթափայլ (Silver)</option>
                          <option value="Blue">Կապույտ (Blue)</option>
                          <option value="Red">Կարմիր (Red)</option>
                          <option value="Custom">Այլ (Custom)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Թափք (Body Type)</label>
                        <select name="spec_car_body" className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="Sedan">Սեդան (Sedan)</option>
                          <option value="SUV">Ամենագնաց (SUV)</option>
                          <option value="Coupe">Կուպե (Coupe)</option>
                          <option value="Convertible">Կաբրիոլետ (Convertible)</option>
                          <option value="Other">Այլ (Other)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Փոխանցման Տուփ</label>
                        <select name="spec_car_transmission" className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="Automatic">Ավտոմատ (Automatic)</option>
                          <option value="Manual">Մեխանիկական (Manual)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50/10 border border-amber-500/10 rounded-2xl space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Անշարժ Գույքի Լրացուցիչ Տվյալներ (Property Specifications)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Տեսակը (Type)</label>
                        <select name="spec_building_type" className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="Apartment">Բնակարան (Apartment)</option>
                          <option value="Penthouse">Պենտհաուս (Penthouse)</option>
                          <option value="Villa">Վիլլա (Villa)</option>
                          <option value="House">Առանձնատուն (House)</option>
                          <option value="Office">Գրասենյակ (Office)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Ննջասենյակներ (Bedrooms)</label>
                        <select name="spec_building_bedrooms" className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5+">5+</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Մակերես (Size sqft)</label>
                        <input name="spec_building_size" type="number" placeholder="օր. 1200" className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Հարկ (Floor)</label>
                        <select name="spec_building_floor" className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                          <option value="6">6</option>
                          <option value="7">7</option>
                          <option value="8">8</option>
                          <option value="9">9</option>
                          <option value="10+">10+</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Նկար (Upload Image)</label>
                  
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
                    onDragLeave={() => setImageDragOver(false)}
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      setImageDragOver(false); 
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                      imageDragOver 
                        ? 'border-amber-500 bg-amber-50/20' 
                        : uploadedImageBase64 
                          ? 'border-emerald-500 bg-emerald-50/5' 
                          : 'border-[#E5EAEF] hover:border-amber-400 bg-[#F4F6F8]'
                    }`}
                    onClick={() => {
                      document.getElementById('listing-image-upload')?.click();
                    }}
                  >
                    <input 
                      id="listing-image-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(e.target.files[0]);
                        }
                      }}
                    />
                    
                    {isUploadingImage ? (
                      <div className="py-4 space-y-2">
                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-[#666] font-bold">Մշակվում է...</p>
                      </div>
                    ) : uploadedImageBase64 ? (
                      <div className="space-y-3">
                        <img 
                          src={uploadedImageBase64} 
                          className="w-32 h-20 object-cover rounded-lg mx-auto shadow-md border border-emerald-500/10" 
                          alt="Uploaded preview" 
                        />
                        <div className="space-y-1">
                          <p className="text-xs text-emerald-600 font-extrabold">Նկարը հաջողությամբ բեռնված է</p>
                          <p className="text-[10px] text-[#888]">Սեղմեք կամ քաշեք նոր նկար՝ փոխարինելու համար</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 py-2">
                        <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center mx-auto text-[#666] shadow-sm">
                          <Upload size={18} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-[#111] font-bold">
                            Քաշեք նկարը այստեղ կամ <span className="text-amber-500 underline decoration-amber-500/30">ընտրեք սարքից</span>
                          </p>
                          <p className="text-[10px] text-[#888]">Աջակցում է PNG, JPG, WEBP (ավտոմատ սեղմմամբ)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Հակիրճ նկարագրություն (Short Description)</label>
                  <textarea name="description" rows={3} placeholder="Ներկայացրեք գույքի կամ մեքենայի հիմնական առավելությունները..." className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl border border-transparent focus:border-[#111] focus:bg-white outline-none transition-all font-bold text-xs resize-none" />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmittingListing}
                  className={`w-full py-4 rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isSubmittingListing 
                      ? 'bg-[#e5eaef] text-[#999999] cursor-not-allowed' 
                      : 'bg-[#111111] text-white hover:bg-amber-500 hover:text-black'
                  }`}
                >
                  {isSubmittingListing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#999999] border-t-transparent rounded-full animate-spin" />
                      Հրապարակվում է...
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Հրապարակել Marketplace-ում
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================
          MODAL: EDIT LISTING (Հայտարարության խմբագրում)
          ========================================= */}
      <AnimatePresence>
        {editingListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingListing(null)}
              className="absolute inset-0 bg-[#111111]/75 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl p-10 md:p-12 z-10 border border-amber-500/10 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setEditingListing(null)}
                className="absolute top-8 right-8 p-3 bg-[#EEF2F6] rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
              <h2 className="text-3xl font-serif font-light tracking-tight mb-8">
                Խմբագրել <span className="italic font-normal text-amber-500 underline decoration-amber-500/20">հայտարարությունը</span>
              </h2>
              
              <form onSubmit={handleUpdateListing} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Տեսակը (Type)</label>
                    <select 
                      name="type" 
                      value={editListingType}
                      onChange={(e) => setEditListingType(e.target.value as 'car' | 'building')}
                      className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer"
                    >
                      <option value="car">🚗 Automobile (Ավտոմեքենա)</option>
                      <option value="building">🏢 Real Estate (Անշարժ գույք)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Գործարք (Category)</label>
                    <select name="category" defaultValue={editingListing.category} className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                      <option value="rent">Վարձակալություն (Rent)</option>
                      <option value="buy">Վաճառք (Purchase)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Անվանում / Մոդել (Title)</label>
                  <input name="title" defaultValue={editingListing.title} required type="text" placeholder="օր. Porsche 911 GT3 RS կամ Cascade Loft Penthouse" className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl border border-transparent focus:border-[#111] focus:bg-white outline-none transition-all font-bold text-xs" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Գին (USD)</label>
                    <input name="price" defaultValue={editingListing.price} required type="number" placeholder="Գինը դոլարով..." className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl border border-transparent focus:border-[#111] focus:bg-white outline-none transition-all font-bold text-xs" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Լոկացիա / Հասցե (Location)</label>
                    <input name="location" defaultValue={editingListing.location} required type="text" placeholder="օր. Հյուսիսային Պողոտա, Երևան" className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl border border-transparent focus:border-[#111] focus:bg-white outline-none transition-all font-bold text-xs" />
                  </div>
                </div>

                {/* Dynamic Specifications */}
                {editListingType === 'car' ? (
                  <div className="p-6 bg-amber-50/10 border border-amber-500/10 rounded-2xl space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Մեքենայի Լրացուցիչ Տվյալներ (Car Specifications)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Մոդել / Մակնիշ (Brand)</label>
                        <select name="spec_car_model" defaultValue={editingListing.specs?.Model || 'BMW'} className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="BMW">BMW</option>
                          <option value="Mercedes">Mercedes-Benz</option>
                          <option value="Audi">Audi</option>
                          <option value="Porsche">Porsche</option>
                          <option value="Bentley">Bentley</option>
                          <option value="Rolls-Royce">Rolls-Royce</option>
                          <option value="Tesla">Tesla</option>
                          <option value="Lexus">Lexus</option>
                          <option value="Other">Այլ (Other)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Շարժիչի ծավալ (Engine L)</label>
                        <input name="spec_car_engine" defaultValue={editingListing.specs?.Engine ? editingListing.specs.Engine.replace(' L', '') : '2.0'} type="number" step="0.1" min="0.1" placeholder="օր. 3.0" className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Գույն (Color)</label>
                        <select name="spec_car_color" defaultValue={editingListing.specs?.Color || 'Black'} className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="Black">Սև (Black)</option>
                          <option value="White">Սպիտակ (White)</option>
                          <option value="Gray">Մոխրագույն (Gray)</option>
                          <option value="Silver">Արծաթափայլ (Silver)</option>
                          <option value="Blue">Կապույտ (Blue)</option>
                          <option value="Red">Կարմիր (Red)</option>
                          <option value="Custom">Այլ (Custom)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Թափք (Body Type)</label>
                        <select name="spec_car_body" defaultValue={editingListing.specs?.Body || 'Sedan'} className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="Sedan">Սեդան (Sedan)</option>
                          <option value="SUV">Ամենագնաց (SUV)</option>
                          <option value="Coupe">Կուպե (Coupe)</option>
                          <option value="Convertible">Կաբրիոլետ (Convertible)</option>
                          <option value="Other">Այլ (Other)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Փոխանցման Տուփ</label>
                        <select name="spec_car_transmission" defaultValue={editingListing.specs?.Transmission || 'Automatic'} className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="Automatic">Ավտոմատ (Automatic)</option>
                          <option value="Manual">Մեխանիկական (Manual)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-amber-50/10 border border-amber-500/10 rounded-2xl space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Անշարժ Գույքի Լրացուցիչ Տվյալներ (Property Specifications)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Տեսակը (Type)</label>
                        <select name="spec_building_type" defaultValue={editingListing.specs?.Type || 'Apartment'} className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="Apartment">Բնակարան (Apartment)</option>
                          <option value="Penthouse">Պենտհաուս (Penthouse)</option>
                          <option value="Villa">Վիլլա (Villa)</option>
                          <option value="House">Առանձնատուն (House)</option>
                          <option value="Office">Գրասենյակ (Office)</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Ննջասենյակներ (Bedrooms)</label>
                        <select name="spec_building_bedrooms" defaultValue={editingListing.specs?.Bedrooms || '2'} className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5+">5+</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Մակերես (Size sqft)</label>
                        <input name="spec_building_size" defaultValue={editingListing.specs?.Size ? editingListing.specs.Size.replace(' sqft', '') : '1200'} type="number" placeholder="օր. 1200" className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#777]">Հարկ (Floor)</label>
                        <select name="spec_building_floor" defaultValue={editingListing.specs?.Floor || '3'} className="w-full px-4 py-2.5 bg-white border border-[#E5EAEF] rounded-xl outline-none font-bold text-xs appearance-none cursor-pointer">
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                          <option value="6">6</option>
                          <option value="7">7</option>
                          <option value="8">8</option>
                          <option value="9">9</option>
                          <option value="10+">10+</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Նկար (Upload Image)</label>
                  
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
                    onDragLeave={() => setImageDragOver(false)}
                    onDrop={(e) => { 
                      e.preventDefault(); 
                      setImageDragOver(false); 
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleEditImageUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                      imageDragOver 
                        ? 'border-amber-500 bg-amber-50/20' 
                        : editingImageBase64 
                          ? 'border-emerald-500 bg-emerald-50/5' 
                          : 'border-[#E5EAEF] hover:border-amber-400 bg-[#F4F6F8]'
                    }`}
                    onClick={() => {
                      document.getElementById('edit-listing-image-upload')?.click();
                    }}
                  >
                    <input 
                      id="edit-listing-image-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleEditImageUpload(e.target.files[0]);
                        }
                      }}
                    />
                    
                    {isUploadingImage ? (
                      <div className="py-4 space-y-2">
                        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-[#666] font-bold">Մշակվում է...</p>
                      </div>
                    ) : editingImageBase64 ? (
                      <div className="space-y-3">
                        <img 
                          src={editingImageBase64} 
                          className="w-32 h-20 object-cover rounded-lg mx-auto shadow-md border border-emerald-500/10" 
                          alt="Uploaded preview" 
                        />
                        <div className="space-y-1">
                          <p className="text-xs text-emerald-600 font-extrabold">Նկարը հաջողությամբ բեռնված է</p>
                          <p className="text-[10px] text-[#888]">Սեղմեք կամ քաշեք նոր նկար՝ փոխարինելու համար</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 py-2">
                        <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center mx-auto text-[#666] shadow-sm">
                          <Upload size={18} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-[#111] font-bold">
                            Քաշեք նկարը այստեղ կամ <span className="text-amber-500 underline decoration-amber-500/30">ընտրեք սարքից</span>
                          </p>
                          <p className="text-[10px] text-[#888]">Աջակցում է PNG, JPG, WEBP (ավտոմատ սեղմմամբ)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Հակիրճ նկարագրություն (Short Description)</label>
                  <textarea name="description" defaultValue={editingListing.description} rows={3} placeholder="Ներկայացրեք գույքի կամ մեքենայի հիմնական առավելությունները..." className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl border border-transparent focus:border-[#111] focus:bg-white outline-none transition-all font-bold text-xs resize-none" />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmittingListing}
                  className={`w-full py-4 rounded-xl font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isSubmittingListing 
                      ? 'bg-[#e5eaef] text-[#999999] cursor-not-allowed' 
                      : 'bg-[#111111] text-white hover:bg-amber-500 hover:text-black'
                  }`}
                >
                  {isSubmittingListing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#999999] border-t-transparent rounded-full animate-spin" />
                      Պահպանվում է...
                    </>
                  ) : (
                    <>
                      <Edit size={16} /> Պահպանել փոփոխությունները
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================
          MODAL: BOOK CONCIERGE SERVICE (Պատվիրել ծառայություն)
          ========================================= */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute inset-0 bg-[#111111]/75 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl p-10 md:p-12 z-10 border border-amber-500/10"
            >
              <button 
                onClick={() => setIsBookingModalOpen(false)}
                className="absolute top-8 right-8 p-3 bg-[#EEF2F6] rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="space-y-2 mb-6">
                <span className="text-[10px] tracking-wider uppercase font-extrabold text-amber-600">VIP booking request</span>
                <h3 className="text-2xl font-serif font-light text-[#111]">
                  Պատվիրել <span className="italic font-normal text-amber-500">{selectedService}</span>
                </h3>
                <p className="text-xs text-[#666]">
                  Խնդրում ենք լրացնել ձեր պահանջները: Մեր VIP մենեջերը կկապնվի ձեզ հետ 15 րոպեի ընթացքում:
                </p>
              </div>

              <form onSubmit={handleBookService} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Նախընտրելի Օր / Ժամանակահատված</label>
                  <input name="preferredDate" required type="text" placeholder="օր. Հուլիսի 12-ից սկսած կամ Այսօր հնարավորինս շուտ" className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Հատուկ պահանջներ կամ նշումներ (Notes / Message)</label>
                  <textarea name="message" rows={4} placeholder="Նշեք լրացուցիչ պահանջներ, օրինակ՝ անվտանգության աշխատակիցների քանակը, հատուկ երթուղին կամ այլն..." className="w-full px-5 py-3.5 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs resize-none" />
                </div>

                <button type="submit" className="w-full py-4 bg-[#111111] text-white rounded-xl font-extrabold hover:bg-amber-500 hover:text-black transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> Ուղարկել Պատվերը (Submit Request)
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Custom Confirmation Dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(null)}
              className="absolute inset-0 bg-[#111111]/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl p-8 md:p-10 z-10 border border-rose-500/10 text-center space-y-6"
            >
              <div className="mx-auto w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                <Trash2 size={28} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#111]">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-[#666] leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  onClick={() => setConfirmDialog(null)}
                  className="px-5 py-3.5 bg-[#EEF2F6] hover:bg-[#E5EAEF] text-black text-xs font-extrabold rounded-xl transition-all"
                >
                  Չեղարկել (Cancel)
                </button>
                <button 
                  onClick={confirmDialog.onConfirm}
                  className="px-5 py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-rose-600/15"
                >
                  Այո, Ջնջել (Delete)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Listing Details Modal */}
        {selectedListingForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedListingForDetail(null)}
              className="absolute inset-0 bg-[#111111]/75 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl z-10 border border-amber-500/10 flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedListingForDetail(null)}
                className="absolute top-6 right-6 p-2.5 bg-[#EEF2F6] rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors z-20"
                title="Փակել"
              >
                <X size={18} />
              </button>

              <div className="overflow-y-auto p-8 md:p-10 space-y-6">
                {/* Visual Header */}
                <div className="relative h-64 md:h-80 rounded-[1.8rem] overflow-hidden bg-[#E5EAEF] border border-black/5 shrink-0">
                  <img 
                    src={selectedListingForDetail.image || (selectedListingForDetail.type === 'car' 
                      ? "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800"
                      : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800")} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    alt={selectedListingForDetail.title}
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-sm text-[#111] border border-black/5">
                      {selectedListingForDetail.category === 'rent' ? 'Rent (Վարձույթ)' : 'Buy (Գնում)'}
                    </span>
                    <span className="px-3.5 py-1.5 bg-[#111111] text-amber-400 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-md">
                      {selectedListingForDetail.type === 'car' ? '🚗 Automobile' : '🏢 Real Estate'}
                    </span>
                  </div>
                </div>

                {/* Main details */}
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="space-y-2">
                      <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111]">
                        {selectedListingForDetail.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[#666] text-sm font-semibold">
                        <MapPin size={14} className="text-amber-500" />
                        <span>{selectedListingForDetail.location}</span>
                      </div>
                    </div>
                    <div className="md:text-right shrink-0">
                      <p className="text-2xl md:text-3xl font-black text-amber-600">
                        ${selectedListingForDetail.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-[#888] font-bold">
                        {selectedListingForDetail.category === 'rent' ? 'ամսական (monthly)' : 'ընդհանուր արժեք (total)'}
                      </p>
                    </div>
                  </div>

                  {selectedListingForDetail.description && (
                    <div className="space-y-1.5 pt-2 border-t border-[#F0F4F8]">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#999]">Նկարագրություն</h4>
                      <p className="text-sm text-[#444] leading-relaxed whitespace-pre-line">
                        {selectedListingForDetail.description}
                      </p>
                    </div>
                  )}

                  {/* Specs list */}
                  {selectedListingForDetail.specs && Object.keys(selectedListingForDetail.specs).length > 0 && (
                    <div className="pt-4 border-t border-[#F0F4F8] space-y-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#999]">Բնութագիր (Specifications)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(selectedListingForDetail.specs).map(([k, v]) => (
                          <div key={k} className="p-3 bg-[#F8F9FA] rounded-xl border border-[#EEF2F6] flex flex-col justify-center">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#999] mb-1">{k}</span>
                            <span className="text-xs font-bold text-[#111]">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Author Box */}
                  <div className="pt-4 border-t border-[#F0F4F8] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold text-xs">
                        {selectedListingForDetail.authorName ? selectedListingForDetail.authorName.charAt(0) : 'Ա'}
                      </div>
                      <div>
                        <p className="text-xs text-[#888] font-semibold leading-none">Հայտարարատու՝</p>
                        <p className="text-xs font-bold text-[#111] mt-0.5">{selectedListingForDetail.authorName || 'Անանուն'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inquiry Form */}
                <div className="pt-6 border-t border-[#F0F4F8] space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#111]">Կապնվել հայտարարատուի հետ կամ պատվիրել</h4>
                    <p className="text-xs text-[#666]">Ուղարկեք ձեր հարցերը կամ ամրագրման ցանկությունը. Մեր մասնագետները կկապնվեն Ձեզ հետ:</p>
                  </div>

                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    {!user && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Ձեր Անունը</label>
                          <input name="name" required type="text" placeholder="Անուն Ազգանուն" className="w-full px-4 py-3 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs border border-transparent focus:border-amber-500 focus:bg-white transition-all" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Էլ. Փոստ</label>
                          <input name="email" required type="email" placeholder="example@mail.com" className="w-full px-4 py-3 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs border border-transparent focus:border-amber-500 focus:bg-white transition-all" />
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1 space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Հեռախոսահամար</label>
                        <input name="phone" required type="tel" defaultValue={profile?.phone || ''} placeholder="+374 XX XX XX XX" className="w-full px-4 py-3 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs border border-transparent focus:border-amber-500 focus:bg-white transition-all" />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-extrabold text-[#999]">Հարց կամ Նամակ (Message)</label>
                        <input name="message" required type="text" placeholder="Ցանկանում եմ իմանալ ավելին այս առաջարկի մասին..." className="w-full px-4 py-3 bg-[#F4F6F8] rounded-xl outline-none font-bold text-xs border border-transparent focus:border-amber-500 focus:bg-white transition-all" />
                      </div>
                    </div>
                    <button type="submit" className="w-full py-3.5 bg-[#111111] text-white hover:bg-amber-500 hover:text-black transition-all rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-black/5">
                      <Send size={14} /> Ուղարկել Հարցումը
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bottom Navigation Bar for Mobile Devices */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5EAEF] md:hidden px-2 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {[
              { id: 'marketplace', label: 'Market', icon: Sparkles },
              { id: 'services', label: 'Services', icon: ShieldCheck },
              { 
                id: 'add', 
                label: 'List', 
                icon: Plus, 
                isSpecial: true,
                action: () => {
                  if (!user) {
                    handleLogin();
                  } else {
                    setIsModalOpen(true);
                  }
                } 
              },
              ...((profile?.role === 'admin' || user?.email === 'andranik.harutyunyan2011@gmail.com') 
                ? [{ id: 'admin', label: 'Admin', icon: Lock }] 
                : [{ id: 'support', label: 'Support', icon: LifeBuoy }]),
              { id: 'profile', label: 'Profile', icon: UserIcon }
            ].map((tab) => {
              const IconComponent = tab.icon;
              const isActive = currentView === tab.id;
              
              if (tab.isSpecial) {
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (isNavBlocked) return;
                      tab.action();
                    }}
                    className="flex flex-col items-center justify-center -mt-6 bg-[#111111] hover:bg-amber-500 text-white hover:text-black w-14 h-14 rounded-full shadow-lg transition-all active:scale-95 transform group"
                    title="List your property"
                  >
                    <IconComponent size={24} className="text-amber-400 group-hover:text-black transition-colors" />
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (isNavBlocked) return;
                    setCurrentView(tab.id as any);
                    setShowMyListings(false);
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-3 min-h-[44px] rounded-2xl transition-all relative ${
                    isActive ? 'text-[#111111]' : 'text-[#888888] active:bg-[#EEF2F6]'
                  }`}
                >
                  <IconComponent 
                    size={18} 
                    className={`transition-all ${isActive ? 'text-amber-500 scale-110' : 'text-[#888888]'}`} 
                  />
                  <span className="text-[9px] font-extrabold tracking-wide mt-1 uppercase">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
    </div>
  );
}
