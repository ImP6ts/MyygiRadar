package ee.myygi.radar.ui.settings

import android.content.Context
import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class SettingsUiState(
    val isArrivalChecksEnabled: Boolean = true,
    val cooldownHours: Int = 3,
    val hasLocationPermission: Boolean = false,
    val hasNotificationPermission: Boolean = false
)

class SettingsViewModel(context: Context) : ViewModel() {

    private val prefs = context.getSharedPreferences("app_settings_prefs", Context.MODE_PRIVATE)

    private val _uiState = MutableStateFlow(
        SettingsUiState(
            isArrivalChecksEnabled = prefs.getBoolean("arrival_checks_enabled", true),
            cooldownHours = prefs.getInt("cooldown_hours", 3)
        )
    )
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    fun toggleArrivalChecks(enabled: Boolean) {
        prefs.edit().putBoolean("arrival_checks_enabled", enabled).apply()
        _uiState.update { it.copy(isArrivalChecksEnabled = enabled) }
    }

    fun setCooldownHours(hours: Int) {
        prefs.edit().putInt("cooldown_hours", hours).apply()
        _uiState.update { it.copy(cooldownHours = hours) }
    }

    fun updatePermissions(hasLocation: Boolean, hasNotification: Boolean) {
        _uiState.update {
            it.copy(
                hasLocationPermission = hasLocation,
                hasNotificationPermission = hasNotification
            )
        }
    }
}
