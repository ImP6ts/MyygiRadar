package ee.myygi.radar

import android.app.Application
import com.google.firebase.FirebaseApp

class MyygiRadarApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize Firebase if configured
        try {
            FirebaseApp.initializeApp(this)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
