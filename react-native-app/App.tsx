import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

// For Expo, we import icons from @expo/vector-icons.
// If you are using bare React Native, you can use react-native-vector-icons.
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// Firebase imports (v9/v10 JS SDK)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
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
  updateDoc 
} from 'firebase/firestore';

// ==========================================
// FIREBASE CONFIGURATION
// Replace these values with your actual Firebase Web Config
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Types definitions
type Listing = {
  id: string;
  title: string;
  type: 'car' | 'building';
  category: 'rent' | 'buy';
  price: number;
  location: string;
  description: string;
  image?: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  specs?: {
    Model?: string;
    Engine?: string;
    Color?: string;
    Body?: string;
    Transmission?: string;
    Type?: string;
    Bedrooms?: string;
    Size?: string;
    Floor?: string;
  };
};

const SERVICES = [
  {
    id: "chauffeur",
    title: "Շքեղ Մեքենաների Վարձույթ",
    subtitle: "Luxury Chauffeur & Charter",
    description: "VIP դասի ավտոմեքենաների տրամադրում անձնական վարորդով կամ առանց: Ներառում է օդանավակայանի դիմավորում, անվտանգության ապահովում և էլիտար սպասարկում:",
    icon: "car-sports",
    image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "brokerage",
    title: "Էլիտար Անշարժ Գույքի Բրոքերաժ",
    subtitle: "VIP Real Estate Brokerage",
    description: "Լյուքս դասի պենտհաուսների, առանձնատների և կոմերցիոն տարածքների առք, վաճառք և վարձակալություն: Լիարժեք իրավաբանական աջակցություն:",
    icon: "office-building",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "helicopter",
    title: "Ուղղաթիռային Չարթեր և Տուրեր",
    subtitle: "Helicopter Charter & Sightseeing",
    description: "Անհատական թռիչքներ Հայաստանի ցանկացած կետ, էքսկլյուզիվ տուրեր դեպի տեսարժան վայրեր և Սևանա լիճ: Արագ, ապահով և տպավորիչ տեղաշարժ:",
    icon: "helicopter",
    image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "interior",
    title: "Ինտերիեր Դիզայն և Կոնսուլտացիա",
    subtitle: "Premium Architecture & Interior Design",
    description: "Շքեղ անշարժ գույքի ինտերիերի և էքստերիերի դիզայնի մշակում աշխարհահռչակ ճարտարապետների կողմից: Ինտեգրված 'Smart Home' լուծումներ:",
    icon: "palette",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800"
  }
];

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
  }
];

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'marketplace' | 'services' | 'support' | 'profile'>('marketplace');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Authentication states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Listings state
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<'all' | 'car' | 'building'>('all');
  const [activeCategory, setActiveCategory] = useState<'all' | 'rent' | 'buy'>('all');

  // Specs filtering states
  const [filterCarModel, setFilterCarModel] = useState('all');
  const [filterCarEngineMin, setFilterCarEngineMin] = useState('all');
  const [filterCarColor, setFilterCarColor] = useState('all');
  const [filterCarBody, setFilterCarBody] = useState('all');

  const [filterBuildingType, setFilterBuildingType] = useState('all');
  const [filterBuildingBedrooms, setFilterBuildingBedrooms] = useState('all');
  const [filterBuildingFloor, setFilterBuildingFloor] = useState('all');

  // Modal views
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [conciergeModalService, setConciergeModalService] = useState<any>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  // Add Listing Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'car' | 'building'>('car');
  const [addCategory, setAddCategory] = useState<'rent' | 'buy'>('buy');
  const [addTitle, setAddTitle] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addLocation, setAddLocation] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addImage, setAddImage] = useState('');
  const [isSubmittingListing, setIsSubmittingListing] = useState(false);

  // Add Listing Custom Specs
  const [specCarModel, setSpecCarModel] = useState('BMW');
  const [specCarEngine, setSpecCarEngine] = useState('');
  const [specCarColor, setSpecCarColor] = useState('Black');
  const [specCarBody, setSpecCarBody] = useState('Sedan');
  const [specCarTransmission, setSpecCarTransmission] = useState('Automatic');

  const [specBuildingType, setSpecBuildingType] = useState('Apartment');
  const [specBuildingBedrooms, setSpecBuildingBedrooms] = useState('2');
  const [specBuildingSize, setSpecBuildingSize] = useState('');
  const [specBuildingFloor, setSpecBuildingFloor] = useState('3');

  // Edit Listing Modal states
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editType, setEditType] = useState<'car' | 'building'>('car');
  const [editCategory, setEditCategory] = useState<'rent' | 'buy'>('buy');

  const [editCarModel, setEditCarModel] = useState('BMW');
  const [editCarEngine, setEditCarEngine] = useState('');
  const [editCarColor, setEditCarColor] = useState('Black');
  const [editCarBody, setEditCarBody] = useState('Sedan');
  const [editCarTransmission, setEditCarTransmission] = useState('Automatic');

  const [editBuildingType, setEditBuildingType] = useState('Apartment');
  const [editBuildingBedrooms, setEditBuildingBedrooms] = useState('2');
  const [editBuildingSize, setEditBuildingSize] = useState('');
  const [editBuildingFloor, setEditBuildingFloor] = useState('3');

  // Support Ticket Form states
  const [ticketCategory, setTicketCategory] = useState('General');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // FAQ Accordion status
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Listen to Listings from Firestore
  useEffect(() => {
    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Listing[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title,
          type: data.type,
          category: data.category,
          price: data.price,
          location: data.location,
          description: data.description || '',
          image: data.image || '',
          authorId: data.authorId || '',
          authorName: data.authorName || 'Անանուն',
          createdAt: data.createdAt,
          specs: data.specs || {},
        });
      });
      setListings(items);
    });
    return unsubscribe;
  }, []);

  // Sync edit modal state when editingListing is selected
  useEffect(() => {
    if (editingListing) {
      setEditTitle(editingListing.title);
      setEditPrice(String(editingListing.price));
      setEditLocation(editingListing.location);
      setEditDescription(editingListing.description);
      setEditImage(editingListing.image || '');
      setEditType(editingListing.type);
      setEditCategory(editingListing.category);

      if (editingListing.type === 'car') {
        setEditCarModel(editingListing.specs?.Model || 'BMW');
        setEditCarEngine(editingListing.specs?.Engine ? editingListing.specs.Engine.replace(' L', '') : '2.0');
        setEditCarColor(editingListing.specs?.Color || 'Black');
        setEditCarBody(editingListing.specs?.Body || 'Sedan');
        setEditCarTransmission(editingListing.specs?.Transmission || 'Automatic');
      } else {
        setEditBuildingType(editingListing.specs?.Type || 'Apartment');
        setEditBuildingBedrooms(editingListing.specs?.Bedrooms || '2');
        setEditBuildingSize(editingListing.specs?.Size ? editingListing.specs.Size.replace(' sqft', '') : '1200');
        setEditBuildingFloor(editingListing.specs?.Floor || '3');
      }
    }
  }, [editingListing]);

  // Handle Authentication (Sign In / Sign Up)
  const handleAuth = async () => {
    if (!authEmail || !authPassword) {
      Alert.alert("Սխալ", "Խնդրում ենք լրացնել բոլոր դաշտերը");
      return;
    }
    setAuthLoading(true);
    try {
      if (isSignUp) {
        if (!authDisplayName) {
          Alert.alert("Սխալ", "Խնդրում ենք մուտքագրել Ձեր անունը");
          setAuthLoading(false);
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await updateProfile(userCred.user, { displayName: authDisplayName });
        Alert.alert("Հաջողություն", "Գրանցումը կատարվեց հաջողությամբ։");
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        Alert.alert("Հաջողություն", "Մուտքը կատարվեց հաջողությամբ։");
      }
      setAuthEmail('');
      setAuthPassword('');
      setAuthDisplayName('');
    } catch (error: any) {
      Alert.alert("Սխալ", error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert("Ելք", "Դուք դուրս եկաք համակարգից:");
    } catch (error: any) {
      Alert.alert("Սխալ", error.message);
    }
  };

  // Create Listing
  const handleCreateListing = async () => {
    if (!user) {
      Alert.alert("Սխալ", "Շարունակելու համար նախ մուտք գործեք:");
      return;
    }
    if (!addTitle || !addPrice || !addLocation) {
      Alert.alert("Սխալ", "Խնդրում ենք լրացնել պարտադիր դաշտերը (Անվանում, Գին, Լոկացիա):");
      return;
    }

    try {
      setIsSubmittingListing(true);
      const specs: Record<string, string> = {};
      if (addType === 'car') {
        specs['Model'] = specCarModel;
        specs['Engine'] = (specCarEngine ? specCarEngine : '2.0') + ' L';
        specs['Color'] = specCarColor;
        specs['Body'] = specCarBody;
        specs['Transmission'] = specCarTransmission;
      } else {
        specs['Type'] = specBuildingType;
        specs['Bedrooms'] = specBuildingBedrooms;
        specs['Size'] = (specBuildingSize ? specBuildingSize : '1200') + ' sqft';
        specs['Floor'] = specBuildingFloor;
      }

      await addDoc(collection(db, 'listings'), {
        title: addTitle,
        type: addType,
        category: addCategory,
        price: Number(addPrice),
        location: addLocation,
        description: addDescription,
        image: addImage || (addType === 'car'
          ? "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800"
          : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"),
        authorId: user.uid,
        authorName: user.displayName || 'Անանուն',
        createdAt: serverTimestamp(),
        specs: specs,
      });

      Alert.alert("Հաջողություն", "Հայտարարությունը հաջողությամբ տեղադրվեց։");
      setAddModalOpen(false);
      // Reset values
      setAddTitle('');
      setAddPrice('');
      setAddLocation('');
      setAddDescription('');
      setAddImage('');
    } catch (err: any) {
      Alert.alert("Սխալ", "Չհաջողվեց պահպանել հայտարարությունը: " + err.message);
    } finally {
      setIsSubmittingListing(false);
    }
  };

  // Update Listing
  const handleUpdateListing = async () => {
    if (!user || !editingListing) return;
    if (!editTitle || !editPrice || !editLocation) {
      Alert.alert("Սխալ", "Խնդրում ենք լրացնել պարտադիր դաշտերը");
      return;
    }

    try {
      setIsSubmittingListing(true);
      const specs: Record<string, string> = {};
      if (editType === 'car') {
        specs['Model'] = editCarModel;
        specs['Engine'] = (editCarEngine ? editCarEngine : '2.0') + ' L';
        specs['Color'] = editCarColor;
        specs['Body'] = editCarBody;
        specs['Transmission'] = editCarTransmission;
      } else {
        specs['Type'] = editBuildingType;
        specs['Bedrooms'] = editBuildingBedrooms;
        specs['Size'] = (editBuildingSize ? editBuildingSize : '1200') + ' sqft';
        specs['Floor'] = editBuildingFloor;
      }

      await updateDoc(doc(db, 'listings', editingListing.id), {
        title: editTitle,
        type: editType,
        category: editCategory,
        price: Number(editPrice),
        location: editLocation,
        description: editDescription,
        image: editImage,
        specs: specs,
      });

      Alert.alert("Հաջողություն", "Հայտարարությունը հաջողությամբ թարմացվեց:");
      setEditingListing(null);
    } catch (err: any) {
      Alert.alert("Սխալ", "Չհաջողվեց թարմացնել հայտարարությունը: " + err.message);
    } finally {
      setIsSubmittingListing(false);
    }
  };

  // Delete Listing
  const handleDeleteListing = (id: string) => {
    Alert.alert(
      "Ջնջել Հայտարարությունը",
      "Համոզվա՞ծ եք, որ ցանկանում եք ջնջել այս հայտարարությունը:",
      [
        { text: "Չեղարկել", style: "cancel" },
        { 
          text: "Ջնջել", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'listings', id));
              Alert.alert("Հաջողություն", "Հայտարարությունը ջնջվեց:");
            } catch (err: any) {
              Alert.alert("Սխալ", "Չհաջողվեց ջնջել: " + err.message);
            }
          }
        }
      ]
    );
  };

  // Submit support ticket
  const handleSubmitTicket = async () => {
    if (!user) {
      Alert.alert("Սխալ", "Աջակցության հայտ ուղարկելու համար նախ մուտք գործեք:");
      return;
    }
    if (!ticketSubject || !ticketMessage) {
      Alert.alert("Սխալ", "Խնդրում ենք լրացնել վերնագիրը և հաղորդագրությունը:");
      return;
    }

    try {
      setIsSubmittingTicket(true);
      await addDoc(collection(db, 'service_requests'), {
        serviceId: 'support_ticket',
        serviceTitle: `Աջակցություն: ${ticketCategory}`,
        notes: `Թեմա: ${ticketSubject}\n\nՆկարագրություն: ${ticketMessage}`,
        userId: user.uid,
        userName: user.displayName || 'Անանուն',
        userEmail: user.email || '',
        status: 'open',
        createdAt: serverTimestamp(),
      });

      Alert.alert("Հաջողություն", "Ձեր հարցումը հաջողությամբ ուղարկվեց։ Մեր թիմը շուտով կապ կհաստատի Ձեզ հետ։");
      setTicketSubject('');
      setTicketMessage('');
    } catch (err: any) {
      Alert.alert("Սխալ", "Չհաջողվեց ուղարկել հարցումը: " + err.message);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Submit concierge booking
  const handleBookConcierge = async () => {
    if (!user) {
      Alert.alert("Սխալ", "Ծառայություն պատվիրելու համար նախ մուտք գործեք:");
      return;
    }
    if (!conciergeModalService) return;

    try {
      setIsBookingSubmitting(true);
      await addDoc(collection(db, 'service_requests'), {
        serviceId: conciergeModalService.id,
        serviceTitle: conciergeModalService.title,
        notes: bookingNotes || "Առանց լրացուցիչ նշումների",
        userId: user.uid,
        userName: user.displayName || 'Անանուն',
        userEmail: user.email || '',
        status: 'open',
        createdAt: serverTimestamp(),
      });

      Alert.alert("Պատվերն ընդունված է", "Մեր Concierge թիմը կապ կհաստատի Ձեզ հետ հեռախոսով կամ էլ․ փոստով:");
      setConciergeModalService(null);
      setBookingNotes('');
    } catch (err: any) {
      Alert.alert("Սխալ", err.message);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  // Filter listings list dynamically
  const filteredListings = listings.filter((item) => {
    const mType = activeType === 'all' || item.type === activeType;
    const mCat = activeCategory === 'all' || item.category === activeCategory;
    const mSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.specs?.Model && item.specs.Model.toLowerCase().includes(searchQuery.toLowerCase()));

    // Detailed car specs filter
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

    // Detailed property specs filter
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

    return mType && mCat && mSearch && mCarModel && mCarEngine && mCarColor && mCarBody && mBuildingType && mBuildingBedrooms && mBuildingFloor;
  });

  const clearAllFilters = () => {
    setFilterCarModel('all');
    setFilterCarEngineMin('all');
    setFilterCarColor('all');
    setFilterCarBody('all');
    setFilterBuildingType('all');
    setFilterBuildingBedrooms('all');
    setFilterBuildingFloor('all');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Բեռնվում է...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* UPPER BANNER / HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>URBANAM PREMIUM</Text>
            <Text style={styles.headerTitle}>Մարկետպլեյս</Text>
          </View>
          {user ? (
            <TouchableOpacity onPress={() => setCurrentTab('profile')} style={styles.avatarButton}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>{(user.displayName || user.email || 'U')[0].toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setCurrentTab('profile')} style={styles.loginHeaderBtn}>
              <Feather name="log-in" size={18} color="#f59e0b" />
              <Text style={styles.loginHeaderBtnText}>Մուտք</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SCREEN SELECTOR TABS */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            onPress={() => setCurrentTab('marketplace')} 
            style={[styles.tabItem, currentTab === 'marketplace' && styles.tabItemActive]}
          >
            <Feather name="shopping-bag" size={16} color={currentTab === 'marketplace' ? '#111' : '#777'} />
            <Text style={[styles.tabLabel, currentTab === 'marketplace' && styles.tabLabelActive]}>Գույք & Մեքենա</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setCurrentTab('services')} 
            style={[styles.tabItem, currentTab === 'services' && styles.tabItemActive]}
          >
            <MaterialCommunityIcons name="star-ring" size={16} color={currentTab === 'services' ? '#111' : '#777'} />
            <Text style={[styles.tabLabel, currentTab === 'services' && styles.tabLabelActive]}>Concierge</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setCurrentTab('support')} 
            style={[styles.tabItem, currentTab === 'support' && styles.tabItemActive]}
          >
            <Feather name="help-circle" size={16} color={currentTab === 'support' ? '#111' : '#777'} />
            <Text style={[styles.tabLabel, currentTab === 'support' && styles.tabLabelActive]}>Օգնություն</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setCurrentTab('profile')} 
            style={[styles.tabItem, currentTab === 'profile' && styles.tabItemActive]}
          >
            <Feather name="user" size={16} color={currentTab === 'profile' ? '#111' : '#777'} />
            <Text style={[styles.tabLabel, currentTab === 'profile' && styles.tabLabelActive]}>Իմ Էջը</Text>
          </TouchableOpacity>
        </View>

        {/* MAIN BODY PANELS */}
        <View style={{ flex: 1 }}>

          {/* =========================================
              VIEW: MARKETPLACE
              ========================================= */}
          {currentTab === 'marketplace' && (
            <View style={{ flex: 1 }}>
              {/* Search input */}
              <View style={styles.searchSection}>
                <Feather name="search" size={18} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Որոնել ըստ մոդելի, հասցեի կամ անվան..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Type and Category filters */}
              <View style={styles.filterRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                  {/* Type buttons */}
                  <TouchableOpacity onPress={() => { setActiveType('all'); clearAllFilters(); }} style={[styles.filterChip, activeType === 'all' && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, activeType === 'all' && styles.filterChipTextActive]}>Բոլորը</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setActiveType('car'); clearAllFilters(); }} style={[styles.filterChip, activeType === 'car' && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, activeType === 'car' && styles.filterChipTextActive]}>🚗 Մեքենաներ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setActiveType('building'); clearAllFilters(); }} style={[styles.filterChip, activeType === 'building' && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, activeType === 'building' && styles.filterChipTextActive]}>🏢 Անշարժ Գույք</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  {/* Category buttons */}
                  <TouchableOpacity onPress={() => setActiveCategory('all')} style={[styles.filterChip, activeCategory === 'all' && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, activeCategory === 'all' && styles.filterChipTextActive]}>Բոլոր գործարքները</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveCategory('rent')} style={[styles.filterChip, activeCategory === 'rent' && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, activeCategory === 'rent' && styles.filterChipTextActive]}>Վարձակալություն</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveCategory('buy')} style={[styles.filterChip, activeCategory === 'buy' && styles.filterChipActive]}>
                    <Text style={[styles.filterChipText, activeCategory === 'buy' && styles.filterChipTextActive]}>Վաճառք</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              {/* SPECIFIC REFINEMENT FILTERS (AUTOMOBILE / BUILDING SPECIALTY) */}
              {activeType !== 'all' && (
                <View style={styles.specsFiltersBox}>
                  <View style={styles.specsFiltersHeader}>
                    <Text style={styles.specsFiltersTitle}>Լրացուցիչ Ֆիլտրեր</Text>
                    <TouchableOpacity onPress={clearAllFilters}>
                      <Text style={styles.clearFilterText}>Մաքրել բոլորը</Text>
                    </TouchableOpacity>
                  </View>

                  {activeType === 'car' ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specsScroll}>
                      {/* Car Brand picker */}
                      <View style={styles.pickerWrapper}>
                        <Text style={styles.pickerLabel}>Մակնիշ</Text>
                        <ScrollView style={styles.dropdownMini}>
                          {['all', 'BMW', 'Mercedes', 'Audi', 'Porsche', 'Tesla'].map((b) => (
                            <TouchableOpacity key={b} onPress={() => setFilterCarModel(b)} style={[styles.dropdownItem, filterCarModel === b && styles.dropdownItemActive]}>
                              <Text style={styles.dropdownItemText}>{b === 'all' ? 'Բոլորը' : b}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Engine size min */}
                      <View style={styles.pickerWrapper}>
                        <Text style={styles.pickerLabel}>Շարժիչ (L+)</Text>
                        <ScrollView style={styles.dropdownMini}>
                          {['all', '1.6', '2.0', '3.0', '4.0'].map((e) => (
                            <TouchableOpacity key={e} onPress={() => setFilterCarEngineMin(e)} style={[styles.dropdownItem, filterCarEngineMin === e && styles.dropdownItemActive]}>
                              <Text style={styles.dropdownItemText}>{e === 'all' ? 'Բոլորը' : e + ' L+'}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Color */}
                      <View style={styles.pickerWrapper}>
                        <Text style={styles.pickerLabel}>Գույն</Text>
                        <ScrollView style={styles.dropdownMini}>
                          {['all', 'Black', 'White', 'Gray', 'Blue', 'Red'].map((c) => (
                            <TouchableOpacity key={c} onPress={() => setFilterCarColor(c)} style={[styles.dropdownItem, filterCarColor === c && styles.dropdownItemActive]}>
                              <Text style={styles.dropdownItemText}>{c === 'all' ? 'Բոլորը' : c}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Body Style */}
                      <View style={styles.pickerWrapper}>
                        <Text style={styles.pickerLabel}>Թափք</Text>
                        <ScrollView style={styles.dropdownMini}>
                          {['all', 'Sedan', 'SUV', 'Coupe', 'Convertible'].map((b) => (
                            <TouchableOpacity key={b} onPress={() => setFilterCarBody(b)} style={[styles.dropdownItem, filterCarBody === b && styles.dropdownItemActive]}>
                              <Text style={styles.dropdownItemText}>{b === 'all' ? 'Բոլորը' : b}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </ScrollView>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specsScroll}>
                      {/* Property Type */}
                      <View style={styles.pickerWrapper}>
                        <Text style={styles.pickerLabel}>Գույքի Տեսակ</Text>
                        <ScrollView style={styles.dropdownMini}>
                          {['all', 'Apartment', 'Penthouse', 'Villa', 'House'].map((t) => (
                            <TouchableOpacity key={t} onPress={() => setFilterBuildingType(t)} style={[styles.dropdownItem, filterBuildingType === t && styles.dropdownItemActive]}>
                              <Text style={styles.dropdownItemText}>{t === 'all' ? 'Բոլորը' : t}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Bedrooms */}
                      <View style={styles.pickerWrapper}>
                        <Text style={styles.pickerLabel}>Ննջասենյակներ</Text>
                        <ScrollView style={styles.dropdownMini}>
                          {['all', '1', '2', '3', '4', '5+'].map((b) => (
                            <TouchableOpacity key={b} onPress={() => setFilterBuildingBedrooms(b)} style={[styles.dropdownItem, filterBuildingBedrooms === b && styles.dropdownItemActive]}>
                              <Text style={styles.dropdownItemText}>{b === 'all' ? 'Բոլորը' : b}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      {/* Floor */}
                      <View style={styles.pickerWrapper}>
                        <Text style={styles.pickerLabel}>Հարկ</Text>
                        <ScrollView style={styles.dropdownMini}>
                          {['all', '1', '2', '3', '5', '10+'].map((f) => (
                            <TouchableOpacity key={f} onPress={() => setFilterBuildingFloor(f)} style={[styles.dropdownItem, filterBuildingFloor === f && styles.dropdownItemActive]}>
                              <Text style={styles.dropdownItemText}>{f === 'all' ? 'Բոլորը' : f}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </ScrollView>
                  )}
                </View>
              )}

              {/* LISTINGS STREAM */}
              <FlatList
                data={filteredListings}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listingsScroll}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setDetailListing(item)} style={styles.listingCard}>
                    <Image
                      source={{ uri: item.image || "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800" }}
                      style={styles.listingImage}
                    />
                    
                    {/* Tags */}
                    <View style={styles.cardTags}>
                      <View style={[styles.tagBadge, item.category === 'rent' ? styles.tagRent : styles.tagBuy]}>
                        <Text style={styles.tagBadgeText}>{item.category === 'rent' ? 'Վարձույթ' : 'Վաճառք'}</Text>
                      </View>
                      <View style={[styles.tagBadge, styles.tagType]}>
                        <Text style={styles.tagBadgeText}>{item.type === 'car' ? 'Մեքենա' : 'Անշարժ գույք'}</Text>
                      </View>
                    </View>

                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <View style={styles.cardRow}>
                        <Feather name="map-pin" size={12} color="#777" />
                        <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
                      </View>
                      
                      {/* Specs summaries inside the card */}
                      {item.specs && (
                        <View style={styles.cardSpecsRow}>
                          {Object.entries(item.specs).slice(0, 3).map(([key, val]) => (
                            <View key={key} style={styles.specMiniBadge}>
                              <Text style={styles.specMiniBadgeText}>{key}: {val}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.cardFooter}>
                        <Text style={styles.cardPrice}>${item.price.toLocaleString()}</Text>
                        <Text style={styles.authorLabel}>Հեղինակ՝ {item.authorName}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="info" size={40} color="#999" />
                    <Text style={styles.emptyText}>Համապատասխան հայտարարություններ չեն գտնվել:</Text>
                  </View>
                }
              />

              {/* FLOATING ACTION BUTTON (ADD LISTING) */}
              {user && (
                <TouchableOpacity onPress={() => setAddModalOpen(true)} style={styles.fab}>
                  <Feather name="plus" size={24} color="#111" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* =========================================
              VIEW: CONCIERGE SERVICES
              ========================================= */}
          {currentTab === 'services' && (
            <ScrollView contentContainerStyle={styles.servicesContainer}>
              <View style={styles.servicesHeader}>
                <Text style={styles.servicesMainTitle}>Elite Concierge Ծառայություններ</Text>
                <Text style={styles.servicesSub}>Մենք ապահովում ենք ամենաբարձր կարգի անհատական սպասարկում և աջակցություն։</Text>
              </View>

              {SERVICES.map((srv) => (
                <View key={srv.id} style={styles.serviceCard}>
                  <Image source={{ uri: srv.image }} style={styles.serviceImage} />
                  <View style={styles.serviceOverlay} />
                  <View style={styles.serviceCardContent}>
                    <Text style={styles.serviceCardTitle}>{srv.title}</Text>
                    <Text style={styles.serviceCardSubtitle}>{srv.subtitle}</Text>
                    <Text style={styles.serviceCardDesc}>{srv.description}</Text>
                    <TouchableOpacity 
                      onPress={() => setConciergeModalService(srv)} 
                      style={styles.serviceBookBtn}
                    >
                      <Text style={styles.serviceBookBtnText}>Պատվիրել հիմա</Text>
                      <Feather name="chevron-right" size={14} color="#111" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* =========================================
              VIEW: SUPPORT / HELPDESK
              ========================================= */}
          {currentTab === 'support' && (
            <ScrollView contentContainerStyle={styles.supportContainer}>
              <Text style={styles.sectionHeading}>Հաճախակի տրվող հարցեր (FAQ)</Text>
              
              {/* FAQ Accordions */}
              {FAQS.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => setOpenFaqIndex(isOpen ? null : index)}
                    style={styles.faqCard}
                  >
                    <View style={styles.faqQuestionRow}>
                      <Text style={styles.faqQuestion}>{faq.q}</Text>
                      <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#f59e0b" />
                    </View>
                    {isOpen && (
                      <Text style={styles.faqAnswer}>{faq.a}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Submit a Support Ticket Ticket */}
              <View style={styles.ticketBox}>
                <Text style={styles.ticketBoxTitle}>Բացել Աջակցության Տոմս</Text>
                <Text style={styles.ticketBoxSub}>Ունեք լրացուցիչ հարցեր կամ տեխնիկական խնդիրնե՞ր։ Գրեք մեզ։</Text>

                <Text style={styles.inputLabel}>Կատեգորիա</Text>
                <View style={styles.ticketSelectRow}>
                  {['General', 'Technical', 'Payment', 'Verification'].map((cat) => (
                    <TouchableOpacity 
                      key={cat} 
                      onPress={() => setTicketCategory(cat)}
                      style={[styles.catChip, ticketCategory === cat && styles.catChipActive]}
                    >
                      <Text style={[styles.catChipText, ticketCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Վերնագիր</Text>
                <TextInput
                  style={styles.ticketInput}
                  placeholder="օր. Փաստաթղթերի վավերացում"
                  placeholderTextColor="#999"
                  value={ticketSubject}
                  onChangeText={setTicketSubject}
                />

                <Text style={styles.inputLabel}>Հաղորդագրություն</Text>
                <TextInput
                  style={[styles.ticketInput, styles.ticketInputArea]}
                  placeholder="Մանրամասն ներկայացրեք Ձեր խնդիրը..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={ticketMessage}
                  onChangeText={setTicketMessage}
                />

                <TouchableOpacity 
                  onPress={handleSubmitTicket} 
                  style={styles.submitTicketBtn}
                  disabled={isSubmittingTicket}
                >
                  {isSubmittingTicket ? (
                    <ActivityIndicator size="small" color="#111" />
                  ) : (
                    <>
                      <Feather name="send" size={16} color="#111" />
                      <Text style={styles.submitTicketBtnText}>Ուղարկել Հայտը</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {/* =========================================
              VIEW: PROFILE / MY LISTINGS
              ========================================= */}
          {currentTab === 'profile' && (
            <ScrollView contentContainerStyle={styles.profileContainer}>
              {!user ? (
                /* Auth Flow Screens */
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                  <View style={styles.authBox}>
                    <Text style={styles.authTitle}>{isSignUp ? "Ստեղծել Պրոֆիլ" : "Մուտք Գործել"}</Text>
                    <Text style={styles.authSubtitle}>
                      {isSignUp ? "Բացահայտեք UrbanAm-ի բոլոր հնարավորությունները" : "Լրացրեք տվյալները համակարգ մուտք գործելու համար"}
                    </Text>

                    {isSignUp && (
                      <View style={styles.authField}>
                        <Text style={styles.inputLabel}>Անուն Ազգանուն</Text>
                        <TextInput
                          style={styles.authInput}
                          placeholder="օր. Արամ Կարապետյան"
                          placeholderTextColor="#999"
                          value={authDisplayName}
                          onChangeText={setAuthDisplayName}
                        />
                      </View>
                    )}

                    <View style={styles.authField}>
                      <Text style={styles.inputLabel}>Էլ. Փոստ (Email)</Text>
                      <TextInput
                        style={styles.authInput}
                        placeholder="example@mail.ru"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={authEmail}
                        onChangeText={setAuthEmail}
                      />
                    </View>

                    <View style={styles.authField}>
                      <Text style={styles.inputLabel}>Գաղտնաբառ (Password)</Text>
                      <TextInput
                        style={styles.authInput}
                        placeholder="******"
                        placeholderTextColor="#999"
                        secureTextEntry
                        value={authPassword}
                        onChangeText={setAuthPassword}
                      />
                    </View>

                    <TouchableOpacity onPress={handleAuth} style={styles.authBtn} disabled={authLoading}>
                      {authLoading ? (
                        <ActivityIndicator color="#111" />
                      ) : (
                        <Text style={styles.authBtnText}>{isSignUp ? "Գրանցվել" : "Մուտք Գործել"}</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.authToggle}>
                      <Text style={styles.authToggleText}>
                        {isSignUp ? "Արդեն ունե՞ք հաշիվ։ Մուտք գործեք" : "Չունե՞ք հաշիվ։ Գրանցվեք այստեղ"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </KeyboardAvoidingView>
              ) : (
                /* Authenticated User Profile view and My Listings List */
                <View style={{ width: '100%' }}>
                  <View style={styles.profileCard}>
                    <View style={styles.profileAvatar}>
                      <Text style={styles.profileAvatarLetter}>{(user.displayName || user.email || 'U')[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.profileName}>{user.displayName || 'Օգտատեր'}</Text>
                    <Text style={styles.profileEmail}>{user.email}</Text>
                    
                    <View style={styles.badgeRow}>
                      <View style={styles.profileBadgeVIP}>
                        <MaterialCommunityIcons name="crown" size={12} color="#111" />
                        <Text style={styles.profileBadgeVIPText}>Elite Member</Text>
                      </View>
                    </View>

                    <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
                      <Feather name="log-out" size={14} color="#ef4444" />
                      <Text style={styles.signOutBtnText}>Դուրս Գալ</Text>
                    </TouchableOpacity>
                  </View>

                  {/* USER LISTINGS SECTION (NO MORE LOST LISTINGS!) */}
                  <View style={styles.myListingsBox}>
                    <Text style={styles.myListingsTitle}>Իմ հայտարարությունները (My Listings)</Text>
                    <Text style={styles.myListingsSub}>Այստեղ կարող եք արագ գտնել, խմբագրել կամ ջնջել ձեր տեղադրած առաջարկները։</Text>

                    {listings.filter(x => x.authorId === user.uid).length === 0 ? (
                      <View style={styles.emptyMyListings}>
                        <Feather name="file-text" size={32} color="#999" />
                        <Text style={styles.emptyMyListingsText}>Դուք դեռևս չունեք տեղադրած հայտարարություններ:</Text>
                        <TouchableOpacity onPress={() => setAddModalOpen(true)} style={styles.createFirstBtn}>
                          <Text style={styles.createFirstBtnText}>Տեղադրել առաջինը</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      listings.filter(x => x.authorId === user.uid).map((item) => (
                        <View key={item.id} style={styles.myListingItem}>
                          <Image source={{ uri: item.image }} style={styles.myListingThumb} />
                          <View style={styles.myListingInfo}>
                            <Text style={styles.myListingTitleText} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.myListingPrice}>${item.price.toLocaleString()}</Text>
                            <Text style={styles.myListingType}>{item.type === 'car' ? '🚗 Automobile' : '🏢 Real Estate'}</Text>
                          </View>
                          <View style={styles.myListingActions}>
                            <TouchableOpacity onPress={() => setEditingListing(item)} style={[styles.actionBtn, styles.editAction]}>
                              <Feather name="edit-2" size={12} color="#f59e0b" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteListing(item.id)} style={[styles.actionBtn, styles.deleteAction]}>
                              <Feather name="trash-2" size={12} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          )}

        </View>
      </View>

      {/* =========================================
          MODAL: ADD LISTING
          ========================================= */}
      <Modal visible={addModalOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Ավելացնել հայտարարություն</Text>
              <TouchableOpacity onPress={() => setAddModalOpen(false)}>
                <Feather name="x" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody}>
              {/* Type selector */}
              <Text style={styles.inputLabel}>Տեսակը (Type)</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity 
                  onPress={() => setAddType('car')}
                  style={[styles.typeSelectChip, addType === 'car' && styles.typeSelectChipActive]}
                >
                  <Text style={[styles.typeSelectChipText, addType === 'car' && styles.typeSelectChipTextActive]}>🚗 Մեքենա</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setAddType('building')}
                  style={[styles.typeSelectChip, addType === 'building' && styles.typeSelectChipActive]}
                >
                  <Text style={[styles.typeSelectChipText, addType === 'building' && styles.typeSelectChipTextActive]}>🏢 Անշարժ գույք</Text>
                </TouchableOpacity>
              </View>

              {/* Category selector */}
              <Text style={styles.inputLabel}>Գործարք (Category)</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity 
                  onPress={() => setAddCategory('buy')}
                  style={[styles.typeSelectChip, addCategory === 'buy' && styles.typeSelectChipActive]}
                >
                  <Text style={[styles.typeSelectChipText, addCategory === 'buy' && styles.typeSelectChipTextActive]}>Վաճառք (Purchase)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setAddCategory('rent')}
                  style={[styles.typeSelectChip, addCategory === 'rent' && styles.typeSelectChipActive]}
                >
                  <Text style={[styles.typeSelectChipText, addCategory === 'rent' && styles.typeSelectChipTextActive]}>Վարձակալություն (Rent)</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Անվանում / Մոդել (Title) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="օր. Porsche 911 GT3 RS կամ Cascade Penthouse"
                placeholderTextColor="#999"
                value={addTitle}
                onChangeText={setAddTitle}
              />

              <View style={styles.inputDoubleRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Գին (USD) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="250000"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={addPrice}
                    onChangeText={setAddPrice}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Հասցե / Լոկացիա *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Երևան, Հայաստան"
                    placeholderTextColor="#999"
                    value={addLocation}
                    onChangeText={setAddLocation}
                  />
                </View>
              </View>

              {/* CUSTOM SPECS ACCORDING TO THE TYPE */}
              {addType === 'car' ? (
                <View style={styles.specsFormGroup}>
                  <Text style={styles.specsGroupHeading}>Մեքենայի Տվյալներ</Text>

                  <Text style={styles.inputLabel}>Մակնիշ / Մոդել</Text>
                  <View style={styles.specInlineSelector}>
                    {['BMW', 'Mercedes', 'Audi', 'Porsche', 'Tesla', 'Other'].map((b) => (
                      <TouchableOpacity key={b} onPress={() => setSpecCarModel(b)} style={[styles.inlineChip, specCarModel === b && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, specCarModel === b && styles.inlineChipTextActive]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Շարժիչի ծավալ (օր. 3.0)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="3.0"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={specCarEngine}
                    onChangeText={setSpecCarEngine}
                  />

                  <Text style={styles.inputLabel}>Գույն</Text>
                  <View style={styles.specInlineSelector}>
                    {['Black', 'White', 'Gray', 'Blue', 'Red'].map((c) => (
                      <TouchableOpacity key={c} onPress={() => setSpecCarColor(c)} style={[styles.inlineChip, specCarColor === c && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, specCarColor === c && styles.inlineChipTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Թափք</Text>
                  <View style={styles.specInlineSelector}>
                    {['Sedan', 'SUV', 'Coupe', 'Convertible'].map((b) => (
                      <TouchableOpacity key={b} onPress={() => setSpecCarBody(b)} style={[styles.inlineChip, specCarBody === b && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, specCarBody === b && styles.inlineChipTextActive]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Փոխանցման տուփ</Text>
                  <View style={styles.specInlineSelector}>
                    {['Automatic', 'Manual'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setSpecCarTransmission(t)} style={[styles.inlineChip, specCarTransmission === t && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, specCarTransmission === t && styles.inlineChipTextActive]}>{t === 'Automatic' ? 'Ավտոմատ' : 'Մեխանիկական'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.specsFormGroup}>
                  <Text style={styles.specsGroupHeading}>Անշարժ Գույքի Տվյալներ</Text>

                  <Text style={styles.inputLabel}>Գույքի տեսակ</Text>
                  <View style={styles.specInlineSelector}>
                    {['Apartment', 'Penthouse', 'Villa', 'House', 'Office'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setSpecBuildingType(t)} style={[styles.inlineChip, specBuildingType === t && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, specBuildingType === t && styles.inlineChipTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Ննջասենյակներ</Text>
                  <View style={styles.specInlineSelector}>
                    {['1', '2', '3', '4', '5+'].map((b) => (
                      <TouchableOpacity key={b} onPress={() => setSpecBuildingBedrooms(b)} style={[styles.inlineChip, specBuildingBedrooms === b && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, specBuildingBedrooms === b && styles.inlineChipTextActive]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Մակերես (քմ / sqft)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="1500"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={specBuildingSize}
                    onChangeText={setSpecBuildingSize}
                  />

                  <Text style={styles.inputLabel}>Հարկ</Text>
                  <View style={styles.specInlineSelector}>
                    {['1', '2', '3', '4', '5', '8', '10+'].map((f) => (
                      <TouchableOpacity key={f} onPress={() => setSpecBuildingFloor(f)} style={[styles.inlineChip, specBuildingFloor === f && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, specBuildingFloor === f && styles.inlineChipTextActive]}>{f}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Նկարի հասցե (Image URL)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="https://..."
                placeholderTextColor="#999"
                value={addImage}
                onChangeText={setAddImage}
              />

              <Text style={styles.inputLabel}>Լրացուցիչ նկարագրություն</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputArea]}
                placeholder="Ներկայացրեք գույքի կամ մեքենայի առավելությունները..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                value={addDescription}
                onChangeText={setAddDescription}
              />

              <TouchableOpacity 
                onPress={handleCreateListing} 
                style={styles.modalSubmitBtn}
                disabled={isSubmittingListing}
              >
                {isSubmittingListing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Տեղադրել Հայտարարությունը</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* =========================================
          MODAL: EDIT LISTING
          ========================================= */}
      <Modal visible={editingListing !== null} animationType="slide" transparent>
        <SafeAreaView style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Խմբագրել հայտարարությունը</Text>
              <TouchableOpacity onPress={() => setEditingListing(null)}>
                <Feather name="x" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody}>
              <Text style={styles.inputLabel}>Տեսակը (Type)</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity 
                  onPress={() => setEditType('car')}
                  style={[styles.typeSelectChip, editType === 'car' && styles.typeSelectChipActive]}
                >
                  <Text style={[styles.typeSelectChipText, editType === 'car' && styles.typeSelectChipTextActive]}>🚗 Մեքենա</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setEditType('building')}
                  style={[styles.typeSelectChip, editType === 'building' && styles.typeSelectChipActive]}
                >
                  <Text style={[styles.typeSelectChipText, editType === 'building' && styles.typeSelectChipTextActive]}>🏢 Անշարժ գույք</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Գործարք (Category)</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity 
                  onPress={() => setEditCategory('buy')}
                  style={[styles.typeSelectChip, editCategory === 'buy' && styles.typeSelectChipActive]}
                >
                  <Text style={[styles.typeSelectChipText, editCategory === 'buy' && styles.typeSelectChipTextActive]}>Վաճառք</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setEditCategory('rent')}
                  style={[styles.typeSelectChip, editCategory === 'rent' && styles.typeSelectChipActive]}
                >
                  <Text style={[styles.typeSelectChipText, editCategory === 'rent' && styles.typeSelectChipTextActive]}>Վարձակալություն</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Անվանում / Մոդել (Title)</Text>
              <TextInput
                style={styles.modalInput}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <View style={styles.inputDoubleRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Գին (USD)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={editPrice}
                    onChangeText={setEditPrice}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Հասցե / Լոկացիա</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editLocation}
                    onChangeText={setEditLocation}
                  />
                </View>
              </View>

              {/* EDITING DYNAMIC SPECS */}
              {editType === 'car' ? (
                <View style={styles.specsFormGroup}>
                  <Text style={styles.specsGroupHeading}>Մեքենայի Տվյալներ</Text>

                  <Text style={styles.inputLabel}>Մակնիշ / Մոդել</Text>
                  <View style={styles.specInlineSelector}>
                    {['BMW', 'Mercedes', 'Audi', 'Porsche', 'Tesla', 'Other'].map((b) => (
                      <TouchableOpacity key={b} onPress={() => setEditCarModel(b)} style={[styles.inlineChip, editCarModel === b && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, editCarModel === b && styles.inlineChipTextActive]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Շարժիչի ծավալ (օր. 3.0)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={editCarEngine}
                    onChangeText={setEditCarEngine}
                  />

                  <Text style={styles.inputLabel}>Գույն</Text>
                  <View style={styles.specInlineSelector}>
                    {['Black', 'White', 'Gray', 'Blue', 'Red'].map((c) => (
                      <TouchableOpacity key={c} onPress={() => setEditCarColor(c)} style={[styles.inlineChip, editCarColor === c && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, editCarColor === c && styles.inlineChipTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Թափք</Text>
                  <View style={styles.specInlineSelector}>
                    {['Sedan', 'SUV', 'Coupe', 'Convertible'].map((b) => (
                      <TouchableOpacity key={b} onPress={() => setEditCarBody(b)} style={[styles.inlineChip, editCarBody === b && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, editCarBody === b && styles.inlineChipTextActive]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Փոխանցման տուփ</Text>
                  <View style={styles.specInlineSelector}>
                    {['Automatic', 'Manual'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setEditCarTransmission(t)} style={[styles.inlineChip, editCarTransmission === t && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, editCarTransmission === t && styles.inlineChipTextActive]}>{t === 'Automatic' ? 'Ավտոմատ' : 'Մեխանիկական'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.specsFormGroup}>
                  <Text style={styles.specsGroupHeading}>Անշարժ Գույքի Տվյալներ</Text>

                  <Text style={styles.inputLabel}>Գույքի տեսակ</Text>
                  <View style={styles.specInlineSelector}>
                    {['Apartment', 'Penthouse', 'Villa', 'House', 'Office'].map((t) => (
                      <TouchableOpacity key={t} onPress={() => setEditBuildingType(t)} style={[styles.inlineChip, editBuildingType === t && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, editBuildingType === t && styles.inlineChipTextActive]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Ննջասենյակներ</Text>
                  <View style={styles.specInlineSelector}>
                    {['1', '2', '3', '4', '5+'].map((b) => (
                      <TouchableOpacity key={b} onPress={() => setEditBuildingBedrooms(b)} style={[styles.inlineChip, editBuildingBedrooms === b && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, editBuildingBedrooms === b && styles.inlineChipTextActive]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Մակերես (քմ / sqft)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={editBuildingSize}
                    onChangeText={setEditBuildingSize}
                  />

                  <Text style={styles.inputLabel}>Հարկ</Text>
                  <View style={styles.specInlineSelector}>
                    {['1', '2', '3', '4', '5', '8', '10+'].map((f) => (
                      <TouchableOpacity key={f} onPress={() => setEditBuildingFloor(f)} style={[styles.inlineChip, editBuildingFloor === f && styles.inlineChipActive]}>
                        <Text style={[styles.inlineChipText, editBuildingFloor === f && styles.inlineChipTextActive]}>{f}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Նկարի հասցե (Image URL)</Text>
              <TextInput
                style={styles.modalInput}
                value={editImage}
                onChangeText={setEditImage}
              />

              <Text style={styles.inputLabel}>Լրացուցիչ նկարագրություն</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputArea]}
                multiline
                numberOfLines={4}
                value={editDescription}
                onChangeText={setEditDescription}
              />

              <TouchableOpacity 
                onPress={handleUpdateListing} 
                style={styles.modalSubmitBtn}
                disabled={isSubmittingListing}
              >
                {isSubmittingListing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Պահպանել Փոփոխությունները</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* =========================================
          MODAL: DETAIL DISPLAY & BOOK CONCIERGE
          ========================================= */}
      <Modal visible={detailListing !== null} animationType="slide" transparent>
        <SafeAreaView style={styles.modalBg}>
          {detailListing && (
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>{detailListing.title}</Text>
                <TouchableOpacity onPress={() => setDetailListing(null)}>
                  <Feather name="x" size={24} color="#111" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScrollBody}>
                <Image 
                  source={{ uri: detailListing.image || "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800" }} 
                  style={styles.detailModalImage} 
                />

                <View style={styles.detailInfoBox}>
                  <View style={styles.detailPriceRow}>
                    <Text style={styles.detailPrice}>${detailListing.price.toLocaleString()}</Text>
                    <View style={[styles.tagBadge, detailListing.category === 'rent' ? styles.tagRent : styles.tagBuy]}>
                      <Text style={styles.tagBadgeText}>{detailListing.category === 'rent' ? 'Վարձույթ' : 'Վաճառք'}</Text>
                    </View>
                  </View>

                  <View style={styles.detailLocationRow}>
                    <Feather name="map-pin" size={14} color="#f59e0b" />
                    <Text style={styles.detailLocation}>{detailListing.location}</Text>
                  </View>

                  <Text style={styles.detailDescriptionLabel}>Լրացուցիչ տվյալներ (Specifications)</Text>
                  {detailListing.specs && (
                    <View style={styles.detailSpecsContainer}>
                      {Object.entries(detailListing.specs).map(([key, value]) => (
                        <View key={key} style={styles.detailSpecRow}>
                          <Text style={styles.detailSpecKey}>{key}:</Text>
                          <Text style={styles.detailSpecValue}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles.detailDescriptionLabel}>Նկարագրություն</Text>
                  <Text style={styles.detailDescription}>{detailListing.description || "Նկարագրություն չի տրամադրվել:"}</Text>

                  <Text style={styles.authorLabelLarge}>Տեղադրող՝ {detailListing.authorName}</Text>

                  {/* DIRECT BUTTON TO BOOK CONCIERGE ASSISTANCE */}
                  <TouchableOpacity 
                    onPress={() => {
                      setConciergeModalService({
                        id: `listing_inquiry_${detailListing.id}`,
                        title: `Հարցում: ${detailListing.title}`
                      });
                    }}
                    style={styles.directConciergeBtn}
                  >
                    <MaterialCommunityIcons name="star-ring" size={18} color="#111" />
                    <Text style={styles.directConciergeBtnText}>Պատվիրել գնման/վարձույթի աջակցություն</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* =========================================
          MODAL: BOOK CONCIERGE SERVICE
          ========================================= */}
      <Modal visible={conciergeModalService !== null} animationType="fade" transparent>
        <SafeAreaView style={styles.modalBg}>
          {conciergeModalService && (
            <View style={styles.smallModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderTitle} numberOfLines={1}>{conciergeModalService.title}</Text>
                <TouchableOpacity onPress={() => setConciergeModalService(null)}>
                  <Feather name="x" size={24} color="#111" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.smallModalBody}>
                <Text style={styles.conciergeFormSubtitle}>
                  Խնդրում ենք լրացնել Ձեր նախասիրությունները կամ պահանջները: Մեր անձնական մենեջերը կկապնվի Ձեզ հետ:
                </Text>

                <Text style={styles.inputLabel}>Լրացուցիչ պահանջներ / Նշումներ</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputArea]}
                  placeholder="օր. Դիմավորել օդանավակայանում ժամը 14:00-ին, ցանկալի է սև գույնի..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  value={bookingNotes}
                  onChangeText={setBookingNotes}
                />

                <TouchableOpacity 
                  onPress={handleBookConcierge} 
                  style={styles.modalSubmitBtn}
                  disabled={isBookingSubmitting}
                >
                  {isBookingSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Հաստատել Պատվերը</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// ==========================================
// STYLESHEET DESIGN
// ==========================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111111',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#111111',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b20',
  },
  headerSub: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'normal',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 2,
  },
  avatarButton: {
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 22,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#111111',
    fontWeight: '900',
    fontSize: 16,
  },
  loginHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff15',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  loginHeaderBtnText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 3,
  },
  tabItemActive: {
    backgroundColor: '#f59e0b12',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#777777',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#111111',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#111111',
    fontWeight: 'bold',
  },
  filterRow: {
    marginTop: 10,
    marginBottom: 5,
  },
  horizontalScroll: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#e2e8f080',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#transparent',
  },
  filterChipActive: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },
  filterChipText: {
    fontSize: 11,
    color: '#555555',
    fontWeight: 'bold',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },
  specsFiltersBox: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  specsFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
    marginBottom: 8,
  },
  specsFiltersTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  clearFilterText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#d97706',
  },
  specsScroll: {
    alignItems: 'flex-start',
  },
  pickerWrapper: {
    marginRight: 15,
    width: 110,
  },
  pickerLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dropdownMini: {
    maxHeight: 70,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  dropdownItem: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  dropdownItemActive: {
    backgroundColor: '#f59e0b30',
  },
  dropdownItemText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
  },
  listingsScroll: {
    padding: 15,
    paddingBottom: 80,
  },
  listingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  listingImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e2e8f0',
  },
  cardTags: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  tagRent: {
    backgroundColor: '#fef3c7',
  },
  tagBuy: {
    backgroundColor: '#ecfdf5',
  },
  tagType: {
    backgroundColor: '#111111',
  },
  tagBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#111111',
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardLocation: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  cardSpecsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  specMiniBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  specMiniBadgeText: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#d97706',
  },
  authorLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#f59e0b',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  servicesContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  servicesHeader: {
    marginBottom: 20,
  },
  servicesMainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  servicesSub: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  serviceCard: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 200,
    marginBottom: 15,
    position: 'relative',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000cc',
  },
  serviceCardContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  serviceCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  serviceCardSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  serviceCardDesc: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 6,
    lineHeight: 15,
  },
  serviceBookBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceBookBtnText: {
    color: '#111111',
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 4,
  },
  supportContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 10,
    lineHeight: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  ticketBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ticketBoxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  ticketBoxSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  ticketSelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  catChipActive: {
    backgroundColor: '#f59e0b',
  },
  catChipText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 'bold',
  },
  catChipTextActive: {
    color: '#111111',
  },
  ticketInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#111111',
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  ticketInputArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitTicketBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  submitTicketBtnText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  profileContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  authBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  authTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111111',
  },
  authSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 15,
  },
  authField: {
    marginBottom: 12,
  },
  authInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#111111',
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  authBtn: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  authBtnText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: 'bold',
  },
  authToggle: {
    alignItems: 'center',
    marginTop: 15,
  },
  authToggleText: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: 'bold',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileAvatarLetter: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  profileBadgeVIP: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileBadgeVIPText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#d97706',
    marginLeft: 4,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 15,
  },
  signOutBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  myListingsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  myListingsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  myListingsSub: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 15,
  },
  emptyMyListings: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyMyListingsText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
  },
  createFirstBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  createFirstBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111111',
  },
  myListingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  myListingThumb: {
    width: 60,
    height: 45,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  myListingInfo: {
    flex: 1,
    marginLeft: 10,
  },
  myListingTitleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111111',
  },
  myListingPrice: {
    fontSize: 10,
    fontWeight: '900',
    color: '#d97706',
    marginTop: 2,
  },
  myListingType: {
    fontSize: 8,
    color: '#94a3b8',
    fontWeight: 'bold',
    marginTop: 1,
  },
  myListingActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  editAction: {
    backgroundColor: '#fffbeb',
  },
  deleteAction: {
    backgroundColor: '#fef2f2',
  },
  modalBg: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    marginTop: 50,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  smallModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  smallModalBody: {
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111111',
    flex: 1,
    marginRight: 10,
  },
  modalScrollBody: {
    padding: 20,
    paddingBottom: 60,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  typeSelectChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeSelectChipActive: {
    backgroundColor: '#111111',
  },
  typeSelectChipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  typeSelectChipTextActive: {
    color: '#ffffff',
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#111111',
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  modalInputArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputDoubleRow: {
    flexDirection: 'row',
  },
  specsFormGroup: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  specsGroupHeading: {
    fontSize: 10,
    fontWeight: '900',
    color: '#d97706',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  specInlineSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  inlineChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inlineChipActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  inlineChipText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 'bold',
  },
  inlineChipTextActive: {
    color: '#111111',
  },
  modalSubmitBtn: {
    backgroundColor: '#111111',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailModalImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#cbd5e1',
  },
  detailInfoBox: {
    padding: 20,
  },
  detailPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#d97706',
  },
  detailLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  detailLocation: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  detailDescriptionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 6,
  },
  detailSpecsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailSpecRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailSpecKey: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 'bold',
  },
  detailSpecValue: {
    fontSize: 11,
    color: '#1e293b',
    fontWeight: '900',
  },
  detailDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  authorLabelLarge: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 'bold',
    marginTop: 15,
  },
  directConciergeBtn: {
    backgroundColor: '#f59e0b1c',
    borderWidth: 1,
    borderColor: '#f59e0b3c',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 20,
  },
  directConciergeBtnText: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  conciergeFormSubtitle: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
    marginBottom: 15,
  },
});
