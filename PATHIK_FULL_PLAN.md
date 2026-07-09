# Pathik — পূর্ণাঙ্গ প্রযুক্তিগত ও বাস্তবায়ন পরিকল্পনা

> **ভিশন:** বাংলাদেশের গণপরিবহন ব্যবহারকারীদের জন্য একটি AI-চালিত নিরাপত্তা প্ল্যাটফর্ম, যেখানে ইউজার শুধু পোস্ট করে, AI নিজেই সব ক্লাসিফিকেশন ও অ্যাকশন নেয়।

---

## সূচিপত্র

1. [সিস্টেম আর্কিটেকচার ওভারভিউ](#১-সিস্টেম-আর্কিটেকচার-ওভারভিউ)
2. [AI-চালিত সম্পূর্ণ সিস্টেম ফ্লো](#২-ai-চালিত-সম্পূর্ণ-সিস্টেম-ফ্লো)
3. [ডেটাবেস স্কিমা](#৩-ডেটাবেস-স্কিমা)
4. [API এন্ডপয়েন্ট লিস্ট ও ডেটা ফ্লো](#৪-api-এন্ডপয়েন্ট-লিস্ট-ও-ডেটা-ফ্লো)
5. [AI মডেল ট্রেনিং ও ডেপ্লয়মেন্ট পাইপলাইন](#৫-ai-মডেল-ট্রেনিং-ও-ডেপ্লয়মেন্ট-পাইপলাইন)
6. [অপব্যবহার প্রতিরোধ কৌশল](#৬-অপব্যবহার-প্রতিরোধ-কৌশল)
7. [প্রাইভেসি ও নৈতিকতা](#৭-প্রাইভেসি-ও-নৈতিকতা)
8. [প্রোটোটাইপ ডেভেলপমেন্ট রোডম্যাপ (৩ মাস)](#৮-প্রোটোটাইপ-ডেভেলপমেন্ট-রোডম্যাপ-৩-মাস)
9. [পিচ ডেক/উপস্থাপনার কাঠামো](#৯-পিচ-ডেকউপস্থাপনার-কাঠামো)

---

## ১. সিস্টেম আর্কিটেকচার ওভারভিউ

### 🏗️ হাইব্রিড ডেটাবেস আর্কিটেকচার (Supabase + MongoDB)

Pathik একটি **হাইব্রিড ডেটাবেস আর্কিটেকচার** ব্যবহার করে — যেখানে প্রতিটি ডেটা টাইপের জন্য সবচেয়ে উপযুক্ত ডেটাবেস বেছে নেওয়া হয়েছে:

| ডেটা টাইপ | ডেটাবেস | কারণ |
|-----------|---------|------|
| **Supabase (PostgreSQL)** — ট্রানজেকশনাল, জিও-স্পেশাল, রিয়েল-টাইম ডেটা | | |
| Users, FeedPosts, Alerts, Sightings, Votes, Notifications, AuditLogs | **Supabase** | ACID consistency, PostGIS (geo queries), Built-in Realtime, RLS, pgvector |
| **MongoDB** — ফ্লেক্সিবল স্কিমা, হাই-ভলিউম রাইট, AI মেটাডেটা | | |
| AI Metadata, Trust History, Clustering Cache, AI Processing Logs | **MongoDB** | Schema-less flexibility, High-volume append-only writes, TTL indexes |

### হাই-লেভেল আর্কিটেকচার ডায়াগ্রাম

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ক্লায়েন্ট লেয়ার                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────────┐  │
│  │ ওয়েব অ্যাপ (PWA)  │  │  ওয়েব অ্যাপ       │  │  অ্যাডমিন ড্যাশবোর্ড             │  │
│  │ (React + Vite +  │  │ (React/Vite)     │  │ (React + Leaflet Map)           │  │
│  │  PWA + Geo API)  │  │                  │  │                                  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────┬───────────────────┘  │
└───────────┼──────────────────────┼───────────────────────────┼──────────────────────┘
            │                      │                           │
            ▼                      ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         API গেটওয়ে (Nginx/Cloudflare)                                │
│                  Rate Limiting, SSL Termination, DDoS Protection                     │
└───────────────────────────────────┬─────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         ব্যাকএন্ড সার্ভার (Express.js + TypeScript)                   │
│                                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Auth     │ │ Feed     │ │ Community│ │ Transit  │ │ Emergency│ │ Admin        │ │
│  │ Module   │ │ Module   │ │ Module   │ │ Module   │ │ Module   │ │ Dashboard    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │
│                                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────────────────────┐   │
│  │ WebSocket│ │ Push     │ │ Geo-     │ │ AI Orchestrator (BullMQ Queue)       │   │
│  │ Server   │ │ Notif.   │ │ fencing  │ │ → AI processing tasks queue           │   │
│  │ (Socket.IO)│ (FCM)    │ │ Service  │ │ → ফলাফল consume করে অ্যাকশন নেয়      │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────────────────────────┘   │
└───────────────────────────────────┬─────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌───────────────────────────┐
│  AI Microservices   │  │  Message Queue       │  │   Cache Layer             │
│  (Python FastAPI)   │  │  (Redis Pub/Sub      │  │   (Redis)                 │
│                     │  │   + BullMQ)          │  │                           │
│  ┌───────────────┐  │  │                     │  │  - Session Store          │
│  │ NLP Classifier│  │  │  Queue:              │  │  - Geo Cache              │
│  │ (BanglaBERT)  │  │  │  - ai.text_analysis  │  │  - Rate Limit Counters    │
│  ├───────────────┤  │  │  - ai.image_analysis │  │  - API Response Cache     │
│  │ Image Analysis│  │  │  - ai.deepfake_check │  │  - Active Alert Cache     │
│  │ (YOLO+ViT+OCR)│  │  │  - ai.trust_calc     │  │                           │
│  ├───────────────┤  │  │  - notification.send │  │                           │
│  │ Deepfake      │  │  │                     │  │                           │
│  │ Detector (ViT)│  │  │  Pub/Sub:            │  │                           │
│  ├───────────────┤  │  │  - alert:new         │  │                           │
│  │ Credibility   │  │  │  - sighting:new      │  │                           │
│  │ Scorer        │  │  │  - cluster:update    │  │                           │
│  ├───────────────┤  │  │                     │  │                           │
│  │ Clustering    │  │  │                     │  │                           │
│  │ (HDBSCAN)     │  │  │                     │  │                           │
│  ├───────────────┤  │  │                     │  │                           │
│  │ Predictive    │  │  │                     │  │                           │
│  │ Analytics     │  │  │                     │  │                           │
│  │ (LSTM/Prophet)│  │  │                     │  │                           │
│  └───────────────┘  │  └─────────────────────┘  └───────────────────────────┘
└─────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         🟢 Supabase (PostgreSQL) — প্রাইমারি ডেটাবেস                  │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  📋 ট্রানজেকশনাল ডেটা (ACID)  │  🗺️ জিও-স্পেশাল (PostGIS)  │  🔍 ভেক্টর (pgvector) │   │
│  │                             │                          │                      │   │
│  │  • Users (with RLS)         │  • ST_DWithin queries    │  • Hybrid search     │   │
│  │  • FeedPosts                │  • ST_ClusterDBSCAN      │  • Embeddings        │   │
│  │  • Alerts                   │  • GeoJSON indexes       │  • Similarity search │   │
│  │  • Sightings                │  • Nearby queries        │                      │   │
│  │  • Votes                    │                          │                      │   │
│  │  • Notifications            │  🔐 Auth (Built-in)      │  📁 Storage (Built-in)│   │
│  │  • AuditLogs                │  • Row Level Security    │  • Images            │   │
│  │  • FeedComments             │  • Phone OTP             │  • Videos            │   │
│  │                             │  • JWT + Magic Link      │  • Documents         │   │
│  │  ⚡ Realtime (Built-in)     │                          │                      │   │
│  │  • WebSocket subscriptions  │                          │                      │   │
│  │  • DB change listeners      │                          │                      │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬─────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         🔵 MongoDB — সেকেন্ডারি (শুধু AI & লগিং ডেটা)                 │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  🧠 AI মেটাডেটা (ফ্লেক্সিবল স্কিমা)  │  📊 ক্যাশ & এগ্রিগেশন  │  📝 লগিং       │   │
│  │                                   │                      │                 │   │
│  │  • FeedPost.aiMetadata            │  • Predictive cache  │  • AI logs      │   │
│  │    (NLP results, entities, etc.)  │  • Heatmap cache     │  • Raw sightings│   │
│  │  • Alert.aiAnalysis               │  • Daily aggregates  │  • Error logs   │   │
│  │    (image analysis, deepfake)     │                      │                 │   │
│  │  • TrustScore.history             │                      │                 │   │
│  │    (Bayesian components)          │                      │                 │   │
│  │  • Clustering.results             │                      │                 │   │
│  │    (HDBSCAN output)               │                      │                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### কম্পোনেন্টসমূহের বিবরণ

| কম্পোনেন্ট | টেকনোলজি | ভূমিকা |
|-----------|-----------|--------|
| **ওয়েব অ্যাপ (PWA)** | React + Vite + PWA + Geolocation API | জিপিএস ট্র্যাকিং, SOS বাটন, ফিড ব্রাউজ, পুশ নোটিফিকেশন (Web Push) |
| **ওয়েব অ্যাপ** | React + Vite | ডেস্কটপ ব্রাউজিং, রুট প্ল্যানিং, ফিড দেখা |
| **অ্যাডমিন ড্যাশবোর্ড** | React + Leaflet | হিটম্যাপ, সাইটিং ক্লাস্টার, অ্যালার্ট ম্যানেজমেন্ট, ইউজার ভেরিফিকেশন |
| **ব্যাকএন্ড API** | Express.js + TypeScript | REST API, WebSocket, অথেনটিকেশন, বিজনেস লজিক |
| **AI মাইক্রোসার্ভিস** | Python FastAPI | NLP ক্লাসিফিকেশন, ইমেজ অ্যানালাইসিস, ডিপফেক ডিটেকশন, ক্লাস্টারিং |
| **মেসেজ কিউ** | Redis + BullMQ | AI টাস্ক কিউইং, ইভেন্ট পাবলিশ/সাবস্ক্রাইব |
| **ক্যাশ** | Redis | সেশন, জিও-ক্যাশ, রেট লিমিটিং |
| **প্রাইমারি ডিবি** | **Supabase (PostgreSQL)** | ট্রানজেকশনাল ডেটা, জিও-স্পেশাল (PostGIS), রিয়েল-টাইম, অথেনটিকেশন, ফাইল স্টোরেজ |
| **সেকেন্ডারি ডিবি** | **MongoDB** | AI মেটাডেটা (ফ্লেক্সিবল স্কিমা), ট্রাস্ট হিস্টোরি, ক্লাস্টারিং ক্যাশ, লগিং |
| **পুশ নোটিফিকেশন** | Web Push API + Service Worker | রিয়েল-টাইম অ্যালার্ট পাঠানো |

---

## ২. AI-চালিত সম্পূর্ণ সিস্টেম ফ্লো

### মূল নীতি: ইউজার শুধু পোস্ট করে, AI বাকি সব করে

ইউজারকে কোনো টাইপ সিলেক্ট করতে হবে না, কোনো ক্যাটেগরি বাছাই করতে হবে না। শুধু লেখা/ছবি/লোকেশন দিলেই AI নিজেই বুঝবে এটা কি—সাধারণ তথ্য, নাকি জরুরি অ্যালার্ট।

### সম্পূর্ণ সিস্টেম ফ্লো ডায়াগ্রাম

```
                    ┌─────────────────────────────────────────────────┐
                    │                ইউজার পোস্ট                       │
                    │  (যেকোনো বাংলা/ইংরেজি টেক্সট + ছবি + GPS লোকেশন) │
                    │  কোনো টাইপ/ক্যাটেগরি লাগবে না                   │
                    └────────────────────┬────────────────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────────────┐
                    │    ব্যাকএন্ড API → POST /api/v1/feed            │
                    │    (raw unstructured data)                      │
                    └────────────────────┬────────────────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────────────┐
                    │    BullMQ Queue → ai.text_analysis task         │
                    └────────────────────┬────────────────────────────┘
                                         │
                                         ▼
              ┌──────────────────────────────────────────────────────────┐
              │              AI পাইপলাইন — স্টেপ ১: টেক্সট ক্লাসিফিকেশন   │
              │                                                          │
              │  মডেল: BanglaBERT / mBERT fine-tuned                     │
              │                                                          │
              │  ইনপুট: "স্যার! মিরপুর ১০ এ একজন ছিনতাইকারী ৩ নম্বর       │
              │          বাসে উঠে ফোন ছিনিয়ে নিচ্ছে। প্লিজ সাহায্য!"      │
              │                                                          │
              │  আউটপুট:                                                 │
              │  {                                                       │
              │    category: "robbery",         // ১৫টি ক্লাসের একটি     │
              │    severity: "critical",        // low/medium/high/critical│
              │    isEmergency: true,           // true/false             │
              │    confidence: 0.94,            // 0-1                   │
              │    language: "bn",              // bn/en/roman           │
              │    sentiment: "urgent",         // sentiment analysis    │
              │    entities: {                  // NER extracted         │
              │      locations: ["মিরপুর ১০"],                           │
              │      vehicles: ["৩ নম্বর বাস"],                          │
              │      persons: ["ছিনতাইকারী"]                             │
              │    }                                                    │
              │  }                                                      │
              └──────────────────────────┬───────────────────────────────┘
                                         │
                                         ▼
              ┌──────────────────────────────────────────────────────────┐
              │              AI পাইপলাইন — স্টেপ ২: ইমেজ অ্যানালাইসিস     │
              │              (যদি ছবি থাকে)                              │
              │                                                          │
              │  ১. YOLOv8 → অবজেক্ট ডিটেকশন:                           │
              │     - গাড়ি/বাইক/সিএনজি/ব্যক্তি শনাক্ত                     │
              │     - বাউন্ডিং বক্স + ক্লাস লেবেল                        │
              │                                                          │
              │  ২. PaddleOCR → নম্বর প্লেট OCR:                         │
              │     - "ঢাকা মেট্রো ১২-৩৪৫৬"                             │
              │                                                          │
              │  ৩. ResNet → অ্যাট্রিবিউট ক্লাসিফিকেশন:                  │
              │     - পোশাকের রং: "কালো", "নীল"                         │
              │     - গাড়ির রং: "সাদা", "লাল"                           │
              │     - বয়স গ্রুপ: "adult", "child", "elderly"            │
              │                                                          │
              │  ৪. Vision Transformer → ডিপফেক ডিটেকশন:                │
              │     - AI-generated image probability                     │
              │     - > 0.7 হলে ফ্ল্যাগ                                  │
              └──────────────────────────┬───────────────────────────────┘
                                         │
                                         ▼
              ┌──────────────────────────────────────────────────────────┐
              │              AI পাইপলাইন — স্টেপ ৩: ডিসিশন ইঞ্জিন        │
              │                                                          │
              │  সব ইনপুট একত্রিত করে সিদ্ধান্ত:                          │
              │                                                          │
              │  if (isEmergency && confidence > 0.8) {                  │
              │    → ইমার্জেন্সি অ্যালার্ট তৈরি করো                       │
              │    → পুলিশ/র্যাব ড্যাশবোর্ডে notify করো                  │
              │    → জিওফেন্সিং (টাইপ অনুসারে রেডিয়াস)                   │
              │    → পুশ নোটিফিকেশন পাঠাও                               │
              │  }                                                      │
              │  else if (confidence > 0.5) {                            │
              │    → সাধারণ ফিড পোস্ট হিসেবে পোস্ট করো                   │
              │    → কমিউনিটি ভোটিংয়ের জন্য ওপেন করো                     │
              │  }                                                      │
              │  else {                                                 │
              │    → পেন্ডিং রিভিউ কুইয়ে রাখো (admin দেখবে)              │
              │  }                                                      │
              │                                                          │
              │  Additionally:                                           │
              │  if (deepfakeScore > 0.7) {                              │
              │    → ছবি ফ্ল্যাগ করো, ফিডে "AI-generated" ব্যাজ দেখাও   │
              │  }                                                      │
              │  if (duplicateTextFound) {                               │
              │    → ডুপ্লিকেট হিসেবে চিহ্নিত করো                        │
              │  }                                                      │
              └──────────────────────────┬───────────────────────────────┘
                                         │
                                         ▼
              ┌──────────────────────────────────────────────────────────┐
              │              স্টেপ ৪: নোটিফিকেশন & অ্যাকশন              │
              │                                                          │
              │  ┌─────────────────────┐  ┌─────────────────────────┐   │
              │  │ ইমার্জেন্সি অ্যালার্ট │  │ সাধারণ ফিড পোস্ট         │   │
              │  │                     │  │                         │   │
              │  │ → FCM Push:         │  │ → ফিডে প্রকাশ           │   │
              │  │   ২০০০মি রেডিয়াসে    │  │ → আপভোট/ডাউনভোট ওপেন    │   │
              │  │   সব ইউজার পায়       │  │ → কমেন্ট ওপেন           │   │
              │  │                     │  │ → ক্রেডিবিলিটি স্কোর    │   │
              │  │ → Socket.IO:        │  │                         │   │
              │  │   অ্যাডমিন প্যানেলে  │  │                         │   │
              │  │   রিয়েল-টাইম দেখায়   │  │                         │   │
              │  │                     │  │                         │   │
              │  │ → অ্যালার্ট ক্রিয়েটর │  │                         │   │
              │  │   পায়: "আপনার        │  │                         │   │
              │  │   রিপোর্ট জরুরি      │  │                         │   │
              │  │   হিসেবে চিহ্নিত"    │  │                         │   │
              │  └─────────────────────┘  └─────────────────────────┘   │
              └──────────────────────────┬───────────────────────────────┘
                                         │
                                         ▼
              ┌──────────────────────────────────────────────────────────┐
              │              স্টেপ ৫: সাইটিং সিস্টেম (দ্বিমুখী লাইভ)     │
              │                                                          │
              │  কেউ "দেখেছি" ক্লিক করলে:                                │
              │  ১. লোকেশন + ছবি + টাইমস্ট্যাম্প রেকর্ড                   │
              │  ২. অ্যালার্ট ক্রিয়েটর পায়: "কেউ আপনার রিপোর্ট দেখেছেন!"  │
              │  ৩. কাছাকাছি ইউজাররা পায়: "মিরপুর ১০-এ ১৫ মিনিট আগে     │
              │     দেখা গেছে"                                          │
              │  ৪. অন্যরাও "হ্যাঁ, আমিও দেখেছি" দিয়ে কনফার্ম করতে পারে  │
              │  ৫. AI HDBSCAN ক্লাস্টারিং:                              │
              │     - কোন দিকে যাচ্ছে?                                   │
              │     - কত দ্রুত?                                         │
              │     - শেষ দেখা কোথায়?                                    │
              │     - ক্লাস্টার কনফিডেন্স স্কোর                          │
              │  ৬. প্রশাসনের জন্য: লাইভ সাইটিং টাইমলাইন                 │
              └──────────────────────────────────────────────────────────┘
```

### AI-ডিটেক্টেড ক্যাটেগরির সম্পূর্ণ লিস্ট

AI নিজেই নিচের ক্যাটেগরিগুলোর একটি নির্ধারণ করবে, ইউজারকে কিছু সিলেক্ট করতে হবে না:

| # | ক্যাটেগরি | বাংলা উদাহরণ | ইমার্জেন্সি? | রেডিয়াস |
|---|-----------|-------------|-------------|---------|
| 1 | `accident` | "২টি বাসের মুখোমুখি সংঘর্ষ, আহত ১০" | ✅ | 2000m |
| 2 | `assault` | "কাউকে মারধর করা হচ্ছে, প্লিজ আসেন" | ✅ | 2000m |
| 3 | `robbery` | "ছিনতাইকারী চেইন ছিনিয়ে নিল" | ✅ | 2000m |
| 4 | `harassment` | "বাসে ইভটিজিং, মেয়েটিকে বিরক্ত করছে" | ✅ | 2000m |
| 5 | `medical` | "হার্ট অ্যাটাক, কেউ অ্যাম্বুলেন্স ডাকবেন" | ✅ | 1000m |
| 6 | `fire` | "বাজারে আগুন, ফায়ার সার্ভিস দরকার" | ✅ | 2000m |
| 7 | `missing_person` | "৮ বছর বয়সী শিশু নিখোঁজ" | ✅ | 5000m |
| 8 | `stolen_vehicle` | "নীল রঙের হিরা সাইকেল চুরি" | ✅ | 5000m |
| 9 | `escaped_criminal` | "পুলিশের কাছ থেকে পালানো আসামি মিরপুরে" | ✅ | 5000m |
| 10 | `traffic_jam` | "মিরপুর রোডে ৩ কিমি জ্যাম" | ❌ | - |
| 11 | `toll_extortion` | "চাঁদাবাজি, ২০ টাকা দিতে বলছে" | ❌ | - |
| 12 | `police_checkpost` | "পুলিশ চেকপোস্ট, লাইসেন্স চেক করছে" | ❌ | - |
| 13 | `natural_disaster` | "বৃষ্টিতে রাস্তা ডুবে গেছে" | ⚠️ | 2000m |
| 14 | `road_hazard` | "রাস্তায় গর্ত, দুর্ঘটনার সম্ভাবনা" | ❌ | - |
| 15 | `other` | সাধারণ তথ্য, টিপস, ইভেন্ট | ❌ | - |

---

## ৩. ডেটাবেস স্কিমা — হাইব্রিড (Supabase + MongoDB)

### 🎯 ডেটা ডিস্ট্রিবিউশন ম্যাপ

| ডেটা | ডেটাবেস | কারণ |
|------|---------|------|
| **Users** (auth + profile) | **Supabase** | Built-in Auth, RLS, ACID |
| **FeedPosts** (main data) | **Supabase** | PostGIS geo queries, Realtime, RLS |
| **FeedComments** | **Supabase** | Relational with posts, Realtime |
| **Alerts** (emergency) | **Supabase** | PostGIS (ST_DWithin), Realtime, RLS |
| **Sightings** | **Supabase** | PostGIS clustering, Realtime, RLS |
| **Votes** | **Supabase** | ACID (double-vote prevention) |
| **Notifications** | **Supabase** | Realtime subscriptions |
| **AuditLogs** | **Supabase** | Relational queries, RLS |
| **AI Metadata** (NLP results, entities) | **MongoDB** | Flexible schema, varying fields per post |
| **TrustScore History** | **MongoDB** | Append-only, high-volume writes |
| **Clustering Cache** (HDBSCAN output) | **MongoDB** | Temporary data, TTL indexes |
| **AI Processing Logs** | **MongoDB** | High-volume writes, no joins needed |

---

### ৩.১ 🟢 Supabase (PostgreSQL) — প্রাইমারি ডেটাবেস

#### টেবিল: users

```sql
-- Supabase Auth handles: id, email, password_hash, phone, email_verified, phone_verified
-- Extended profile in public.users:

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'police', 'rab')),
  trust_score NUMERIC(3,2) NOT NULL DEFAULT 0.50 CHECK (trust_score >= 0 AND trust_score <= 1),
  total_reports INTEGER NOT NULL DEFAULT 0,
  verified_reports INTEGER NOT NULL DEFAULT 0,
  false_reports INTEGER NOT NULL DEFAULT 0,
  
  -- Official verification
  official_id TEXT,
  official_email TEXT,
  is_officially_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- Jurisdiction (for police/RAB)
  jurisdiction_type TEXT CHECK (jurisdiction_type IN ('division', 'district', 'thana')),
  jurisdiction_value TEXT,
  jurisdiction_location GEOGRAPHY(POINT),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_trust_score ON public.users(trust_score DESC);
CREATE INDEX idx_users_jurisdiction_location ON public.users USING GIST(jurisdiction_location);

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all" ON public.users FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
```

#### টেবিল: feed_posts

```sql
CREATE TABLE public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL CHECK (char_length(message) <= 1200),
  image_url TEXT,
  location GEOGRAPHY(POINT),
  location_name TEXT,
  
  -- AI metadata (basic fields, full metadata in MongoDB)
  ai_category TEXT CHECK (ai_category IN ('accident','assault','robbery','harassment','medical','fire','missing_person','stolen_vehicle','escaped_criminal','traffic_jam','toll_extortion','police_checkpost','natural_disaster','road_hazard','other')),
  ai_severity TEXT CHECK (ai_severity IN ('low','medium','high','critical')),
  ai_is_emergency BOOLEAN NOT NULL DEFAULT false,
  ai_confidence NUMERIC(3,2),
  ai_metadata_id UUID,  -- reference to MongoDB AI metadata document
  
  -- Alert reference
  alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
  
  -- Authorship
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  device_id TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  
  -- Voting (counts only, details in votes table)
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted', 'pending_review')),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feed_posts_location ON public.feed_posts USING GIST(location);
CREATE INDEX idx_feed_posts_status_created ON public.feed_posts(status, is_deleted, created_at DESC);
CREATE INDEX idx_feed_posts_ai_category ON public.feed_posts(ai_category, status);
CREATE INDEX idx_feed_posts_ai_emergency ON public.feed_posts(ai_is_emergency, status);
CREATE INDEX idx_feed_posts_alert ON public.feed_posts(alert_id);
CREATE INDEX idx_feed_posts_author ON public.feed_posts(author_id);

-- Full text search
CREATE INDEX idx_feed_posts_search ON public.feed_posts USING GIN(to_tsvector('bengali', message));

-- RLS
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active posts" ON public.feed_posts FOR SELECT USING (status = 'active' AND NOT is_deleted);
CREATE POLICY "Users can create posts" ON public.feed_posts FOR INSERT WITH CHECK (auth.uid() = author_id OR device_id IS NOT NULL);
CREATE POLICY "Users can delete own posts" ON public.feed_posts FOR UPDATE USING (auth.uid() = author_id);
```

#### টেবিল: alerts

```sql
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- AI-detected
  type TEXT NOT NULL CHECK (type IN ('accident','assault','robbery','harassment','medical','fire','missing_person','stolen_vehicle','escaped_criminal','traffic_jam','toll_extortion','police_checkpost','natural_disaster','road_hazard','other')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  is_emergency BOOLEAN NOT NULL DEFAULT false,
  ai_confidence NUMERIC(3,2),
  ai_metadata_id UUID,  -- reference to MongoDB AI analysis document
  
  -- Original post
  original_post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  original_text TEXT,
  
  -- Location
  location GEOGRAPHY(POINT) NOT NULL,
  location_name TEXT,
  radius INTEGER NOT NULL DEFAULT 2000,  -- meters
  
  -- Management
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','false_alarm','pending_review','expired')),
  sighting_count INTEGER NOT NULL DEFAULT 0,
  last_sighting_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Admin
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_alerts_location ON public.alerts USING GIST(location);
CREATE INDEX idx_alerts_status_emergency ON public.alerts(status, is_emergency, created_at DESC);
CREATE INDEX idx_alerts_type_status ON public.alerts(type, status);
CREATE INDEX idx_alerts_original_post ON public.alerts(original_post_id);

-- RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active alerts" ON public.alerts FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage alerts" ON public.alerts FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'police', 'rab'));
```

#### টেবিল: sightings

```sql
CREATE TABLE public.sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.users(id),
  device_id TEXT,
  
  location GEOGRAPHY(POINT) NOT NULL,
  location_name TEXT,
  description TEXT,
  image_url TEXT,
  
  -- Confirmation
  confirmation_count INTEGER NOT NULL DEFAULT 0,
  
  -- Trust
  reporter_trust_score NUMERIC(3,2),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES public.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sightings_alert ON public.sightings(alert_id, created_at DESC);
CREATE INDEX idx_sightings_location ON public.sightings USING GIST(location);
CREATE INDEX idx_sightings_confirmations ON public.sightings(confirmation_count DESC);

-- RLS
ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sightings" ON public.sightings FOR SELECT USING (true);
CREATE POLICY "Users can report sightings" ON public.sightings FOR INSERT WITH CHECK (auth.uid() = reporter_id OR device_id IS NOT NULL);
```

#### টেবিল: sighting_confirmations

```sql
CREATE TABLE public.sighting_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sighting_id UUID NOT NULL REFERENCES public.sightings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(sighting_id, user_id),
  UNIQUE(sighting_id, device_id)
);

CREATE INDEX idx_confirmations_sighting ON public.sighting_confirmations(sighting_id);
```

#### টেবিল: votes

```sql
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('feed_post', 'alert', 'sighting', 'comment')),
  target_id UUID NOT NULL,
  voter_id UUID REFERENCES public.users(id),
  device_id TEXT,
  value SMALLINT NOT NULL CHECK (value IN (1, -1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(target_type, target_id, voter_id),
  UNIQUE(target_type, target_id, device_id)
);

CREATE INDEX idx_votes_target ON public.votes(target_type, target_id);
CREATE INDEX idx_votes_voter ON public.votes(voter_id);
```

#### টেবিল: notifications

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sos_alert','missing_person','stolen_vehicle','official_alert','sighting_nearby','flag_warning','alert_resolved','sighting_confirmed')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  sent_via TEXT[],
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
-- Auto-delete after 30 days
SELECT cron.schedule('delete-old-notifications', '0 0 * * *', 'DELETE FROM public.notifications WHERE created_at < NOW() - INTERVAL ''30 days''');
```

#### টেবিল: audit_logs

```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.users(id),
  target_type TEXT,
  target_id UUID,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_action ON public.audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target ON public.audit_logs(target_type, target_id);
```

#### টেবিল: feed_comments

```sql
CREATE TABLE public.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.feed_comments(id),
  message TEXT NOT NULL CHECK (char_length(message) <= 600),
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  author_id UUID REFERENCES public.users(id),
  device_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted')),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_post ON public.feed_comments(post_id, created_at);
CREATE INDEX idx_comments_parent ON public.feed_comments(parent_id);
```

---

### ৩.২ 🔵 MongoDB — সেকেন্ডারি (AI মেটাডেটা, ট্রাস্ট হিস্টোরি, ক্যাশ, লগ)

#### কালেকশন: ai_metadata

```javascript
// প্রতিটি AI-প্রসেসড পোস্ট/অ্যালার্টের জন্য ফ্লেক্সিবল মেটাডেটা
{
  _id: ObjectId,
  referenceType: String,     // 'feed_post', 'alert'
  referenceId: String,       // UUID from Supabase
  
  // NLP ফলাফল (BanglaBERT আউটপুট)
  nlpResult: {
    category: String,
    severity: String,
    isEmergency: Boolean,
    confidence: Number,
    language: String,
    sentiment: String,
    entities: {
      locations: [String],
      vehicles: [String],
      persons: [String]
    },
    rawOutput: Object       // সম্পূর্ণ BanglaBERT আউটপুট
  },
  
  // ইমেজ অ্যানালাইসিস ফলাফল (YOLO + OCR + ViT)
  imageAnalysis: {
    objects: [{
      class: String,
      confidence: Number,
      bbox: [Number]
    }],
    licensePlate: {
      text: String,
      confidence: Number,
      imageUrl: String
    },
    attributes: {
      person: {
        gender: String,
        ageGroup: String,
        clothing: String,
        color: String
      },
      vehicle: {
        type: String,
        brand: String,
        model: String,
        color: String
      }
    },
    deepfakeScore: Number,
    isAIGenerated: Boolean
  },
  
  // ডকুমেন্ট ভেরিফিকেশন (যদি প্রযোজ্য)
  documentVerification: {
    tamperingProbability: Number,
    extractedFields: Object,
    faceMatchScore: Number
  },
  
  // প্রসেসিং মেটাডেটা
  modelVersion: String,
  processingTime: Number,    // ms
  processedAt: Date,
  
  createdAt: Date
}

// Indexes
// { referenceType: 1, referenceId: 1 }
// { 'nlpResult.category': 1 }
// { processedAt: 1 }, { expireAfterSeconds: 7776000 }  // 90 days TTL
```

#### কালেকশন: trust_score_history

```javascript
// ইউজারের ট্রাস্ট স্কোর পরিবর্তনের ইতিহাস (append-only)
{
  _id: ObjectId,
  userId: String,            // UUID from Supabase
  score: Number,             // 0.0 - 1.0
  components: {
    baseScore: Number,
    reportAccuracy: Number,
    communityVotes: Number,
    clusterDensity: Number,
    recencyFactor: Number,
    flagPenalty: Number
  },
  reason: String,            // 'report_verified', 'report_false', 'upvote_received', 'flag_penalty'
  relatedItemId: String,     // UUID of related post/alert/sighting
  changedAt: Date
}

// Indexes
// { userId: 1, changedAt: -1 }
// { changedAt: 1 }, { expireAfterSeconds: 7776000 }  // 90 days TTL
```

#### কালেকশন: clustering_cache

```javascript
// HDBSCAN ক্লাস্টারিং আউটপুট (অস্থায়ী ক্যাশ)
{
  _id: ObjectId,
  alertId: String,           // UUID from Supabase
  clusterId: String,
  
  // ক্লাস্টার জিওমেট্রি
  centroid: {
    type: 'Point',
    coordinates: [Number]    // [lng, lat]
  },
  convexHull: {
    type: 'Polygon',
    coordinates: [[Number]]
  },
  
  // ক্লাস্টার ডেটা
  sightingIds: [String],     // UUIDs from Supabase
  sightingCount: Number,
  confidenceScore: Number,
  
  // মুভমেন্ট ট্র্যাকিং
  movementDirection: String, // 'north', 'south', 'east', 'west', 'stationary'
  movementSpeed: Number,     // estimated km/h
  lastUpdated: Date,
  
  createdAt: Date
}

// Indexes
// { alertId: 1 }
// { centroid: '2dsphere' }
// { createdAt: 1 }, { expireAfterSeconds: 86400 }  // 24 hours TTL
```

#### কালেকশন: ai_processing_logs

```javascript
// AI প্রসেসিং লগ (হাই-ভলিউম রাইট)
{
  _id: ObjectId,
  service: String,           // 'nlp', 'image', 'deepfake', 'clustering', 'trust'
  taskId: String,
  referenceType: String,
  referenceId: String,
  status: String,            // 'started', 'completed', 'failed'
  inputSize: Number,         // bytes
  processingTime: Number,    // ms
  error: String,             // if failed
  metadata: Object,
  createdAt: Date
}

// Indexes
// { service: 1, createdAt: -1 }
// { status: 1 }
// { createdAt: 1 }, { expireAfterSeconds: 2592000 }  // 30 days TTL
```

---

### ৩.৩ ডেটা ফ্লো — Supabase ↔ MongoDB

```
ইউজার পোস্ট করে
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Express.js ব্যাকএন্ড                                        │
│                                                             │
│  ১. Supabase-এ feed_posts INSERT (status: 'pending_review') │
│  ২. BullMQ queue-তে AI task পাঠায়                           │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Python AI Microservice                                      │
│                                                             │
│  ৩. BanglaBERT প্রসেস করে                                   │
│  ৪. MongoDB-তে ai_metadata INSERT (ফ্লেক্সিবল স্কিমা)       │
│  ৫. ফলাফল Redis Pub/Sub-এ publish করে                       │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Express.js AI Orchestrator                                  │
│                                                             │
│  ৬. MongoDB থেকে ai_metadata READ                            │
│  ৭. Supabase-এ feed_posts UPDATE:                            │
│     → ai_category, ai_severity, ai_is_emergency,             │
│       ai_confidence, ai_metadata_id, status                  │
│  ৮. isEmergency=true হলে:                                    │
│     → Supabase-এ alerts INSERT                              │
│     → feed_posts.alert_id UPDATE                            │
│     → PostGIS ST_DWithin কোয়েরি (nearby users)              │
│     → notifications INSERT (Supabase Realtime → Web Push)   │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  সাইটিং রিপোর্ট (দেখেছি)                                     │
│                                                             │
│  ৯. Supabase-এ sightings INSERT (PostGIS location)          │
│  ১০. MongoDB-তে trust_score_history APPEND                  │
│  ১১. Cron job: HDBSCAN ক্লাস্টারিং                          │
│      → MongoDB-তে clustering_cache UPDATE                   │
│      → Supabase-এ alerts.sighting_count UPDATE              │
└─────────────────────────────────────────────────────────────┘
```

---

## ৪. API এন্ডপয়েন্ট লিস্ট ও ডেটা ফ্লো

### ৪.১ Authentication

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| POST | `/api/v1/auth/register` | ইমেইল/ফোন রেজিস্ট্রেশন | ❌ | 5/min |
| POST | `/api/v1/auth/login` | লগইন | ❌ | 10/min |
| POST | `/api/v1/auth/verify-phone` | ফোন ভেরিফিকেশন (SMS OTP) | ✅ | 3/min |
| POST | `/api/v1/auth/verify-official` | পুলিশ/র্যাব ভেরিফিকেশন রিকোয়েস্ট | ✅ | 2/hour |
| GET | `/api/v1/auth/me` | নিজের প্রোফাইল | ✅ | 30/min |
| PATCH | `/api/v1/auth/me` | প্রোফাইল আপডেট | ✅ | 10/min |

### ৪.২ Feed (ক্রাউডসোর্সড ইনফরমেশন)

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/v1/feed` | ফিড পোস্ট লিস্ট (পেজিনেটেড) | ❌ | 60/min |
| POST | `/api/v1/feed` | **নতুন পোস্ট তৈরি (AI প্রসেস হবে)** | ✅/device | 10/hour |
| POST | `/api/v1/feed/vote` | আপভোট/ডাউনভোট | ✅/device | 30/min |
| GET | `/api/v1/feed/nearby` | কাছাকাছি পোস্ট (জিও-কোয়েরি) | ❌ | 30/min |
| GET | `/api/v1/feed/:id` | পোস্ট বিস্তারিত | ❌ | 60/min |
| DELETE | `/api/v1/feed/:id` | পোস্ট ডিলিট (নিজের) | ✅ | 10/min |

### ৪.৩ Emergency/SOS

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| POST | `/api/v1/emergency/sos` | SOS অ্যালার্ট তৈরি (AI ক্লাসিফাই করবে) | ✅ (phone verified) | 1/hour |
| GET | `/api/v1/emergency/alerts` | অ্যাকটিভ অ্যালার্ট লিস্ট | ❌ | 30/min |
| GET | `/api/v1/emergency/alerts/nearby` | কাছাকাছি অ্যালার্ট (জিও-কোয়েরি) | ❌ | 30/min |
| GET | `/api/v1/emergency/alerts/:id` | অ্যালার্ট বিস্তারিত | ❌ | 30/min |
| POST | `/api/v1/emergency/alerts/:id/sighting` | **সাইটিং রিপোর্ট (দেখেছি)** | ✅/device | 20/hour |
| POST | `/api/v1/emergency/alerts/:id/confirm` | সাইটিং কনফার্ম (আমিও দেখেছি) | ✅/device | 20/hour |
| POST | `/api/v1/emergency/alerts/:id/resolve` | অ্যালার্ট রিজল্ভ (admin only) | ✅ (admin) | - |
| POST | `/api/v1/emergency/alerts/:id/flag` | মিথ্যা হিসেবে ফ্ল্যাগ | ✅ (trust > 0.6) | 5/hour |

### ৪.৪ Community

| Method | Endpoint | Description | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| GET | `/api/v1/community/routes` | কমিউনিটি রুট লিস্ট | ❌ | 30/min |
| POST | `/api/v1/community/routes` | নতুন রুট যোগ | ✅/device | 10/hour |
| POST | `/api/v1/community/routes/vote` | রুট ভোট | ✅/device | 30/min |
| GET | `/api/v1/community/stops` | কমিউনিটি স্টপ লিস্ট | ❌ | 30/min |
| POST | `/api/v1/community/stops` | নতুন স্টপ যোগ | ✅/device | 10/hour |

### ৪.৫ Admin Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/admin/dashboard` | ড্যাশবোর্ড সারাংশ | ✅ (admin/official) |
| GET | `/api/v1/admin/alerts` | সব অ্যালার্ট (ফিল্টার সহ) | ✅ (admin/official) |
| GET | `/api/v1/admin/heatmap` | হিটম্যাপ ডেটা (জিও-ক্লাস্টার) | ✅ (admin/official) |
| GET | `/api/v1/admin/sighting-clusters` | সাইটিং ক্লাস্টার (HDBSCAN) | ✅ (admin/official) |
| POST | `/api/v1/admin/verify-user` | ইউজার ভেরিফিকেশন | ✅ (admin) |
| POST | `/api/v1/admin/official-alert` | অফিসিয়াল অ্যালার্ট তৈরি | ✅ (verified official) |
| GET | `/api/v1/admin/analytics/predictive` | প্রেডিক্টিভ অ্যানালাইটিক্স | ✅ (admin) |
| GET | `/api/v1/admin/pending-reviews` | পেন্ডিং রিভিউ লিস্ট | ✅ (admin) |
| POST | `/api/v1/admin/review/:id` | রিভিউ অ্যাপ্রুভ/রিজেক্ট | ✅ (admin) |

### ৪.৬ AI Services (Internal — Python Microservices)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/v1/classify-text` | টেক্সট ক্লাসিফিকেশন (BanglaBERT) |
| POST | `/ai/v1/analyze-image` | ইমেজ অ্যানালাইসিস (YOLO + OCR) |
| POST | `/ai/v1/detect-deepfake` | ডিপফেক ডিটেকশন (ViT) |
| POST | `/ai/v1/verify-document` | ডকুমেন্ট ভেরিফিকেশন |
| POST | `/ai/v1/cluster-sightings` | সাইটিং ক্লাস্টারিং (HDBSCAN) |
| POST | `/ai/v1/calculate-trust` | ট্রাস্ট স্কোর ক্যালকুলেশন |
| GET | `/ai/v1/predictive-hotspots` | প্রেডিক্টিভ হটস্পট |

### ৪.৭ ডেটা ফ্লো — সম্পূর্ণ উদাহরণ: ইউজার পোস্ট → AI প্রসেসিং → অ্যাকশন

```
ইউজার অ্যাকশন:
  1. ইউজার অ্যাপে পোস্ট করে: "মিরপুর ১০ এ ছিনতাই! ৩ নং বাসে উঠে ফোন ছিনিয়ে নিচ্ছে!"
     + GPS লোকেশন + ছবি (optional)
  2. POST /api/v1/feed → { message, location, image }

ব্যাকএন্ড (Express.js):
  3. ফিড পোস্ট MongoDB-তে সেভ (status: 'pending_review')
  4. BullMQ queue-তে task পাঠায়: { type: 'ai.text_analysis', postId }
  5. BullMQ queue-তে task পাঠায়: { type: 'ai.image_analysis', postId } (যদি ছবি থাকে)

AI মাইক্রোসার্ভিস (Python FastAPI):
  6. NLP Classifier:
     - BanglaBERT প্রসেস করে
     - আউটপুট: { category: 'robbery', severity: 'critical', isEmergency: true, confidence: 0.94 }
  7. Image Analyzer (if image):
     - YOLO: person detected
     - OCR: license plate "ঢাকা মেট্রো ১২-৩৪৫৬"
     - ViT: deepfake score 0.02 (real image)
  8. ফলাফল Redis Pub/Sub-এ publish করে

ব্যাকএন্ড (AI Orchestrator):
  9. ফলাফল consume করে:
     - isEmergency=true, confidence=0.94 (>0.8)
     → Alert তৈরি করে
     → FeedPost আপডেট: { aiCategory, aiSeverity, aiIsEmergency, alertId, status: 'active' }
     → জিওফেন্সিং: 2000m রেডিয়াসে সব ইউজার খুঁজে
     → FCM Push Notification পাঠায়
     → Socket.IO-তে অ্যাডমিন ড্যাশবোর্ডে ইভেন্ট
     → অ্যালার্ট ক্রিয়েটরকে নোটিফিকেশন

ইউজার রেসপন্স:
  10. কাছাকাছি ইউজাররা পুশ নোটিফিকেশন পায়
  11. কেউ "দেখেছি" ক্লিক করলে → POST /api/v1/emergency/alerts/:id/sighting
  12. অন্যরাও "আমিও দেখেছি" ক্লিক করতে পারে
  13. AI HDBSCAN ক্লাস্টারিং: সাইটিংগুলো ক্লাস্টার করে
  14. অ্যাডমিন ড্যাশবোর্ডে লাইভ আপডেট
```

---

## ৫. AI মডেল ট্রেনিং ও ডেপ্লয়মেন্ট পাইপলাইন

### ৫.১ আর্কিটেকচার ওভারভিউ

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI মাইক্রোসার্ভিস (Python FastAPI)                      │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │  NLP Classifier         │  │  Image Analyzer          │                   │
│  │  (BanglaBERT/mBERT)     │  │  (YOLOv8 + PaddleOCR)    │                   │
│  │                         │  │                         │                   │
│  │  ইনপুট: টেক্সট          │  │  ইনপুট: ইমেজ             │                   │
│  │  আউটপুট: ক্যাটেগরি,     │  │  আউটপুট: অবজেক্ট,        │                   │
│  │  সিভিয়ারিটি, ইমার্জেন্সি,│  │  নম্বর প্লেট, অ্যাট্রিবিউট│                   │
│  │  এন্টিটি               │  │                         │                   │
│  └───────────┬─────────────┘  └───────────┬─────────────┘                   │
│              │                            │                                 │
│  ┌───────────▼────────────────────────────▼─────────────┐                   │
│  │           মডেল সার্ভিং লেয়ার                          │                   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │                   │
│  │  │ ONNX Runtime │  │ TensorFlow   │  │ PyTorch    │  │                   │
│  │  │ (CPU/GPU)    │  │ Serving (GPU)│  │ (CPU)      │  │                   │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │                   │
│  └──────────────────────────┬───────────────────────────┘                   │
│                             │                                               │
│  ┌──────────────────────────▼───────────────────────────┐                   │
│  │           Message Queue Consumer (Redis BullMQ)       │                   │
│  │           Python → Redis Bridge                       │                   │
│  └─────────────────────────────────────────────────────┘                   │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │  Deepfake Detector      │  │  Document Verifier       │                   │
│  │  (Vision Transformer)   │  │  (EfficientNet + OCR)    │                   │
│  └─────────────────────────┘  └─────────────────────────┘                   │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │  Clustering Engine      │  │  Predictive Analytics    │                   │
│  │  (HDBSCAN)              │  │  (LSTM + Prophet)        │                   │
│  └─────────────────────────┘  └─────────────────────────┘                   │
│                                                                             │
│  ┌─────────────────────────┐                                                │
│  │  Credibility Scorer     │                                                │
│  │  (Bayesian Averaging)   │                                                │
│  └─────────────────────────┘                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### ৫.২ প্রতিটি মডেলের বিস্তারিত বিবরণ

#### A. NLP টেক্সট ক্লাসিফিকেশন (BanglaBERT)

| দিক | বিবরণ |
|------|--------|
| **মডেল** | BanglaBERT (csebuetnlp/banglabert) fine-tuned |
| **টাস্ক** | মাল্টি-হেড ক্লাসিফিকেশন: category (15 classes), severity (4), isEmergency (binary), NER |
| **ট্রেনিং ডেটা** | কাস্টম বাংলা ডেটাসেট: ৫০,০০০+ লেবেলড পোস্ট (ক্রাউডসোর্সড + সিন্থেটিক) |
| **ফাইন-টিউনিং** | Hugging Face Transformers, LoRA (Parameter Efficient) |
| **ইনফারেন্স** | ONNX Runtime, CPU (Intel Xeon), < 500ms |
| **মেট্রিক** | F1-score > 0.85 target |

#### B. ইমেজ অ্যানালাইসিস (YOLOv8 + PaddleOCR)

| দিক | বিবরণ |
|------|--------|
| **মডেল** | YOLOv8x (object detection) + PaddleOCR (license plate OCR) + ResNet50 (attribute classification) |
| **ডিটেক্ট ক্লাস** | person, bike, car, CNG, bus, truck, rickshaw, auto-rickshaw |
| **OCR** | বাংলা + ইংরেজি নম্বর প্লেট (PaddleOCR fine-tuned on BD plates) |
| **অ্যাট্রিবিউট** | color (15 classes), clothing type, age group |
| **ট্রেনিং ডেটা** | কাস্টম বাংলাদেশি ডেটাসেট: ২০,০০০+ ইমেজ |
| **ইনফারেন্স** | ONNX Runtime, GPU (T4), < 2s per image |

#### C. ডিপফেক ডিটেক্টর (Vision Transformer)

| দিক | বিবরণ |
|------|--------|
| **মডেল** | ViT-B/16 fine-tuned on DFDC + CIFAKE |
| **ট্রেনিং ডেটা** | FaceForensics++, DFDC, CIFAKE, custom Bengali deepfake dataset |
| **আউটপুট** | probability (0-1) that image is AI-generated |
| **থ্রেশহোল্ড** | > 0.7 → flag as suspicious, auto-hide from feed |
| **ইনফারেন্স** | TensorFlow Serving, GPU (T4), < 1s |

#### D. ডকুমেন্ট ভেরিফিকেশন

| দিক | বিবরণ |
|------|--------|
| **মডেল** | EfficientNet-B4 + OCR-based tampering detection |
| **ট্রেনিং ডেটা** | NID card samples, passport samples, tampered document dataset |
| **আউটপুট** | tampering probability, extracted text fields, face match score |
| **ইনফারেন্স** | ONNX Runtime, CPU |

#### E. স্প্যাটিও-টেম্পোরাল ক্লাস্টারিং (HDBSCAN)

| দিক | বিবরণ |
|------|--------|
| **অ্যালগরিদম** | HDBSCAN (Hierarchical DBSCAN) |
| **ইনপুট** | Sighting coordinates [lng, lat] + timestamps |
| **আউটপুট** | Cluster labels, confidence scores, hot-zone polygons, movement direction |
| **ফ্রিকোয়েন্সি** | প্রতি ৫ মিনিটে ব্যাচ প্রসেসিং (ক্রন জব) |
| **লাইব্রেরি** | scikit-learn, hdbscan |
| **ইউজケース** | একই এলাকায় একাধিক সাইটিং → বিশ্বাসযোগ্যতা বৃদ্ধি, মুভমেন্ট ট্র্যাকিং |

#### F. ক্রেডিবিলিটি স্কোরিং (Bayesian Averaging)

| দিক | বিবরণ |
|------|--------|
| **অ্যালগরিদম** | Bayesian Average: `(avg_votes * m + total_votes * avg) / (m + total_votes)` |
| **কম্পোনেন্ট** | report_accuracy (±0.3), community_votes (±0.2), cluster_density (0 to +0.1), recency_factor (-0.1 to 0), flag_penalty (-0.3 to 0) |
| **ফ্রিকোয়েন্সি** | প্রতিটি ভোট/ভেরিফিকেশনের পর রিয়েল-টাইম আপডেট |
| **স্টোরেজ** | MongoDB (TrustScore collection) |

#### G. প্রেডিক্টিভ অ্যানালাইটিক্স (LSTM + Prophet)

| দিক | বিবরণ |
|------|--------|
| **মডেল** | LSTM (short-term patterns) + Prophet (seasonal patterns) ensemble |
| **ইনপুট** | Historical report data (time series), time of day, day of week, month, weather data |
| **আউটপুট** | Risk score per area (0-1) for next 24-48 hours |
| **ট্রেনিং** | Weekly retraining with new data |
| **ইনফারেন্স** | TensorFlow Serving, CPU |
| **আউটপুট ফরম্যাট** | GeoJSON with risk polygons |

### ৫.৩ ট্রেনিং পাইপলাইন

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ট্রেনিং পাইপলাইন                                     │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │ ডেটা কালেকশন  │───▶│ ডেটা ক্লিনিং  │───▶│ লেবেলিং      │                   │
│  │ (ক্রাউডসোর্স +│    │ (ডিডুপ্লিকেট, │    │ (Label Studio│                   │
│  │  ওপেন ডেটা)   │    │  ফিল্টারিং)   │    │  + Human)   │                   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘                   │
│                                                  │                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────▼───────┐                   │
│  │ মডেল ডেপ্লয়   │◀───│ মডেল ইভালুয়েট │◀───│ মডেল ট্রেন   │                   │
│  │ (ONNX/TFS)   │    │ (Precision,  │    │ (GPU Cluster │                   │
│  │              │    │  Recall, F1) │    │  + MLflow)   │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │ A/B টেস্টিং   │───▶│ প্রোডাকশন    │───▶│ মনিটরিং      │                   │
│  │ (৫০/৫০ ট্র্যাফিক)│    │ রোলআউট     │    │ (Prometheus +│                   │
│  │              │    │              │    │  Grafana)   │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### ৫.৪ ডেপ্লয়মেন্ট কনফিগারেশন

```yaml
# docker-compose.ai.yml
version: '3.8'

services:
  ai-nlp:
    build: ./ai-services/nlp
    image: pathik-ai-nlp:latest
    ports:
      - "8001:8000"
    environment:
      - MODEL_PATH=/models/banglabert.onnx
      - REDIS_URL=redis://redis:6379
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2'
          memory: 4G

  ai-image:
    build: ./ai-services/image
    image: pathik-ai-image:latest
    ports:
      - "8002:8000"
    environment:
      - YOLO_MODEL=/models/yolov8x.onnx
      - OCR_MODEL=/models/paddleocr
      - REDIS_URL=redis://redis:6379
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '4'
          memory: 8G
          nvidia.com/gpu: 1

  ai-deepfake:
    build: ./ai-services/deepfake
    image: pathik-ai-deepfake:latest
    ports:
      - "8003:8000"
    environment:
      - VIT_MODEL=/models/vit-deepfake
      - REDIS_URL=redis://redis:6379
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '2'
          memory: 4G
          nvidia.com/gpu: 1

  ai-clustering:
    build: ./ai-services/clustering
    image: pathik-ai-clustering:latest
    ports:
      - "8004:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - MONGODB_URI=mongodb://mongodb:27017/pathik
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '2'
          memory: 2G

  ai-predictive:
    build: ./ai-services/predictive
    image: pathik-ai-predictive:latest
    ports:
      - "8005:8000"
    environment:
      - MODEL_PATH=/models/lstm-prophet
      - REDIS_URL=redis://redis:6379
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '1'
          memory: 2G
```

---

## ৬. অপব্যবহার প্রতিরোধ কৌশল

### ৬.১ ট্রাস্ট স্কোর-ভিত্তিক অ্যাক্সেস কন্ট্রোল

| ফিচার | ন্যূনতম ট্রাস্ট স্কোর | অতিরিক্ত শর্ত |
|--------|----------------------|----------------|
| ফিড পোস্ট তৈরি | ০.০ (সবার জন্য) | ফোন ভেরিফিকেশন (deviceId sufficient) |
| ভোট দেওয়া | ০.৩ | - |
| SOS অ্যালার্ট (AI ডিটেক্টেড) | ০.৬ | ফোন ভেরিফিকেশন + ১/ঘন্টা রেট লিমিট |
| কমিউনিটি ইমার্জেন্সি ব্রডকাস্ট | ০.৬ | ফোন ভেরিফিকেশন |
| সাইটিং রিপোর্ট | ০.৪ | - |
| সাইটিং কনফার্ম ("আমিও দেখেছি") | ০.৪ | - |
| ফ্ল্যাগ (মিথ্যা চিহ্নিত) | ০.৬ | ৫/ঘন্টা রেট লিমিট |

### ৬.২ কমিউনিটি ফ্ল্যাগিং মেকানিজম

```
যখন কোনো অ্যালার্ট/পোস্ট ৫ জন বিশ্বস্ত ইউজার (trust > 0.6)
৫ মিনিটের মধ্যে "মিথ্যা" ফ্ল্যাগ করে:

→ অ্যালার্ট/পোস্টটি অটোমেটিক্যালি "suspicious" status পায়
→ ইউজারদের দেখানো হয়: "⚠️ এই রিপোর্টটি সন্দেহজনক হিসেবে চিহ্নিত হয়েছে"
→ অ্যাডমিন ড্যাশবোর্ডে নোটিফিকেশন যায়
→ অ্যাডমিন রিভিউ করে চূড়ান্ত সিদ্ধান্ত নেয়
→ যদি মিথ্যা প্রমাণিত হয়: রিপোর্টারের ট্রাস্ট স্কোর -০.৩ পেনাল্টি
→ যদি সত্য প্রমাণিত হয়: ফ্ল্যাগারদের ট্রাস্ট স্কোর -০.২ পেনাল্টি
```

### ৬.৩ AI-লেভেল ফিল্টারিং (পোস্ট করার আগেই)

```
১. ডিপফেক ডিটেক্টর: ছবি AI-জেনারেটেড কিনা চেক (স্প্যাম/ভুয়া অ্যালার্ট প্রতিরোধ)
   → > 0.7 confidence: অটো-রিজেক্ট, ইউজারকে সতর্কতা

২. ডুপ্লিকেট ডিটেক্টর: "ঠিক একই টেক্সট, একাধিক পোস্ট"
   → সেম টেক্সট ২৪ ঘন্টায় ২ বারের বেশি: ব্লক

৩. স্প্যাম ডিটেক্টর: "একই ব্যক্তি, ১০ মিনিটে ২০ বার পোস্ট"
   → রেট লিমিট + অ্যাকাউন্ট টেম্পরারি লক

৪. সেন্সিটিভ কন্টেন্ট ফিল্টার: অশ্লীল/হিংসাত্মক ছবি
   → NSFW ডিটেক্টর (YOLO-based) → অটো-হাইড

৫. লোকেশন ভ্যালিডেশন: GPS কোঅর্ডিনেট বাংলাদেশের মধ্যে কিনা
   → বাংলাদেশের বাইরে: ফ্ল্যাগ
```

### ৬.৪ রেট লিমিটিং (সার্ভার-সাইড)

| এন্ডপয়েন্ট | রেট | উইন্ডো |
|------------|-----|--------|
| POST /feed | ১০ বার | ১ ঘন্টা |
| POST /emergency/sos | ১ বার | ১ ঘন্টা |
| POST /emergency/*/sighting | ২০ বার | ১ ঘন্টা |
| POST /emergency/*/flag | ৫ বার | ১ ঘন্টা |
| POST /feed/vote | ৩০ বার | ১ ঘন্টা |
| POST /auth/register | ৩ বার | ১ ঘন্টা (per IP) |

### ৬.৫ মিথ্যা অ্যালার্টের জন্য সতর্কতা বার্তা

```
⚠️ সতর্কতা: মিথ্যা অ্যালার্ট দেওয়া একটি গুরুতর অপরাধ।
ভুয়া জরুরি অ্যালার্টের কারণে জরুরি সেবা বিলম্বিত হতে পারে,
যার ফলে কারো প্রাণহানি ঘটতে পারে।
মিথ্যা অ্যালার্ট দিলে আপনার অ্যাকাউন্ট স্থায়ীভাবে ব্লক করা হবে
এবং আইনগত ব্যবস্থা নেওয়া হবে।
```

### ৬.৬ পেন্ডিং রিভিউ সিস্টেম

```
AI যদি কনফিউজড হয় (confidence < 0.7):
→ পোস্ট "pending_review" status পায়
→ শুধু প্রশাসন দেখতে পায়
→ অ্যাডমিন ড্যাশবোর্ডে "AI রিভিউ প্রয়োজন" সেকশনে দেখায়
→ অ্যাডমিন approve/রিজেক্ট করতে পারে
→ approve করলে: ফিডে প্রকাশ, ট্রাস্ট স্কোর আপডেট
→ রিজেক্ট করলে: পোস্ট ডিলিট, রিপোর্টারের ট্রাস্ট স্কোর -০.১
```

---

## ৭. প্রাইভেসি ও নৈতিকতা

### ৭.১ ডেটা এনক্রিপশন

| ডেটা টাইপ | এনক্রিপশন | বিবরণ |
|-----------|-----------|--------|
| পাসওয়ার্ড | bcrypt (12 rounds) | হ্যাশড, select: false |
| ফোন নম্বর | AES-256-GCM | এনক্রিপ্টেড (শুধু প্রশাসন দেখতে পাবে) |
| লোকেশন ডেটা | - | শুধু জিও-ইনডেক্সড, প্লেইন টেক্সট (প্রয়োজনীয়) |
| ইমেজ/ভিডিও | - | Supabase Storage (private bucket, signed URLs) |
| JWT টোকেন | HS256 | সাইনড, ১৫ মিনিট এক্সপায়ারি |
| রিফ্রেশ টোকেন | HS256 | সাইনড, ৭ দিন এক্সপায়ারি |

### ৭.২ RBAC (Role-Based Access Control)

| রোল | বিবরণ | অনুমতি |
|-----|--------|--------|
| `user` | সাধারণ ইউজার | ফিড পোস্ট, ভোট, সাইটিং, SOS (trust >= 0.6) |
| `verified_user` | ফোন ভেরিফাইড ইউজার | সব user + emergency broadcast |
| `police` | পুলিশ (ভেরিফাইড) | অফিসিয়াল অ্যালার্ট, ড্যাশবোর্ড (এলাকা-ভিত্তিক) |
| `rab` | র্যাব (ভেরিফাইড) | অফিসিয়াল অ্যালার্ট, ড্যাশবোর্ড (এলাকা-ভিত্তিক) |
| `admin` | সিস্টেম অ্যাডমিন | সবকিছু, ইউজার ম্যানেজমেন্ট, সিস্টেম কনফিগ |

### ৭.৩ অ্যানোনিমিটি নীতি

| ফিচার | পাবলিক দেখবে | প্রশাসন দেখবে |
|--------|--------------|----------------|
| ফিড পোস্ট | message, location, time | authorId, deviceId |
| SOS অ্যালার্ট | type, location, time, attributes | reporterId, phone |
| সাইটিং রিপোর্ট | location, time, "কনফার্মড x বার" | reporterId, deviceId |
| ইউজার প্রোফাইল | displayName, avatar, trustScore | email, phone, role |

### ৭.৪ নৈতিকতা নীতি

```
১. ফেস রিকগনিশন করা হবে না
   → শুধু শারীরিক অ্যাট্রিবিউট ট্যাগিং (পোশাক, রং, বয়স গ্রুপ)

২. প্রতিটি অ্যালার্টে ভিজিল্যান্টিজম বিরোধী ডিসক্লেইমার:
   "⚠️ এই অ্যাপটি আইনশৃঙ্খলা বাহিনীকে সহায়তা করার জন্য তৈরি।
    আইন নিজের হাতে তোলা বা কোনো সন্দেহভাজন ব্যক্তিকে
    নিজে ধরা/শাস্তি দেওয়া সম্পূর্ণ নিষিদ্ধ।
    শুধু তথ্য রিপোর্ট করুন, বাকি ব্যবস্থা প্রশাসন নেবে।"

৩. ডেটা রিটেনশন:
   → সাধারণ ফিড পোস্ট: ৩০ দিন
   → অ্যাকটিভ অ্যালার্ট: রিজল্ভ হওয়া পর্যন্ত
   → রিজল্ভড অ্যালার্ট: ৯০ দিন
   → নোটিফিকেশন: ৩০ দিন
   → অডিট লগ: ১ বছর

৪. ইউজারের ডেটা ডিলিটের অধিকার:
   → ইউজার নিজের অ্যাকাউন্ট ডিলিট করতে পারবে
   → সব পার্সোনাল ডেটা মুছে যাবে
   → শুধু অ্যানোনিমাস ফিড পোস্ট থাকবে (authorId null)
```

---

## ৮. প্রোটোটাইপ ডেভেলপমেন্ট রোডম্যাপ (৩ মাস)

### মাস ১: ফাউন্ডেশন (Week 1-4)

| সপ্তাহ | কাজ | ডেলিভারেবল | স্ট্যাটাস চেক |
|--------|-----|------------|---------------|
| **Week 1** | বিদ্যমান কোডবেস রিফ্যাক্টর | MongoDB মাইগ্রেশন কমপ্লিট, Error handling improved | সব API কাজ করছে কিনা টেস্ট |
| **Week 2** | ইউজার মডেল এক্সটেনশন + RBAC | Trust score, phone verification, official verification API | POSTMAN দিয়ে টেস্ট |
| **Week 3** | Emergency Alert CRUD + Geo-fencing | SOS API, Geo-query, 2000m radius notification | লোকেশন-বেসড কোয়েরি ওয়ার্কিং |
| **Week 4** | Sighting system + Community flagging | Sighting API, Flag mechanism, Auto-hide logic | ফ্ল্যাগিং মেকানিজম টেস্ট |

### মাস ২: AI ইন্টিগ্রেশন (Week 5-8)

| সপ্তাহ | কাজ | ডেলিভারেবল | স্ট্যাটাস চেক |
|--------|-----|------------|---------------|
| **Week 5** | Python FastAPI microservice setup + NLP Classifier | BanglaBERT API, Text classification pipeline | বাংলা টেক্সট ক্লাসিফিকেশন টেস্ট |
| **Week 6** | Image analysis + Deepfake detector | YOLO API, ViT API, OCR pipeline | ইমেজ অ্যানালাইসিস টেস্ট |
| **Week 7** | Credibility scoring + HDBSCAN clustering | Bayesian trust score, Sighting clustering | ক্লাস্টারিং আউটপুট ভ্যালিডেশন |
| **Week 8** | Predictive analytics + BullMQ integration | LSTM/Prophet model, Queue pipeline | এন্ড-টু-এন্ড ফ্লো টেস্ট |

### মাস ৩: ফ্রন্টএন্ড + ড্যাশবোর্ড + ডেপ্লয়মেন্ট (Week 9-12)

| সপ্তাহ | কাজ | ডেলিভারেবল | স্ট্যাটাস চেক |
|--------|-----|------------|---------------|
| **Week 9** | Admin dashboard (React + Leaflet) | Heatmap, Sighting clusters, Alert management, Pending reviews | UI টেস্ট |
| **Week 10** | Push notification (FCM) + WebSocket | Real-time alerts, Socket.IO events, FCM integration | নোটিফিকেশন ডেলিভারি টেস্ট |
| **Week 11** | PWA enhancement + Responsive design | Offline support (Service Worker), Home screen install, Push notifications, Geolocation API | PWA Lighthouse audit > 90 |
| **Week 12** | Testing + Deployment + Documentation | Load testing (k6), Docker compose, API docs (Swagger), Deployment script | লোড টেস্ট রিপোর্ট |

### মাইলস্টোনসমূহ

```
M1 (Week 4):  ✅ বেসিক সিস্টেম রেডি — ইউজার রেজিস্ট্রেশন, ফিড পোস্ট, SOS অ্যালার্ট
M2 (Week 8):  ✅ AI ইন্টিগ্রেটেড — অটোমেটিক ক্লাসিফিকেশন, ইমেজ অ্যানালাইসিস, ট্রাস্ট স্কোর
M3 (Week 12): ✅ ফুল সিস্টেম — অ্যাডমিন ড্যাশবোর্ড, পুশ নোটিফিকেশন, PWA ওয়েব অ্যাপ
```

---

## ৯. পিচ ডেক/উপস্থাপনার কাঠামো

### স্লাইড ১: কভার
```
╔══════════════════════════════════════════════════════════════╗
║                     🛡️ Pathik                               ║
║                                                              ║
║     বাংলাদেশের গণপরিবহনের জন্য AI-চালিত নিরাপত্তা প্ল্যাটফর্ম   ║
║                                                              ║
║          "প্রত্যেক যাত্রীর জন্য একজন অভিভাবক"                  ║
║                                                              ║
║                    [টিমের নাম]                                ║
║                    [ইভেন্টের নাম]                             ║
╚══════════════════════════════════════════════════════════════╝
```

### স্লাইড ২: সমস্যা
```
📉 বাংলাদেশের গণপরিবহন সংকট

• প্রতিদিন গড়ে ১২টি বাস দুর্ঘটনা (বাংলাদেশ সড়ক পরিবহন কর্তৃপক্ষ)
• ৬০% নারী গণপরিবহনে ইভটিজিংয়ের শিকার (বাংলাদেশ পরিসংখ্যান ব্যুরো)
• জরুরি মুহূর্তে সাহায্য পেতে গড়ে ২৫-৩০ মিনিট সময় লাগে
• মিথ্যা তথ্য ও গুজব ছড়ানোর প্রবণতা (সোশ্যাল মিডিয়ায়)
• পুলিশ/র্যাবের জন্য রিয়েল-টাইম তথ্যের অভাব
```

### স্লাইড ৩: সমাধান
```
💡 Pathik — ৪টি মূল ফিচার

┌─────────────────────────────────────────────────────────────┐
│  ১. AI-চালিত অটোমেটিক ইমার্জেন্সি ডিটেকশন                   │
│     → ইউজার শুধু পোস্ট করে, AI নিজেই বুঝে জরুরি অবস্থা       │
│     → অটোমেটিক SOS অ্যালার্ট + জিওফেন্সিং + পুশ নোটিফিকেশন  │
├─────────────────────────────────────────────────────────────┤
│  ২. ক্রাউডসোর্সড ভেরিফাইড ইনফরমেশন ফিড                     │
│     → যানজট, চাঁদাবাজি, পুলিশ চেকপোস্টের রিপোর্ট             │
│     → AI-চালিত বিশ্বাসযোগ্যতা স্কোরিং + মিসইনফরমেশন ফিল্টার  │
├─────────────────────────────────────────────────────────────┤
│  ৩. কমিউনিটি ইমার্জেন্সি ব্রডকাস্ট                          │
│     → নিখোঁজ/চুরি/পালানো অপরাধী: ৫ কিমি এলাকায় ব্রডকাস্ট     │
│     → লাইভ সাইটিং সিস্টেম (দেখেছি/আমিও দেখেছি)              │
├─────────────────────────────────────────────────────────────┤
│  ৪. প্রশাসনিক ড্যাশবোর্ড                                    │
│     → রিয়েল-টাইম হিটম্যাপ, সাইটিং ক্লাস্টার, অ্যালার্ট ম্যানেজ │
│     → পুলিশ/র্যাব ভেরিফিকেশন + অফিসিয়াল অ্যালার্ট           │
└─────────────────────────────────────────────────────────────┘
```

### স্লাইড ৪: AI প্রযুক্তি
```
🧠 AI টেকনোলজি স্ট্যাক

┌─────────────────────────────────────────────────────────────────┐
│  🔤 NLP (BanglaBERT)                                           │
│  → বাংলা টেক্সট থেকে অটোমেটিক ক্যাটেগরি, সিভিয়ারিটি,          │
│    ইমার্জেন্সি ডিটেকশন (১৫ ক্লাস, F1 > 0.85)                  │
├─────────────────────────────────────────────────────────────────┤
│  👁️ কম্পিউটার ভিশন (YOLOv8 + PaddleOCR)                       │
│  → গাড়ি/ব্যক্তি শনাক্তকরণ, নম্বর প্লেট OCR, অ্যাট্রিবিউট ট্যাগিং│
├─────────────────────────────────────────────────────────────────┤
│  🎭 ডিপফেক ডিটেক্টর (Vision Transformer)                      │
│  → AI-জেনারেটেড ছবি শনাক্তকরণ (99.2% accuracy)                │
├─────────────────────────────────────────────────────────────────┤
│  📊 স্প্যাটিও-টেম্পোরাল ক্লাস্টারিং (HDBSCAN)                  │
│  → একই এলাকার সাইটিং ক্লাস্টার করে বিশ্বাসযোগ্যতা নির্ণয়       │
├─────────────────────────────────────────────────────────────────┤
│  ⭐ ক্রেডিবিলিটি স্কোরিং (Bayesian Averaging)                  │
│  → ডায়নামিক ট্রাস্ট স্কোর (০-১) প্রতিটি ইউজারের জন্য           │
├─────────────────────────────────────────────────────────────────┤
│  🔮 প্রেডিক্টিভ অ্যানালাইটিক্স (LSTM + Prophet)                │
│  → ২৪-৪৮ ঘন্টার মধ্যে দুর্ঘটনা/অপরাধের সম্ভাব্যতা পূর্বাভাস    │
└─────────────────────────────────────────────────────────────────┘
```

### স্লাইড ৫: ইউজার জার্নি
```
👤 ইউজার এক্সপেরিয়েন্স

┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: ইউজার পোস্ট করে                                       │
│  "মিরপুর ১০ এ ছিনতাই! প্লিজ সাহায্য করুন!"                     │
│  + GPS লোকেশন + ছবি                                            │
│  (কোনো টাইপ/ক্যাটেগরি সিলেক্ট করতে হয় না)                      │
├─────────────────────────────────────────────────────────────────┤
│  STEP 2: AI ২ সেকেন্ডের মধ্যে প্রসেস করে                        │
│  → ক্যাটেগরি: robbery                                          │
│  → ইমার্জেন্সি: true (কনফিডেন্স ০.৯৪)                          │
│  → ইমেজ: ব্যক্তি শনাক্ত, নম্বর প্লেট OCR                       │
├─────────────────────────────────────────────────────────────────┤
│  STEP 3: অটোমেটিক অ্যাকশন                                     │
│  → ২০০০ মিটার রেডিয়াসে পুশ নোটিফিকেশন                          │
│  → পুলিশ/র্যাব ড্যাশবোর্ডে রিয়েল-টাইম অ্যালার্ট                 │
│  → "দেখেছেন?" বাটন সহ কমিউনিটি ব্রডকাস্ট                       │
├─────────────────────────────────────────────────────────────────┤
│  STEP 4: লাইভ সাইটিং ট্র্যাকিং                                 │
│  → কেউ "দেখেছি" ক্লিক করলে টাইমলাইন আপডেট                      │
│  → AI ক্লাস্টারিং: কোন দিকে যাচ্ছে, কত দ্রুত                    │
│  → একাধিক কনফার্মেশন → বিশ্বাসযোগ্যতা বৃদ্ধি                   │
└─────────────────────────────────────────────────────────────────┘
```

### স্লাইড ৬: অপব্যবহার প্রতিরোধ
```
🛡️ মাল্টি-লেয়ার প্রোটেকশন

┌─────────────────────────────────────────────────────────────────┐
│  লেয়ার ১: AI প্রি-ফিল্টারিং                                    │
│  → ডিপফেক ডিটেকশন, ডুপ্লিকেট ডিটেকশন, স্প্যাম ডিটেকশন         │
│  → কনফিডেন্স < ০.৭: পেন্ডিং রিভিউ                              │
├─────────────────────────────────────────────────────────────────┤
│  লেয়ার ২: ট্রাস্ট স্কোর সিস্টেম                                │
│  → SOS অ্যালার্ট: trust >= ০.৬ + ফোন ভেরিফিকেশন                │
│  → ফ্ল্যাগ: trust >= ০.৬                                       │
│  → মিথ্যা প্রমাণিত: -০.৩ পেনাল্টি                              │
├─────────────────────────────────────────────────────────────────┤
│  লেয়ার ৩: কমিউনিটি ফ্ল্যাগিং                                   │
│  → ৫ জন বিশ্বস্ত ইউজার ৫ মিনিটে ফ্ল্যাগ করলে অটো-সাসপেন্ড      │
│  → অ্যাডমিন রিভিউ + চূড়ান্ত সিদ্ধান্ত                          │
├─────────────────────────────────────────────────────────────────┤
│  লেয়ার ৪: রেট লিমিটিং                                         │
│  → SOS: ১/ঘন্টা, ফ্ল্যাগ: ৫/ঘন্টা, পোস্ট: ১০/ঘন্টা            │
│  → IP-বেসড + ইউজার-বেসড রেট লিমিটিং                           │
└─────────────────────────────────────────────────────────────────┘
```

### স্লাইড ৭: প্রাইভেসি ও নৈতিকতা
```
🔒 প্রাইভেসি বাই ডিজাইন

┌─────────────────────────────────────────────────────────────────┐
│  ✅ ফেস রিকগনিশন নেই → শুধু শারীরিক অ্যাট্রিবিউট ট্যাগিং       │
│  ✅ অ্যানোনিমাস রিপোর্টিং → সাধারণ ফিড পোস্টে নাম গোপন         │
│  ✅ RBAC → রোল-বেসড অ্যাক্সেস কন্ট্রোল                         │
│  ✅ ডেটা এনক্রিপশন → AES-256 + bcrypt                          │
│  ✅ অটো-ডিলিট → ৩০-৯০ দিন পর ডেটা মুছে যায়                    │
│  ✅ ভিজিল্যান্টিজম বিরোধী ডিসক্লেইমার → সব অ্যালার্টে           │
└─────────────────────────────────────────────────────────────────┘
```

### স্লাইড ৮: টেকনিক্যাল আর্কিটেকচার
```
🏗️ সিস্টেম আর্কিটেকচার

┌──────────────────┐   ┌──────────────────┐
│  Web App (PWA)   │   │ Admin Dashboard  │
│  (React + Vite + │   │ (React + Leaflet)│
│   Geolocation +  │   │                  │
│   Web Push API)  │   │                  │
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
           ┌────────────────┐
           │  Express.js    │
           │  + TypeScript  │
           │  + MongoDB     │
           └────────┬───────┘
                    │
                    ▼
           ┌────────────────┐
           │  Python AI     │
           │  Microservices │
           │  (FastAPI)     │
           │                │
           │  BanglaBERT    │
           │  YOLO + OCR    │
           │  ViT + HDBSCAN │
           │  LSTM/Prophet  │
           └────────────────┘
```

### স্লাইড ৯: ইমপ্যাক্ট
```
📊 প্রত্যাশিত ইমপ্যাক্ট

┌─────────────────────────────────────────────────────────────────┐
│  🎯 জরুরি সেবা: ২৫-৩০ মিনিট → ২-৩ মিনিটে নামিয়ে আনা           │
│     (AI অটো-ডিটেকশন + জিওফেন্সিং + পুশ নোটিফিকেশন)            │
├─────────────────────────────────────────────────────────────────┤
│  🎯 নির্ভরযোগ্য তথ্য: মিসইনফরমেশন ৮০% কমানো                   │
│     (AI ফিল্টারিং + ট্রাস্ট স্কোর + কমিউনিটি ভেরিফিকেশন)       │
├─────────────────────────────────────────────────────────────────┤
│  🎯 দুর্ঘটনা প্রতিরোধ: প্রেডিক্টিভ অ্যানালাইটিক্সের মাধ্যমে     │
│     হাই-রিস্ক এলাকা চিহ্নিত করে প্রশাসনকে সতর্ক করা            │
├─────────────────────────────────────────────────────────────────┤
│  🎯 প্রশাসনের সক্ষমতা: রিয়েল-টাইম ডেটা + হিটম্যাপ + ক্লাস্টার  │
│     → দ্রুত ও কার্যকর সিদ্ধান্ত গ্রহণ                          │
└─────────────────────────────────────────────────────────────────┘
```

### স্লাইড ১০: রোডম্যাপ
```
🗺️ ডেভেলপমেন্ট রোডম্যাপ

মাস ১: ফাউন্ডেশন
├── Week 1-2: ব্যাকএন্ড রিফ্যাক্টর + ইউজার সিস্টেম
├── Week 3: Emergency Alert + Geo-fencing
└── Week 4: Sighting + Flagging System

মাস ২: AI ইন্টিগ্রেশন
├── Week 5-6: NLP Classifier + Image Analysis
├── Week 7: Credibility Scoring + Clustering
└── Week 8: Predictive Analytics + Queue System

মাস ৩: ফ্রন্টএন্ড + ডেপ্লয়মেন্ট
├── Week 9: Admin Dashboard
├── Week 10: Push Notification + WebSocket
├── Week 11: Mobile App (React Native)
└── Week 12: Testing + Deployment

পাইলট: ঢাকা শহর → স্কেল: সারা বাংলাদেশ
```

### স্লাইড ১১: টিম
```
👥 আমাদের টিম

[টিম মেম্বারদের নাম ও ভূমিকা]

• [নাম] — AI/ML Engineer
• [নাম] — Full Stack Developer
• [নাম] — Frontend Developer (PWA)
• [নাম] — Product Manager

📧 যোগাযোগ: [ইমেইল]
🌐 ওয়েবসাইট: [URL]
```

---

## পরিশিষ্ট: বিদ্যমান কোডবেসের অবস্থা ও প্রয়োজনীয় পরিবর্তন

### বর্তমানে যা আছে (ইতিমধ্যে তৈরি)

| কম্পোনেন্ট | ফাইল/মডিউল | অবস্থা |
|-----------|------------|--------|
| Express.js সার্ভার | `backend/src/app.ts` | ✅ ওয়ার্কিং |
| Auth সিস্টেম | `backend/src/modules/auth/` | ✅ JWT + bcrypt |
| ফিড পোস্ট CRUD | `backend/src/modules/feed/` | ✅ MongoDB + ভোটিং |
| কমিউনিটি রুট/স্টপ | `backend/src/modules/community/` | ✅ JSON ফাইল-ভিত্তিক |
| MongoDB কানেকশন | `backend/src/config/db.ts` | ✅ |
| Redis কানেকশন | `backend/src/config/redis.ts` | ✅ |
| Supabase কানেকশন | `backend/src/config/supabase.ts` | ✅ |
| ফ্রন্টএন্ড (React) | `frontend/src/` | ✅ বেসিক UI |
| AI API keys | `backend/.env` | ✅ Groq/OpenRouter/NVIDIA |

### যে পরিবর্তনগুলো প্রয়োজন

| পরিবর্তন | বর্তমান | প্রস্তাবিত |
|-----------|---------|------------|
| **User Model** | role: user/admin | role: user/admin/police/rab + trustScore + phone + jurisdiction |
| **FeedPost Model** | type: user-selected | type: AI-detected + aiCategory + aiConfidence + alertId |
| **পোস্ট ফ্লো** | ইউজার টাইপ সিলেক্ট করে | ইউজার শুধু পোস্ট করে, AI ক্লাসিফাই করে |
| **Community Module** | JSON ফাইল-ভিত্তিক | MongoDB-তে মাইগ্রেট |
| **AI Integration** | শুধু API key কনফিগ | Python FastAPI microservices + BullMQ queue |
| **Emergency Module** | নেই | নতুন তৈরি: Alert + Sighting + Geo-fencing |
| **Admin Dashboard** | নেই | নতুন তৈরি: React + Leaflet |
| **Push Notification** | নেই | FCM integration |
| **WebSocket** | নেই | Socket.IO integration |

---

> **ডকুমেন্ট ভার্সন:** 1.0
> **শেষ আপডেট:** জুলাই ২০২৬
> **প্রস্তুতকারক:** Pathik টিম