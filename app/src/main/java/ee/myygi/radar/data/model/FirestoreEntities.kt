package ee.myygi.radar.data.model

import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.ServerTimestamp
import java.util.Date

data class LocationFirestoreEntity(
    @DocumentId val id: String = "",
    val name: String = "",
    val address: String = "",
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val geofenceRadius: Double = 200.0,
    val city: String = "",
    val type: String = "SHOPPING_CENTRE",
    val active: Boolean = true,
    val status: String = "PENDING",
    val submittedBy: String = "",
    @ServerTimestamp val submittedAt: Date? = null,
    val reviewedBy: String? = null,
    @ServerTimestamp val reviewedAt: Date? = null
)

data class LocationIssueReportFirestoreEntity(
    @DocumentId val id: String = "",
    val locationId: String = "",
    val locationName: String = "",
    val issueType: String = "OTHER",
    val description: String = "",
    val reportedBy: String = "",
    @ServerTimestamp val reportedAt: Date? = null,
    val status: String = "PENDING"
)

data class CompanyFirestoreEntity(
    @DocumentId val id: String = "",
    val name: String = "",
    val category: String = "TELECOM",
    val active: Boolean = true
)

data class SalesPointFirestoreEntity(
    @DocumentId val id: String = "",
    val locationId: String = "",
    val companyId: String = "",
    val active: Boolean = true
)

data class ReportFirestoreEntity(
    @DocumentId val id: String = "",
    val locationId: String = "",
    val companyId: String = "",
    val status: String = "PRESENT",
    @ServerTimestamp val timestamp: Date? = null,
    val anonymousUserId: String = "",
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val gpsAccuracy: Double = 0.0
)

data class UserProfileFirestoreEntity(
    @DocumentId val id: String = "",
    @ServerTimestamp val createdAt: Date? = null,
    val reputationWeight: Double = 1.0,
    val settings: Map<String, Any> = emptyMap()
)

data class NotificationHistoryFirestoreEntity(
    @DocumentId val id: String = "",
    val userId: String = "",
    val locationId: String = "",
    val companyId: String = "",
    @ServerTimestamp val timestamp: Date? = null
)
