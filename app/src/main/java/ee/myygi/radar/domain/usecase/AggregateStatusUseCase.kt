package ee.myygi.radar.domain.usecase

import ee.myygi.radar.domain.model.AggregatedStatus
import ee.myygi.radar.domain.model.Company
import ee.myygi.radar.domain.model.CompanyPresence
import ee.myygi.radar.domain.model.Report
import ee.myygi.radar.domain.model.ReportStatus
import kotlin.math.exp
import kotlin.math.max

/**
 * Aggregates crowdsourced reports using an exponential time-decay algorithm
 * with user reliability weighting and multi-hour persistent presence detection.
 */
class AggregateStatusUseCase(
    private val halfLifeMinutes: Double = 45.0, // After 45 mins, a report has 50% weight
    private val maxConsideredAgeMinutes: Double = 180.0 // Reports older than 3 hours have negligible weight for immediate status
) {

    fun execute(
        company: Company,
        allReportsForCompany: List<Report>,
        currentTimeMillis: Long = System.currentTimeMillis()
    ): CompanyPresence {
        val now = currentTimeMillis
        val todayStartMillis = now - (now % (24 * 60 * 60 * 1000L))

        // Filter reports from today
        val todayReports = allReportsForCompany.filter { it.timestampMillis >= todayStartMillis }

        var weightedPresentScore = 0.0
        var weightedAbsentScore = 0.0
        var presentCount = 0
        var absentCount = 0
        var lastConfirmedTime: Long? = null

        // Persistent presence detection: distinct hours with PRESENT reports
        val distinctPresentHours = mutableSetOf<Int>()

        for (report in todayReports) {
            val ageMinutes = (now - report.timestampMillis) / (1000.0 * 60.0)

            if (report.status == ReportStatus.PRESENT) {
                val hourOfDay = ((report.timestampMillis / (1000 * 60 * 60)) % 24).toInt()
                distinctPresentHours.add(hourOfDay)
                if (lastConfirmedTime == null || report.timestampMillis > lastConfirmedTime) {
                    lastConfirmedTime = report.timestampMillis
                }
            }

            // Apply time decay: e^(-lambda * t)
            // lambda = ln(2) / halfLifeMinutes
            if (ageMinutes >= 0 && ageMinutes <= maxConsideredAgeMinutes) {
                val decayFactor = exp(-0.693147 * (ageMinutes / halfLifeMinutes))
                val reportWeight = report.userReliabilityWeight * decayFactor

                if (report.status == ReportStatus.PRESENT) {
                    weightedPresentScore += reportWeight
                    presentCount++
                } else {
                    weightedAbsentScore += reportWeight
                    absentCount++
                }
            }
        }

        val totalWeight = weightedPresentScore + weightedAbsentScore
        val isPersistent = distinctPresentHours.size >= 3 // Confirmed across at least 3 distinct hours today

        if (totalWeight < 0.5) {
            // Insufficient recent evidence
            return CompanyPresence(
                company = company,
                status = AggregatedStatus.UNKNOWN,
                confidenceScore = 0.0,
                lastConfirmedTimeMillis = lastConfirmedTime,
                recentConfirmationsCount = presentCount,
                isPersistentPresenceToday = isPersistent,
                presentReportsCount = presentCount,
                absentReportsCount = absentCount
            )
        }

        // Net score normalized between -1.0 and +1.0
        val netRatio = (weightedPresentScore - weightedAbsentScore) / totalWeight

        val status = when {
            netRatio >= 0.6 && totalWeight >= 2.0 -> AggregatedStatus.PRESENT
            netRatio >= 0.25 -> AggregatedStatus.PROBABLY_PRESENT
            netRatio <= -0.5 -> AggregatedStatus.PROBABLY_ABSENT
            else -> AggregatedStatus.UNKNOWN
        }

        return CompanyPresence(
            company = company,
            status = status,
            confidenceScore = netRatio,
            lastConfirmedTimeMillis = lastConfirmedTime,
            recentConfirmationsCount = presentCount,
            isPersistentPresenceToday = isPersistent,
            presentReportsCount = presentCount,
            absentReportsCount = absentCount
        )
    }
}
