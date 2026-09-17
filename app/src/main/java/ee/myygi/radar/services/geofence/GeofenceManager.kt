package ee.myygi.radar.services.geofence

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingClient
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices
import ee.myygi.radar.domain.model.Location
import kotlinx.coroutines.tasks.await

class GeofenceManager(private val context: Context) {

    private val geofencingClient: GeofencingClient =
        LocationServices.getGeofencingClient(context)

    private val geofencePendingIntent: PendingIntent by lazy {
        val intent = Intent(context, GeofenceBroadcastReceiver::class.java)
        PendingIntent.getBroadcast(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )
    }

    @SuppressLint("MissingPermission")
    suspend fun registerGeofences(locations: List<Location>): Boolean {
        if (locations.isEmpty()) return false

        val geofenceList = locations.map { loc ->
            Geofence.Builder()
                .setRequestId(loc.id)
                .setCircularRegion(
                    loc.latitude,
                    loc.longitude,
                    loc.geofenceRadiusMeters
                )
                .setExpirationDuration(Geofence.NEVER_EXPIRE)
                .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER)
                .build()
        }

        val request = GeofencingRequest.Builder()
            .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
            .addGeofences(geofenceList)
            .build()

        return try {
            geofencingClient.addGeofences(request, geofencePendingIntent).await()
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    suspend fun removeGeofences(): Boolean {
        return try {
            geofencingClient.removeGeofences(geofencePendingIntent).await()
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}
