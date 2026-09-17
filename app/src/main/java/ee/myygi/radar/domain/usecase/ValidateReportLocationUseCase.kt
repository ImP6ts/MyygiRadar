package ee.myygi.radar.domain.usecase

import ee.myygi.radar.domain.model.Location
import kotlin.math.*

data class ValidationResult(
    val isValid: Boolean,
    val distanceMeters: Float,
    val isAccuracyWarning: Boolean,
    val adjustedReliabilityWeight: Double,
    val message: String
)

class ValidateReportLocationUseCase {

    fun execute(
        location: Location,
        userLat: Double,
        userLng: Double,
        gpsAccuracyMeters: Float
    ): ValidationResult {
        val distance = calculateDistanceMeters(userLat, userLng, location.latitude, location.longitude)
        val maxAllowedRadius = location.geofenceRadiusMeters + max(gpsAccuracyMeters, 20f)

        val isWithinBounds = distance <= maxAllowedRadius
        val isPoorAccuracy = gpsAccuracyMeters > 50f

        val reliabilityWeight = when {
            gpsAccuracyMeters <= 15f -> 1.0
            gpsAccuracyMeters <= 40f -> 0.8
            gpsAccuracyMeters <= 80f -> 0.5
            else -> 0.2
        }

        val message = when {
            !isWithinBounds -> "Oled asukohast liiga kaugel (${distance.toInt()} m, lubatud ${maxAllowedRadius.toInt()} m)."
            isPoorAccuracy -> "GPS täpsus on madal (${gpsAccuracyMeters.toInt()} m), raport arvestatakse madalama kaaluga."
            else -> "Asukoht kinnitatud (${distance.toInt()} m kaugusel)."
        }

        return ValidationResult(
            isValid = isWithinBounds,
            distanceMeters = distance,
            isAccuracyWarning = isPoorAccuracy,
            adjustedReliabilityWeight = reliabilityWeight,
            message = message
        )
    }

    private fun calculateDistanceMeters(
        lat1: Double, lon1: Double,
        lat2: Double, lon2: Double
    ): Float {
        val earthRadius = 6371000.0 // meters
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2).pow(2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return (earthRadius * c).toFloat()
    }
}
