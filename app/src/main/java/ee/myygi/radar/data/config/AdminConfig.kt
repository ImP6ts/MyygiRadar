package ee.myygi.radar.data.config

/**
 * Configuration for Administrator Firebase UIDs.
 *
 * HOW TO CONFIGURE ADMIN USERS:
 * 1. Open the Firebase Console -> Authentication -> Users.
 * 2. Copy the User UID of the intended administrator.
 * 3. Add the UID to the [ADMIN_FIREBASE_UIDS] set below.
 * 4. IMPORTANT: Also add the UID to `firestore.rules` under `isAdmin()` to ensure
 *    database-level security enforcement. Client-side checks alone are never trusted
 *    to approve/reject locations or modify data.
 *
 * In production environments, administrators can also be assigned custom claims
 * (`admin: true`) via the Firebase Admin SDK.
 */
object AdminConfig {

    val ADMIN_FIREBASE_UIDS: Set<String> = setOf(
        "admin_myygiradar_master",
        "arletpdr_admin_uid",
        "dev_test_admin_uid"
    )

    /**
     * Checks if a user has administrator privileges based on their Firebase UID.
     */
    fun isAdmin(uid: String?): Boolean {
        if (uid.isNullOrBlank()) return false
        return ADMIN_FIREBASE_UIDS.contains(uid)
    }
}
