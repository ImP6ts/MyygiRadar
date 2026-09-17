# Müügiradar Eesti (Sales Rep Radar) — Android MVP

Produktsiooniarhitektuuriga Androidi rakendus ja reaalajas veebipõhine interaktiivne eelvaade, mis kaardistab ühisloome (crowdsourcing) teel müügiesindajate kohalolu Eesti kaubanduskeskustes ja jaepoodides (nt GO3, Telia, Elisa, Luminor).

## 🔒 Privaatsuspõhimõte
Rakendus **EI** tuvasta, pildista, nimeta ega jälgi ühtegi konkreetset inimest. Jälgitakse eranditult juriidiliste isikute avalikke müügipunkte ja kohalolu staatust kaubanduskeskustes. Kasutaja raportid on seotud privaatse anonüümse Firebase UID-ga ilma isikuandmeteta.

---

## 🛠 Tehnoloogiline pinu (Android Studio)
- **Keel**: Kotlin 1.9+
- **UI raamistik**: Jetpack Compose + Material 3
- **Arhitektuur**: Clean Architecture (MVVM, Repository Pattern, Kotlin Coroutines, StateFlow)
- **Kaardid**: Google Maps SDK for Android & `maps-compose`
- **Asukohateenused**: Android FusedLocationProviderClient & Geofencing API
- **Autentimine**: Firebase Authentication (Anonüümne autentimine)
- **Andmebaas**: Firebase Firestore (serveri ajatemplid, optimeeritud turvareeglid)
- **Võrguühenduseta tugi**: Kohalik järjekorrasüsteem (Offline Queue) automaatse taassünkroonimisega

---

## 📁 Projekti struktuur

```
app/
├── src/main/
│   ├── AndroidManifest.xml
│   ├── java/ee/myygi/radar/
│   │   ├── MyygiRadarApp.kt               // Rakenduse klass
│   │   ├── MainActivity.kt                // Põhiaken ja navigeerimine
│   │   ├── domain/
│   │   │   ├── model/                     // Location, Company, Report, SalesPointStatus
│   │   │   └── usecase/
│   │   │       ├── AggregateStatusUseCase.kt        // Ajalise hääbumise ja püsiva kohalolu algoritm
│   │   │       └── ValidateReportLocationUseCase.kt // GPS raadiuse ja täpsuse valideerimine
│   │   ├── data/
│   │   │   ├── model/FirestoreEntities.kt           // Firestore andmemudelid
│   │   │   ├── local/OfflineReportQueue.kt          // Kohalik võrguühenduseta järjekord
│   │   │   └── repository/
│   │   │       ├── LocationRepository.kt            // Tallinna ja Tartu algandmed + Firestore
│   │   │       ├── ReportRepository.kt              // Raportite edastus ja sünkroniseerimine
│   │   │       └── AuthRepository.kt                // Anonüümne Firebase sessioon
│   │   ├── services/
│   │   │   ├── location/LocationTracker.kt          // FusedLocation täppisasukoht
│   │   │   ├── geofence/GeofenceManager.kt          // Android Geofencing registreerimine
│   │   │   ├── geofence/GeofenceBroadcastReceiver.kt// Keskusesse saabumise vastuvõtja
│   │   │   └── notifications/NotificationHelper.kt  // Teavitused cooldown-kontrolliga
│   │   └── ui/
│   │       ├── theme/                     // Material 3 teema, värvid ja tüpograafia
│   │       ├── navigation/Screen.kt       // Kaart, Läheduses, Seaded
│   │       ├── components/StatusBadge.kt  // Kohal / Tõenäoliselt kohal / Teadmata
│   │       ├── map/                       // MapScreen ja MapViewModel
│   │       ├── nearby/                    // NearbyScreen otsingu ja vahemaa sorteerimisega
│   │       ├── reports/                   // Raporteerimise dialoog (PRESENT / NOT PRESENT)
│   │       └── settings/                  // Õigused, saabumise kontroll, privaatsus
│   └── res/values/
│       ├── strings.xml                    // Eestikeelsed kasutajaliidese tekstid
│       ├── colors.xml
│       └── themes.xml
├── build.gradle.kts
└── google-services.json.example
```

---

## ⚙️ Konfigureerimine Android Studios
1. **Klooni / ava projekt**: Ava projekti juurkaust Android Studio Electric Eel või uuemas.
2. **Google Maps API võti**:
   - Hangi Google Cloud konsoolist Google Maps API võti.
   - Lisa oma `local.properties` faili rida:
     `MAPS_API_KEY=AIzaSy...`
3. **Firebase konfigureerimine**:
   - Loo Firebase konsoolis uus Androidi projekt paketinimega `ee.myygi.radar`.
   - Lae alla `google-services.json` ning aseta see kausta `app/google-services.json`.
   - Luba Firebase konsoolis **Anonymous Authentication** ja **Cloud Firestore**.
   - Rakenda kaasasolevad `firestore.rules`.
