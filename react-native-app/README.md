# UrbanAm Premium - React Native Application
## 🇦🇲 Ինչպես գործարկել հավելվածը հեռախոսում (Expo-ի միջոցով)

Այս թղթապանակում գտնվում է UrbanAm Premium մարկետպլեյսի **100% նույնությամբ** պատրաստված **React Native (Expo)** տարբերակը։ Այն ներառում է ամբողջական ֆունկցիոնալությունը՝ ավտոմեքենաների և անշարժ գույքի ֆիլտրում, հայտարարության ավելացում դինամիկ տվյալներով, անձնական էջում սեփական հայտարարությունների խմբագրում/ջնջում, աջակցության տոմսերի ստեղծում և Concierge պատվերների ուղարկում Firestore։

### Քայլ 1: Ստեղծել նոր Expo նախագիծ
Բացեք Ձեր համակարգչի տերմինալը (Terminal) և գրեք հետևյալ հրամանը՝
```bash
npx create-expo-app urbanam-mobile --template blank-typescript
cd urbanam-mobile
```

### Քայլ 2: Տեղադրել անհրաժեշտ գրադարանները (Dependencies)
Տեղադրեք Firebase-ի և պատկերակների (icons) համար անհրաժեշտ փաթեթները՝
```bash
npx expo install firebase @expo/vector-icons
```

### Քայլ 3: Փոխարինել App.tsx ֆայլը
Պատճենեք `/react-native-app/App.tsx` ֆայլի ամբողջ պարունակությունը և տեղադրեք Ձեր նոր ստեղծված նախագծի `App.tsx` ֆայլի մեջ:

### Քայլ 4: Կարգավորել Firebase-ը
Բացեք Ձեր `App.tsx` ֆայլը և գտեք `firebaseConfig` փոփոխականը (տող 36): Փոխարինեք այնտեղի տվյալները Ձեր իրական Firebase Web App Config-ով, որը կարող եք գտնել Ձեր Firebase Console-ում:

### Քայլ 5: Գործարկել հավելվածը
Տերմինալում գրեք՝
```bash
npx expo start
```
Սկանավորեք QR կոդը Ձեր հեռախոսի **Expo Go** հավելվածով (ներբեռնեք App Store-ից կամ Google Play-ից) և վայելեք Ձեր շքեղ հավելվածը:

---

## 🇬🇧 How to Run the App on Your Phone (Using Expo)

This directory contains the **100% identical React Native (Expo) mobile version** of UrbanAm Premium. It is fully integrated with Firebase Auth and Firestore.

### Step 1: Create a New Expo Project
Run the following commands in your computer's terminal:
```bash
npx create-expo-app urbanam-mobile --template blank-typescript
cd urbanam-mobile
```

### Step 2: Install Required Dependencies
Install the required Firebase SDK and icons:
```bash
npx expo install firebase @expo/vector-icons
```

### Step 3: Replace App.tsx
Copy the contents of `/react-native-app/App.tsx` into your new project's `App.tsx`.

### Step 4: Configure Firebase
Open `App.tsx` and find the `firebaseConfig` object (line 36). Replace it with your actual Firebase Web Config credentials from the Firebase Console.

### Step 5: Start the Project
Run the following command in your terminal:
```bash
npx expo start
```
Download the **Expo Go** app on your iOS or Android phone, scan the QR code displayed in the terminal, and view the luxury marketplace live!
