package ee.myygi.radar.data.local

import android.content.Context
import android.content.SharedPreferences
import ee.myygi.radar.domain.model.Report
import ee.myygi.radar.domain.model.ReportStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/**
 * Handles persistent offline queueing of presence reports when device is offline.
 * Synchronizes transparently when internet connectivity is re-established.
 */
class OfflineReportQueue(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("offline_report_queue", Context.MODE_PRIVATE)
    private val _queuedReports = MutableStateFlow<List<Report>>(emptyList())
    val queuedReports: StateFlow<List<Report>> = _queuedReports.asStateFlow()

    init {
        loadQueuedReports()
    }

    private fun loadQueuedReports() {
        val jsonString = prefs.getString("pending_reports", "[]") ?: "[]"
        val list = mutableListOf<Report>()
        try {
            val array = JSONArray(jsonString)
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                list.add(
                    Report(
                        id = obj.getString("id"),
                        locationId = obj.getString("locationId"),
                        companyId = obj.getString("companyId"),
                        status = ReportStatus.valueOf(obj.getString("status")),
                        timestampMillis = obj.getLong("timestampMillis"),
                        anonymousUserId = obj.getString("anonymousUserId"),
                        latitude = obj.getDouble("latitude"),
                        longitude = obj.getDouble("longitude"),
                        gpsAccuracyMeters = obj.getDouble("gpsAccuracyMeters").toFloat(),
                        isVerified = obj.getBoolean("isVerified"),
                        userReliabilityWeight = obj.getDouble("userReliabilityWeight")
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        _queuedReports.value = list
    }

    @Synchronized
    fun enqueueReport(report: Report) {
        val current = _queuedReports.value.toMutableList()
        // Deduplicate: Don't enqueue if same user already reported same company in last 5 minutes
        val isDuplicate = current.any {
            it.locationId == report.locationId &&
            it.companyId == report.companyId &&
            Math.abs(it.timestampMillis - report.timestampMillis) < 5 * 60 * 1000
        }
        if (!isDuplicate) {
            current.add(report)
            persistList(current)
        }
    }

    @Synchronized
    fun removeReport(reportId: String) {
        val current = _queuedReports.value.filter { it.id != reportId }
        persistList(current)
    }

    @Synchronized
    fun clearQueue() {
        persistList(emptyList())
    }

    private fun persistList(list: List<Report>) {
        _queuedReports.value = list
        val array = JSONArray()
        for (report in list) {
            val obj = JSONObject().apply {
                put("id", report.id)
                put("locationId", report.locationId)
                put("companyId", report.companyId)
                put("status", report.status.name)
                put("timestampMillis", report.timestampMillis)
                put("anonymousUserId", report.anonymousUserId)
                put("latitude", report.latitude)
                put("longitude", report.longitude)
                put("gpsAccuracyMeters", report.gpsAccuracyMeters.toDouble())
                put("isVerified", report.isVerified)
                put("userReliabilityWeight", report.userReliabilityWeight)
            }
            array.put(obj)
        }
        prefs.edit().putString("pending_reports", array.toString()).apply()
    }
}
