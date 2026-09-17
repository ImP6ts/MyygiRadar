package ee.myygi.radar.services.geofence

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingEvent
import ee.myygi.radar.data.repository.LocationRepository
import ee.myygi.radar.services.notifications.NotificationHelper

class GeofenceBroadcastReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val geofencingEvent = GeofencingEvent.fromIntent(intent) ?: return

        if (geofencingEvent.hasError()) {
            return
        }

        val transition = geofencingEvent.geofenceTransition
        if (transition == Geofence.GEOFENCE_TRANSITION_ENTER) {
            val triggeringGeofences = geofencingEvent.triggeringGeofences ?: return
            val locationRepository = LocationRepository()
            val notificationHelper = NotificationHelper(context)

            for (geofence in triggeringGeofences) {
                val locationId = geofence.requestId
                val location = locationRepository.getLocationById(locationId) ?: continue

                // Check default companies for arrival notification
                for (company in location.activeCompanies) {
                    if (notificationHelper.canSendArrivalNotification(location.id, company.id)) {
                        notificationHelper.showArrivalNotification(
                            notificationId = (location.id.hashCode() xor company.id.hashCode()),
                            locationId = location.id,
                            locationName = location.name,
                            companyId = company.id,
                            companyName = company.name
                        )
                        break // Notify about one company at arrival to prevent spam
                    }
                }
            }
        }
    }
}
