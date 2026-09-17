package ee.myygi.radar.domain.usecase

import ee.myygi.radar.domain.model.Location
import kotlin.math.*

data class DuplicateCheckResult(
    val hasDuplicate: Boolean,
    val matchedLocation: Location? = null,
    val matchReason: String? = null
)

class DetectDuplicateLocationUseCase {

    /**
     * Checks if a new location submission likely duplicates an existing location.
     */
    fun execute(
        candidateName: String,
        candidateAddress: String,
        candidateLat: Double,
        candidateLng: Double,
        existingLocations: List<Location>
    ): DuplicateCheckResult {
        val normName = normalize(candidateName)
        val normAddress = normalize(candidateAddress)

        for (existing in existingLocations) {
            val distMeters = calculateDistanceMeters(
                candidateLat, candidateLng,
                existing.latitude, existing.longitude
            )
            val existingNormName = normalize(existing.name)
            val existingNormAddr = normalize(existing.address)

            // Proximity match: within 150m is a very strong duplicate indicator for retail centres
            if (distMeters <= 150.0) {
                return DuplicateCheckResult(
                    hasDuplicate = true,
                    matchedLocation = existing,
                    matchReason = "Asukoht asub väga lähedal olemasolevale kohale (${distMeters.roundToInt()} m): ${existing.name}"
                )
            }

            // Name similarity check
            val nameSim = calculateSimilarity(normName, existingNormName)
            if (nameSim >= 0.75) {
                return DuplicateCheckResult(
                    hasDuplicate = true,
                    matchedLocation = existing,
                    matchReason = "Nimi sarnaneb olemasoleva asukohaga: ${existing.name}"
                )
            }

            // Address similarity check
            if (normAddress.isNotBlank() && existingNormAddr.isNotBlank()) {
                val addrSim = calculateSimilarity(normAddress, existingNormAddr)
                if (addrSim >= 0.8 && distMeters <= 500.0) {
                    return DuplicateCheckResult(
                        hasDuplicate = true,
                        matchedLocation = existing,
                        matchReason = "Aadress ja piirkond kattuvad olemasoleva asukohaga: ${existing.name} (${existing.address})"
                    )
                }
            }
        }

        return DuplicateCheckResult(hasDuplicate = false)
    }

    private fun normalize(str: String): String {
        return str.lowercase()
            .replace(Regex("[^a-zõäöü0-9\\s]"), "")
            .trim()
    }

    private fun calculateSimilarity(s1: String, s2: String): Double {
        if (s1 == s2) return 1.0
        if (s1.isEmpty() || s2.isEmpty()) return 0.0

        if (s1.contains(s2) || s2.contains(s1)) {
            val ratio = min(s1.length, s2.length).toDouble() / max(s1.length, s2.length).toDouble()
            return max(0.75, ratio)
        }

        val distance = levenshteinDistance(s1, s2)
        val maxLen = max(s1.length, s2.length)
        return 1.0 - (distance.toDouble() / maxLen)
    }

    private fun levenshteinDistance(lhs: CharSequence, rhs: CharSequence): Int {
        var cost = Array(lhs.length + 1) { it }
        var newCost = Array(lhs.length + 1) { 0 }

        for (i in 1..rhs.length) {
            newCost[0] = i
            for (j in 1..lhs.length) {
                val match = if (lhs[j - 1] == rhs[i - 1]) 0 else 1
                val costReplace = cost[j - 1] + match
                val costInsert = cost[j] + 1
                val costDelete = newCost[j - 1] + 1
                newCost[j] = min(min(costInsert, costDelete), costReplace)
            }
            val swap = cost
            cost = newCost
            newCost = swap
        }
        return cost[lhs.length]
    }

    private fun calculateDistanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2.0) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2).pow(2.0)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }
}
