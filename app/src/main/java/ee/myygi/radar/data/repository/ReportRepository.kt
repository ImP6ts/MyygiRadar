package ee.myygi.radar.data.repository

import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import ee.myygi.radar.data.local.OfflineReportQueue
import ee.myygi.radar.domain.model.Report
import ee.myygi.radar.domain.model.ReportStatus
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.util.UUID

class ReportRepository(
    private val firestore: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val offlineQueue: OfflineReportQueue
) {

    suspend fun submitReport(report: Report): Result<Boolean> {
        return try {
            val reportData = hashMapOf(
                "locationId" to report.locationId,
                "companyId" to report.companyId,
                "status" to report.status.name,
                "timestamp" to FieldValue.serverTimestamp(),
                "anonymousUserId" to report.anonymousUserId,
                "latitude" to report.latitude,
                "longitude" to report.longitude,
                "gpsAccuracy" to report.gpsAccuracyMeters.toDouble()
            )

            firestore.collection("reports").add(reportData).await()
            Result.success(true)
        } catch (e: Exception) {
            // Queue locally if offline or server fails
            offlineQueue.enqueueReport(report)
            Result.success(false) // successfully queued locally
        }
    }

    suspend fun syncOfflineReports(): Int {
        val pending = offlineQueue.queuedReports.value
        if (pending.isEmpty()) return 0

        var syncedCount = 0
        for (report in pending) {
            try {
                val reportData = hashMapOf(
                    "locationId" to report.locationId,
                    "companyId" to report.companyId,
                    "status" to report.status.name,
                    "timestamp" to FieldValue.serverTimestamp(),
                    "anonymousUserId" to report.anonymousUserId,
                    "latitude" to report.latitude,
                    "longitude" to report.longitude,
                    "gpsAccuracy" to report.gpsAccuracyMeters.toDouble()
                )
                firestore.collection("reports").add(reportData).await()
                offlineQueue.removeReport(report.id)
                syncedCount++
            } catch (e: Exception) {
                break // Stop syncing if still offline
            }
        }
        return syncedCount
    }

    fun observeReportsForLocation(locationId: String): Flow<List<Report>> = callbackFlow {
        val listener = firestore.collection("reports")
            .whereEqualTo("locationId", locationId)
            .orderBy("timestamp", Query.Direction.DESCENDING)
            .limit(100)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    // Provide offline queued reports if any exist for this location
                    val local = offlineQueue.queuedReports.value.filter { it.locationId == locationId }
                    trySend(local)
                    return@addSnapshotListener
                }

                if (snapshot != null) {
                    val reports = snapshot.documents.mapNotNull { doc ->
                        val compId = doc.getString("companyId") ?: return@mapNotNull null
                        val statusStr = doc.getString("status") ?: "PRESENT"
                        val timestamp = doc.getTimestamp("timestamp")?.toDate()?.time ?: System.currentTimeMillis()
                        Report(
                            id = doc.id,
                            locationId = locationId,
                            companyId = compId,
                            status = if (statusStr == "NOT_PRESENT") ReportStatus.NOT_PRESENT else ReportStatus.PRESENT,
                            timestampMillis = timestamp,
                            anonymousUserId = doc.getString("anonymousUserId") ?: "anon",
                            latitude = doc.getDouble("latitude") ?: 0.0,
                            longitude = doc.getDouble("longitude") ?: 0.0,
                            gpsAccuracyMeters = (doc.getDouble("gpsAccuracy") ?: 10.0).toFloat()
                        )
                    }
                    trySend(reports)
                }
            }

        awaitClose { listener.remove() }
    }
}
