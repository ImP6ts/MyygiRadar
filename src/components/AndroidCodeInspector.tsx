import React, { useState } from 'react';
import { Code, FileText, Shield, Layers, Copy, Check } from 'lucide-react';

interface CodeSnippet {
  title: string;
  category: 'Moderation & Security' | 'Kotlin Domain & UseCases' | 'Compose UI' | 'Security & Firestore' | 'Gradle & Manifest';
  path: string;
  code: string;
}

const ANDROID_FILES: CodeSnippet[] = [
  {
    title: 'AdminConfig.kt',
    category: 'Moderation & Security',
    path: 'app/src/main/java/ee/myygi/radar/data/config/AdminConfig.kt',
    code: `package ee.myygi.radar.data.config

/**
 * Configurable list of administrator Firebase UIDs.
 * Security is strictly validated server-side by firestore.rules.
 */
object AdminConfig {
    private val ADMIN_UID_WHITELIST = setOf(
        "admin_myygiradar_master",
        "arletpdr_admin_uid",
        "dev_test_admin_uid"
    )

    fun isAdmin(uid: String?): Boolean {
        if (uid.isNullOrBlank()) return false
        return ADMIN_UID_WHITELIST.contains(uid)
    }
}`
  },
  {
    title: 'DetectDuplicateLocationUseCase.kt',
    category: 'Moderation & Security',
    path: 'app/src/main/java/ee/myygi/radar/domain/usecase/DetectDuplicateLocationUseCase.kt',
    code: `package ee.myygi.radar.domain.usecase

import ee.myygi.radar.domain.model.Location
import kotlin.math.*

class DetectDuplicateLocationUseCase(
    private val proximityThresholdMeters: Double = 150.0
) {
    data class DuplicateCandidate(
        val existingLocation: Location,
        val distanceMeters: Double,
        val nameSimilarity: Float,
        val reason: String
    )

    fun execute(
        candidateName: String,
        candidateLat: Double,
        candidateLng: Double,
        existingLocations: List<Location>
    ): List<DuplicateCandidate> {
        val duplicates = mutableListOf<DuplicateCandidate>()
        val cleanCandidateName = candidateName.trim().lowercase()

        for (loc in existingLocations) {
            val dist = calculateDistanceMeters(candidateLat, candidateLng, loc.latitude, loc.longitude)
            val nameSim = calculateSimilarity(cleanCandidateName, loc.name.trim().lowercase())

            if (dist <= proximityThresholdMeters) {
                duplicates.add(
                    DuplicateCandidate(
                        existingLocation = loc,
                        distanceMeters = dist,
                        nameSimilarity = nameSim,
                        reason = "Asukoht on liiga lähedal olemasolevale poele (\${dist.roundToInt()}m)"
                    )
                )
            } else if (nameSim >= 0.85f && dist <= 2000.0) {
                duplicates.add(
                    DuplicateCandidate(
                        existingLocation = loc,
                        distanceMeters = dist,
                        nameSimilarity = nameSim,
                        reason = "Sarnase nimega pood asub läheduses (\${(dist/1000).format(1)}km)"
                    )
                )
            }
        }
        return duplicates.sortedBy { it.distanceMeters }
    }
}`
  },
  {
    title: 'LocationRepository.kt (Moderation)',
    category: 'Kotlin Domain & UseCases',
    path: 'app/src/main/java/ee/myygi/radar/data/repository/LocationRepository.kt',
    code: `package ee.myygi.radar.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import ee.myygi.radar.domain.model.*
import kotlinx.coroutines.tasks.await

class LocationRepository(
    private val firestore: FirebaseFirestore
) {
    // Normal users ONLY get APPROVED locations for the public map
    suspend fun getApprovedLocations(): List<Location> {
        val snapshot = firestore.collection("locations")
            .whereEqualTo("status", "APPROVED")
            .get()
            .await()
        return snapshot.documents.mapNotNull { it.toObject(LocationEntity::class.java)?.toDomain(it.id) }
    }

    // Normal user submits location -> MUST be PENDING
    suspend fun submitNewLocation(
        name: String,
        address: String,
        lat: Double,
        lng: Double,
        type: LocationType,
        userUid: String
    ): String {
        val newDoc = firestore.collection("locations").document()
        val data = hashMapOf(
            "name" to name.trim(),
            "address" to address.trim(),
            "latitude" to lat,
            "longitude" to lng,
            "type" to type.displayName,
            "submittedBy" to userUid,
            "submittedAt" to System.currentTimeMillis(),
            "status" to "PENDING",
            "reviewedBy" to null,
            "reviewedAt" to null
        )
        newDoc.set(data).await()
        return newDoc.id
    }

    // Admin approves location -> status APPROVED
    suspend fun approveLocation(locationId: String, adminUid: String) {
        firestore.collection("locations").document(locationId)
            .update(
                mapOf(
                    "status" to "APPROVED",
                    "reviewedBy" to adminUid,
                    "reviewedAt" to System.currentTimeMillis()
                )
            ).await()
    }

    // Admin rejects location -> status REJECTED
    suspend fun rejectLocation(locationId: String, adminUid: String) {
        firestore.collection("locations").document(locationId)
            .update(
                mapOf(
                    "status" to "REJECTED",
                    "reviewedBy" to adminUid,
                    "reviewedAt" to System.currentTimeMillis()
                )
            ).await()
    }
}`
  },
  {
    title: 'firestore.rules',
    category: 'Security & Firestore',
    path: 'firestore.rules',
    code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() && request.auth.uid in [
        'admin_myygiradar_master',
        'arletpdr_admin_uid',
        'dev_test_admin_uid'
      ];
    }

    // LOCATIONS COLLECTION
    match /locations/{locationId} {
      // Normal users can only read APPROVED locations; admins can read all
      allow read: if resource == null || resource.data.status == 'APPROVED' || isAdmin();

      // Normal users can submit new locations ONLY with status == 'PENDING'
      allow create: if isSignedIn()
        && request.resource.data.status == 'PENDING'
        && request.resource.data.submittedBy == request.auth.uid
        && request.resource.data.reviewedBy == null
        && request.resource.data.reviewedAt == null;

      // Only administrators can approve or reject (update) locations
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // ISSUE REPORTS
    match /location_issues/{issueId} {
      allow create: if isSignedIn();
      allow read, update, delete: if isAdmin();
    }

    // CROWDSOURCED PRESENCE REPORTS
    match /reports/{reportId} {
      allow read: if true;
      allow create: if isSignedIn()
        && request.resource.data.anonymousUserId == request.auth.uid
        && request.resource.data.status in ['PRESENT', 'NOT_PRESENT'];
      allow update, delete: if false;
    }
  }
}`
  },
  {
    title: 'AddLocationBottomSheet.kt',
    category: 'Compose UI',
    path: 'app/src/main/java/ee/myygi/radar/ui/locations/AddLocationBottomSheet.kt',
    code: `@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddLocationBottomSheet(
    userLat: Double,
    userLng: Double,
    existingLocations: List<Location>,
    onDismiss: () -> Unit,
    onSubmit: (name: String, address: String, lat: Double, lng: Double, type: LocationType) -> Unit
) {
    // Step 1: Input details & suggest GPS coordinates
    // Step 2: Adjust pin on interactive map
    // Step 3: Duplicate detection warning banner
    // Step 4: Submission with confirmation toast "Esitatud kinnitamiseks"
}`
  },
  {
    title: 'AdminModerationScreen.kt',
    category: 'Compose UI',
    path: 'app/src/main/java/ee/myygi/radar/ui/admin/AdminModerationScreen.kt',
    code: `@Composable
fun AdminModerationScreen(
    viewModel: MapViewModel,
    onNavigateBack: () -> Unit
) {
    // Shows list of all PENDING locations
    // Each item shows: name, address, type, submittedAt, submitter UID, coordinates
    // Action buttons: [KINNITA] and [LÜKKA TAGASI]
    // Shows reported location issues
}`
  }
];

export const AndroidCodeInspector: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeSnippet>(ANDROID_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 pb-28">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>Android Studio & Firebase Arhitektuur</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Modereeritud asukohasüsteemi, duplikaadituvastuse ja administraatori turvareeglite kood.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* File selector sidebar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 space-y-2 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
            Loodud lähtekood
          </div>
          <div className="space-y-1">
            {ANDROID_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold border border-blue-200 dark:border-blue-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <span className="truncate">{file.title}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{file.category}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code viewer */}
        <div className="md:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 text-slate-100 overflow-hidden flex flex-col shadow-lg">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300 truncate">{selectedFile.path}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopeeritud' : 'Kopeeri'}</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto text-slate-200 leading-relaxed max-h-[500px]">
            {selectedFile.code}
          </pre>
        </div>
      </div>
    </div>
  );
};
