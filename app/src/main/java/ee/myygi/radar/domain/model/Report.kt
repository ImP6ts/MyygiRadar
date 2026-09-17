package ee.myygi.radar.domain.model

enum class ReportStatus {
    PRESENT,
    NOT_PRESENT
}

data class Report(
    val id: String,
    val locationId: String,
    val companyId: String,
    val status: ReportStatus,
    val timestampMillis: Long,
    val anonymousUserId: String,
    val latitude: Double,
    val longitude: Double,
    val gpsAccuracyMeters: Float,
    val isVerified: Boolean = true,
    val userReliabilityWeight: Double = 1.0
)
