package ee.myygi.radar.data.repository

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import ee.myygi.radar.data.config.AdminConfig
import ee.myygi.radar.domain.model.*
import ee.myygi.radar.domain.usecase.DetectDuplicateLocationUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import java.util.UUID

/**
 * Manages Estonian shopping centre and retail locations.
 * Implements strict moderation:
 * - Public map displays ONLY locations with status = APPROVED.
 * - Regular users submit locations with status = PENDING.
 * - Only verified Administrator UIDs can approve or reject locations.
 */
class LocationRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val duplicateDetector: DetectDuplicateLocationUseCase = DetectDuplicateLocationUseCase()
) {

    val defaultCompanies: List<Company> = listOf(
        Company(id = "go3", name = "GO3", category = "TELECOM_MEDIA"),
        Company(id = "telia", name = "Telia", category = "TELECOM"),
        Company(id = "elisa", name = "Elisa", category = "TELECOM"),
        Company(id = "luminor", name = "Luminor", category = "BANKING_FINANCE"),
        Company(id = "other", name = "Muu ettevõte", category = "OTHER")
    )

    private val seededLocations: List<Location> = listOf(
        Location(
            id = "tallinn_ulemiste",
            name = "Ülemiste Keskus",
            address = "Suur-Sõjamäe 4, Tallinn",
            city = "Tallinn",
            latitude = 59.4218,
            longitude = 24.7937,
            geofenceRadiusMeters = 260f,
            type = LocationType.SHOPPING_CENTRE.name,
            status = LocationStatus.APPROVED,
            activeCompanies = defaultCompanies
        ),
        Location(
            id = "tallinn_kristiine",
            name = "Kristiine Keskus",
            address = "Endla 45, Tallinn",
            city = "Tallinn",
            latitude = 59.4267,
            longitude = 24.7214,
            geofenceRadiusMeters = 210f,
            type = LocationType.SHOPPING_CENTRE.name,
            status = LocationStatus.APPROVED,
            activeCompanies = defaultCompanies
        ),
        Location(
            id = "tallinn_rocca",
            name = "Rocca al Mare",
            address = "Paldiski mnt 102, Tallinn",
            city = "Tallinn",
            latitude = 59.4285,
            longitude = 24.6548,
            geofenceRadiusMeters = 250f,
            type = LocationType.SHOPPING_CENTRE.name,
            status = LocationStatus.APPROVED,
            activeCompanies = defaultCompanies
        ),
        Location(
            id = "tallinn_jarve",
            name = "Järve Keskus",
            address = "Pärnu mnt 238, Tallinn",
            city = "Tallinn",
            latitude = 59.3957,
            longitude = 24.7176,
            geofenceRadiusMeters = 220f,
            type = LocationType.SHOPPING_CENTRE.name,
            status = LocationStatus.APPROVED,
            activeCompanies = defaultCompanies
        ),
        Location(
            id = "tartu_lounakeskus",
            name = "Lõunakeskus",
            address = "Ringtee 75, Tartu",
            city = "Tartu",
            latitude = 58.3582,
            longitude = 26.6806,
            geofenceRadiusMeters = 300f,
            type = LocationType.SHOPPING_CENTRE.name,
            status = LocationStatus.APPROVED,
            activeCompanies = defaultCompanies
        ),
        Location(
            id = "tartu_tasku",
            name = "Tasku Keskus",
            address = "Turu 2, Tartu",
            city = "Tartu",
            latitude = 58.3782,
            longitude = 26.7303,
            geofenceRadiusMeters = 180f,
            type = LocationType.SHOPPING_CENTRE.name,
            status = LocationStatus.APPROVED,
            activeCompanies = defaultCompanies
        ),
        Location(
            id = "tartu_kvartal",
            name = "Kvartal",
            address = "Riia 2, Tartu",
            city = "Tartu",
            latitude = 58.3768,
            longitude = 26.7289,
            geofenceRadiusMeters = 180f,
            type = LocationType.SHOPPING_CENTRE.name,
            status = LocationStatus.APPROVED,
            activeCompanies = defaultCompanies
        ),
        Location(
            id = "parnu_kaubamajakas",
            name = "Kaubamajakas",
            address = "Papiniidu 8/10, Pärnu",
            city = "Pärnu",
            latitude = 58.3688,
            longitude = 24.5422,
            geofenceRadiusMeters = 220f,
            type = LocationType.SHOPPING_CENTRE.name,
            status = LocationStatus.APPROVED,
            activeCompanies = defaultCompanies
        )
    )

    // Public map displays ONLY approved locations
    private val _approvedLocations = MutableStateFlow<List<Location>>(seededLocations)
    val locations: StateFlow<List<Location>> = _approvedLocations.asStateFlow()

    // Submissions belonging to current user
    private val _userSubmissions = MutableStateFlow<List<Location>>(emptyList())
    val userSubmissions: StateFlow<List<Location>> = _userSubmissions.asStateFlow()

    // Admin pending locations
    private val _pendingLocationsForAdmin = MutableStateFlow<List<Location>>(emptyList())
    val pendingLocationsForAdmin: StateFlow<List<Location>> = _pendingLocationsForAdmin.asStateFlow()

    // Location issue reports
    private val _issueReports = MutableStateFlow<List<LocationIssueReport>>(emptyList())
    val issueReports: StateFlow<List<LocationIssueReport>> = _issueReports.asStateFlow()

    suspend fun syncWithFirestore() {
        try {
            val snapshot = firestore.collection("locations")
                .whereEqualTo("active", true)
                .get()
                .await()

            if (!snapshot.isEmpty) {
                val remoteApproved = mutableListOf<Location>()
                val remotePending = mutableListOf<Location>()

                for (doc in snapshot.documents) {
                    val statusStr = doc.getString("status") ?: "APPROVED"
                    val status = try {
                        LocationStatus.valueOf(statusStr)
                    } catch (e: Exception) {
                        LocationStatus.APPROVED
                    }

                    val loc = Location(
                        id = doc.id,
                        name = doc.getString("name") ?: "",
                        address = doc.getString("address") ?: "",
                        city = doc.getString("city") ?: "",
                        latitude = doc.getDouble("latitude") ?: 0.0,
                        longitude = doc.getDouble("longitude") ?: 0.0,
                        geofenceRadiusMeters = (doc.getDouble("geofenceRadius") ?: 200.0).toFloat(),
                        type = doc.getString("type") ?: LocationType.SHOPPING_CENTRE.name,
                        status = status,
                        submittedBy = doc.getString("submittedBy"),
                        submittedAt = doc.getDate("submittedAt")?.time,
                        reviewedBy = doc.getString("reviewedBy"),
                        reviewedAt = doc.getDate("reviewedAt")?.time,
                        activeCompanies = defaultCompanies
                    )

                    if (status == LocationStatus.APPROVED) {
                        remoteApproved.add(loc)
                    } else if (status == LocationStatus.PENDING) {
                        remotePending.add(loc)
                    }
                }

                if (remoteApproved.isNotEmpty()) {
                    _approvedLocations.value = remoteApproved
                }
                _pendingLocationsForAdmin.value = remotePending
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Checks if a candidate location duplicates an existing location.
     */
    fun checkForDuplicate(name: String, address: String, lat: Double, lng: Double): Location? {
        val check = duplicateDetector.execute(
            candidateName = name,
            candidateAddress = address,
            candidateLat = lat,
            candidateLng = lng,
            existingLocations = _approvedLocations.value + _pendingLocationsForAdmin.value
        )
        return check.matchedLocation
    }

    /**
     * Submits a new location with status PENDING.
     * Guaranteed: Location is NOT added to public map until approved by an administrator.
     */
    suspend fun submitLocation(
        name: String,
        address: String,
        city: String,
        type: String,
        latitude: Double,
        longitude: Double,
        submittedByUserId: String
    ): Result<Location> {
        return try {
            val duplicate = checkForDuplicate(name, address, latitude, longitude)
            if (duplicate != null) {
                return Result.failure(Exception("Sarnane asukoht on juba olemas: ${duplicate.name} (${duplicate.address})"))
            }

            val docId = UUID.randomUUID().toString()
            val newLocation = Location(
                id = docId,
                name = name.trim(),
                address = address.trim(),
                city = city.trim(),
                latitude = latitude,
                longitude = longitude,
                geofenceRadiusMeters = 200f,
                type = type,
                active = true,
                status = LocationStatus.PENDING,
                submittedBy = submittedByUserId,
                submittedAt = System.currentTimeMillis(),
                reviewedBy = null,
                reviewedAt = null,
                activeCompanies = defaultCompanies
            )

            // Persist to Firestore
            val firestoreData = hashMapOf(
                "name" to newLocation.name,
                "address" to newLocation.address,
                "city" to newLocation.city,
                "latitude" to newLocation.latitude,
                "longitude" to newLocation.longitude,
                "geofenceRadius" to 200.0,
                "type" to newLocation.type,
                "active" to true,
                "status" to "PENDING",
                "submittedBy" to submittedByUserId,
                "submittedAt" to FieldValue.serverTimestamp(),
                "reviewedBy" to null,
                "reviewedAt" to null
            )

            try {
                firestore.collection("locations").document(docId).set(firestoreData).await()
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Update local reactive state
            _userSubmissions.value = listOf(newLocation) + _userSubmissions.value
            _pendingLocationsForAdmin.value = listOf(newLocation) + _pendingLocationsForAdmin.value

            Result.success(newLocation)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Administrator approves a pending location.
     * The location becomes APPROVED and immediately appears on the public map.
     */
    suspend fun approveLocation(locationId: String, adminUserId: String): Result<Unit> {
        if (!AdminConfig.isAdmin(adminUserId)) {
            return Result.failure(SecurityException("Puuduvad administraatori õigused!"))
        }

        return try {
            val target = _pendingLocationsForAdmin.value.find { it.id == locationId }
                ?: _userSubmissions.value.find { it.id == locationId }
                ?: return Result.failure(Exception("Asukohta ei leitud!"))

            val approved = target.copy(
                status = LocationStatus.APPROVED,
                reviewedBy = adminUserId,
                reviewedAt = System.currentTimeMillis()
            )

            try {
                firestore.collection("locations").document(locationId).update(
                    mapOf(
                        "status" to "APPROVED",
                        "reviewedBy" to adminUserId,
                        "reviewedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Update local state: remove from pending, add to approved public list
            _pendingLocationsForAdmin.value = _pendingLocationsForAdmin.value.filter { it.id != locationId }
            _approvedLocations.value = _approvedLocations.value.filter { it.id != locationId } + approved
            _userSubmissions.value = _userSubmissions.value.map { if (it.id == locationId) approved else it }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Administrator rejects a pending location.
     */
    suspend fun rejectLocation(locationId: String, adminUserId: String): Result<Unit> {
        if (!AdminConfig.isAdmin(adminUserId)) {
            return Result.failure(SecurityException("Puuduvad administraatori õigused!"))
        }

        return try {
            val target = _pendingLocationsForAdmin.value.find { it.id == locationId }
                ?: _userSubmissions.value.find { it.id == locationId }
                ?: return Result.failure(Exception("Asukohta ei leitud!"))

            val rejected = target.copy(
                status = LocationStatus.REJECTED,
                reviewedBy = adminUserId,
                reviewedAt = System.currentTimeMillis()
            )

            try {
                firestore.collection("locations").document(locationId).update(
                    mapOf(
                        "status" to "REJECTED",
                        "reviewedBy" to adminUserId,
                        "reviewedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } catch (e: Exception) {
                e.printStackTrace()
            }

            _pendingLocationsForAdmin.value = _pendingLocationsForAdmin.value.filter { it.id != locationId }
            _userSubmissions.value = _userSubmissions.value.map { if (it.id == locationId) rejected else it }

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Submits an issue report for an existing location ("TEATA VEAST").
     */
    suspend fun reportLocationIssue(
        locationId: String,
        locationName: String,
        issueType: LocationIssueType,
        description: String,
        reportedByUserId: String
    ): Result<Unit> {
        return try {
            val reportId = UUID.randomUUID().toString()
            val issue = LocationIssueReport(
                id = reportId,
                locationId = locationId,
                locationName = locationName,
                issueType = issueType,
                description = description.trim(),
                reportedBy = reportedByUserId,
                reportedAt = System.currentTimeMillis(),
                status = "PENDING"
            )

            val data = hashMapOf(
                "locationId" to locationId,
                "locationName" to locationName,
                "issueType" to issueType.name,
                "description" to issue.description,
                "reportedBy" to reportedByUserId,
                "reportedAt" to FieldValue.serverTimestamp(),
                "status" to "PENDING"
            )

            try {
                firestore.collection("locationIssueReports").document(reportId).set(data).await()
            } catch (e: Exception) {
                e.printStackTrace()
            }

            _issueReports.value = listOf(issue) + _issueReports.value
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getLocationById(locationId: String): Location? {
        return _approvedLocations.value.find { it.id == locationId }
    }
}
