# FitSync: Yapay Zeka Destekli Diyet ve Spor Takip Uygulaması 

**Ankara Üniversitesi Mühendislik Fakültesi - Bilgisayar Mühendisliği Bölümü** 
**Ders:** BLM4538 IOS ile Mobil Uygulama Geliştirme II 
**Geliştirici:** Ömer Doğan (22290528)  | [GitHub](https://github.com/bycycomr) 

---

## 🚀 Proje Amacı

Bu projenin temel amacı; kullanıcıların fiziksel özelliklerini (yaş, boy, kilo vb.), kişisel hedeflerini ve mevcut sağlık kısıtlamalarını diyalog tabanlı bir sohbet arayüzü üzerinden analiz ederek tamamen kişiselleştirilmiş ve dinamik spor/diyet programları sunan yapay zeka destekli bir mobil uygulama geliştirmektir[cite: 11]. Uygulama, birbirinden bağımsız gibi görünen beslenme ve spor alışkanlıklarının tek bir yerden takip edilmesini kolaylaştırmayı hedefler[cite: 12].

## 🎯 Kapsam

### Kapsam Dahilinde Olanlar (In-Scope) [cite: 14]
- **Kimlik Doğrulaması:** Güvenli kayıt ve giriş işlemleri.
- **Akıllı Sohbet Arayüzü:** Doğal diyalog akışı içinde veri toplayan asistan.
- **İstem (Prompt) Yönetimi:** Toplanan verileri yapılandırıp LLM'e iletme.
- **Dinamik Program Üretimi:** Yapay zeka çıktısını (JSON) günlük takvim ve öğün kartları gibi UI bileşenlerine dönüştürme.
- **İlerleme Takibi:** Tamamlanan görevleri veritabanına kaydederek süreci görselleştirme.

### Kapsam Dışı Olanlar (Out-of-Scope) 
- Gerçek zamanlı doktor veya diyetisyen görüşmeleri.
- Giyilebilir cihaz (Akıllı saat, Apple Health vb.) anlık sağlık verisi entegrasyonu.
- Uygulama içi e-ticaret (supplement/ekipman satışı).

## 🛠️ Teknoloji Yığını

Ayrı bir backend sunucusu kurmak yerine, sunucusuz (serverless) mimari tercih edilmiştir.

| Katman | Teknoloji | Kullanım Amacı |
|--------|-----------|----------------|
| **Frontend** | React Native & Expo | Çapraz platform iOS/Android mobil geliştirme  |
| **Navigasyon** | React Navigation | Ekranlar arası yönlendirme yönetimi  |
| **Sohbet UI** | React Native Gifted Chat | Özelleştirilebilir sohbet arayüzü bileşeni  |
| **State Yönetimi** | Zustand | Hafif ve hızlı global durum yönetimi  |
| **Veritabanı & Auth**| Firebase (Firestore & Auth) | Sunucusuz veri depolama ve kimlik doğrulama  |
| **API & Güvenlik** | Expo API Routes / Cloud Functions| API güvenliği ve aracı backend işlemleri  |
| **Yapay Zeka** | Gemini API (veya OpenAI API) | Doğal dil analizi ve yapılandırılmış JSON üretimi  |

## 📁 Proje Yapısı

```text
.
├── app/                        # Expo Router sayfaları ve API route'ları
│   ├── (tabs)/                 # Alt sekme navigasyonu (sohbet, planlar, profil)
│   ├── api/                    # Serverless endpoint iskeletleri
│   │   ├── chat+api.ts
│   │   └── plan+api.ts
│   ├── _layout.tsx             # Root layout
│   ├── disclaimer.tsx          # Feragatname ekranı
│   ├── index.tsx               # İlk yönlendirme
│   ├── login.tsx               # Giriş ekranı
│   └── register.tsx            # Kayıt ekranı
├── components/                 # Yeniden kullanılabilir UI bileşenleri (chat / plans / ui)
├── services/                   # API erişimi, auth stub, plan servisleri
├── store/                      # Zustand state yönetimi (user/chat/plan)
├── types/                      # Tip tanımları
├── utils/                      # Sabitler ve yardımcılar
├── assets/                     # Uygulama varlıkları
├── RAPOR.md                    # Haftalık rapor şablonları
├── app.json                    # Expo yapılandırması
├── package.json                # Uygulama bağımlılıkları ve scriptler
├── tsconfig.json               # TypeScript ayarları
├── README.md                   # Proje dokümantasyonu
└── legacy/                     # Eski backend/frontend ve önceki root package.json
	├── backend/
	├── frontend/
	├── docs/
	├── my-app/
	├── package.root.json
	└── package-lock.root.json
```
📅 Proje Yönetimi ve Haftalık Video Raporlama

Proje geliştirme süreci haftalık olarak belgelenecek ve detaylı teknik açıklamalar RAPOR.md dosyasına eklenecektir. Her hafta yapılan geliştirmeler, ekran tasarımları ve yapay zeka entegrasyonları 3-5 dakikalık videolarla anlatılacaktır.

⚠️ Önemli Uyarı

Bu uygulama yalnızca bilgilendirme amaçlıdır ve profesyonel tıbbi veya beslenme danışmanlığı yerine geçmez. Herhangi bir diyet veya egzersiz programına başlamadan önce mutlaka bir sağlık uzmanına danışın.

🚀 Başlangıç

Gereksinimler

- Node.js 18+
- npm veya yarn
- Expo CLI

Kurulum

```bash
npm install
npm start
```

> Eski Node backend/front-end kodu legacy/ dizininde arşivlendi. Gerekirse `cd legacy/backend && npm install && npm run dev` komutu ile ayrı sunucu olarak ayağa kaldırabilirsiniz.
