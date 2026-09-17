package ee.myygi.radar.ui.nearby

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ee.myygi.radar.data.repository.LocationRepository
import ee.myygi.radar.domain.model.Location
import ee.myygi.radar.domain.model.LocationDetails
import ee.myygi.radar.services.location.DeviceLocation
import ee.myygi.radar.services.location.LocationTracker
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlin.math.*

data class NearbyUiState(
    val searchQuery: String = "",
    val locations: List<Location> = emptyList(),
    val userLocation: DeviceLocation? = null,
    val isLoadingLocation: Boolean = false
) {
    val filteredAndSortedLocations: List<Pair<Location, Float?>>
        get() {
            val filtered = if (searchQuery.isBlank()) {
                locations
            } else {
                locations.filter {
                    it.name.contains(searchQuery, ignoreCase = true) ||
                    it.address.contains(searchQuery, ignoreCase = true) ||
                    it.city.contains(searchQuery, ignoreCase = true)
                }
            }

            return if (userLocation != null) {
                filtered.map { loc ->
                    val dist = calculateDistanceMeters(
                        userLocation.latitude, userLocation.longitude,
                        loc.latitude, loc.longitude
                    )
                    loc to dist
                }.sortedBy { it.second }
            } else {
                filtered.map { it to null }
            }
        }

    private fun calculateDistanceMeters(
        lat1: Double, lon1: Double,
        lat2: Double, lon2: Double
    ): Float {
        val earthRadius = 6371000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2).pow(2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return (earthRadius * c).toFloat()
    }
}

class NearbyViewModel(
    private val locationRepository: LocationRepository,
    private val locationTracker: LocationTracker
) : ViewModel() {

    private val _uiState = MutableStateFlow(NearbyUiState())
    val uiState: StateFlow<NearbyUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            locationRepository.locations.collect { list ->
                _uiState.update { it.copy(locations = list) }
            }
        }
    }

    fun onSearchQueryChanged(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun requestUserLocation() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingLocation = true) }
            val loc = locationTracker.getCurrentLocation()
            _uiState.update { it.copy(userLocation = loc, isLoadingLocation = false) }
        }
    }
}
