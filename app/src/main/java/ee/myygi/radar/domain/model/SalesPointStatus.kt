package ee.myygi.radar.domain.model

enum class AggregatedStatus {
    PRESENT,
    PROBABLY_PRESENT,
    PROBABLY_ABSENT,
    UNKNOWN
}

data class CompanyPresence(
    val company: Company,
    val status: AggregatedStatus,
    val confidenceScore: Double, // -1.0 (definitely absent) to +1.0 (definitely present)
    val lastConfirmedTimeMillis: Long?,
    val recentConfirmationsCount: Int,
    val isPersistentPresenceToday: Boolean,
    val hourlyDistribution: List<Int> = emptyList(), // Count of reports per hour today
    val presentReportsCount: Int = 0,
    val absentReportsCount: Int = 0
)

data class LocationDetails(
    val location: Location,
    val companyPresences: List<CompanyPresence>,
    val distanceMeters: Float? = null
)
