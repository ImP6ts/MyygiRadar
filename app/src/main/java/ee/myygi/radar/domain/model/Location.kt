package ee.myygi.radar.domain.model

enum class LocationStatus {
    PENDING,
    APPROVED,
    REJECTED
}

enum class LocationType(val displayName: String) {
    SUPERMARKET("Supermarket"),
    HYPERMARKET("Hüpermarket"),
    SHOPPING_CENTRE("Kaubanduskeskus"),
    ELECTRONICS_STORE("Elektroonikapood"),
    OTHER("Muu")
}

data class Location(
    val id: String,
    val name: String,
    val address: String,
    val city: String,
    val latitude: Double,
    val longitude: Double,
    val geofenceRadiusMeters: Float = 200f,
    val type: String = LocationType.SHOPPING_CENTRE.name,
    val active: Boolean = true,
    val activeCompanies: List<Company> = emptyList(),
    val status: LocationStatus = LocationStatus.APPROVED,
    val submittedBy: String? = null,
    val submittedAt: Long? = null,
    val reviewedBy: String? = null,
    val reviewedAt: Long? = null
)
