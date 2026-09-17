package ee.myygi.radar.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await

/**
 * Manages anonymous Firebase Authentication.
 * Users do NOT need to register an account; an anonymous UID is assigned
 * to distinguish independent reports while preserving complete user privacy.
 */
class AuthRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {

    private val _currentUser = MutableStateFlow<FirebaseUser?>(auth.currentUser)
    val currentUser: StateFlow<FirebaseUser?> = _currentUser.asStateFlow()

    suspend fun getOrSignInAnonymousUser(): String {
        val existing = auth.currentUser
        if (existing != null) {
            _currentUser.value = existing
            return existing.uid
        }

        return try {
            val result = auth.signInAnonymously().await()
            val user = result.user
            _currentUser.value = user
            user?.uid ?: "anonymous_user_${System.currentTimeMillis()}"
        } catch (e: Exception) {
            // Graceful offline fallback: stable pseudo-anonymous session token
            "offline_anonymous_session"
        }
    }

    fun getUserId(): String {
        return auth.currentUser?.uid ?: "anonymous_user"
    }
}
