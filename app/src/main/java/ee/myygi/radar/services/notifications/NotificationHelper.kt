package ee.myygi.radar.services.notifications

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import ee.myygi.radar.MainActivity
import ee.myygi.radar.R

class NotificationHelper(private val context: Context) {

    companion object {
        const val CHANNEL_ID = "sales_rep_arrival_channel"
        const val PREFS_COOLDOWN = "notification_cooldown_prefs"
    }

    private val prefs = context.getSharedPreferences(PREFS_COOLDOWN, Context.MODE_PRIVATE)

    init {
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Müügiradari saabumisteavitused",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Küsimused müügiesindajate kohalolu kohta saabumisel"
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    fun canSendArrivalNotification(locationId: String, companyId: String, cooldownHours: Int = 3): Boolean {
        val key = "last_notif_${locationId}_${companyId}"
        val lastTime = prefs.getLong(key, 0L)
        val now = System.currentTimeMillis()
        val cooldownMillis = cooldownHours * 60 * 60 * 1000L
        return (now - lastTime) >= cooldownMillis
    }

    fun recordNotificationSent(locationId: String, companyId: String) {
        val key = "last_notif_${locationId}_${companyId}"
        prefs.edit().putLong(key, System.currentTimeMillis()).apply()
    }

    @SuppressLint("MissingPermission")
    fun showArrivalNotification(
        notificationId: Int,
        locationId: String,
        locationName: String,
        companyId: String,
        companyName: String
    ) {
        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            putExtra("EXTRA_LOCATION_ID", locationId)
            putExtra("EXTRA_COMPANY_ID", companyId)
        }
        val openPendingIntent = PendingIntent.getActivity(
            context,
            notificationId,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_map)
            .setContentTitle("Saabusid: $locationName")
            .setContentText("Kas siin on praegu $companyName müügiesindaja?")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(openPendingIntent)
            .setAutoCancel(true)

        NotificationManagerCompat.from(context).notify(notificationId, builder.build())
        recordNotificationSent(locationId, companyId)
    }
}
