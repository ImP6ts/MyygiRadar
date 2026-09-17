package ee.myygi.radar.ui.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import ee.myygi.radar.data.config.AdminConfig
import ee.myygi.radar.data.repository.AuthRepository
import ee.myygi.radar.data.repository.LocationRepository
import ee.myygi.radar.data.repository.ReportRepository
import ee.myygi.radar.domain.model.*
import ee.myygi.radar.domain.usecase.AggregateStatusUseCase
import ee.myygi.radar.domain.usecase.ValidateReportLocationUseCase
import ee.myygi.radar.domain.usecase.ValidationResult
import ee.myygi.radar.services.location.DeviceLocation
import ee.myygi.radar.services.location.LocationTracker
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class MapUiState(
    val locations: List<Location> = emptyList(),
    val selectedLocation: Location? = null,
    val selectedLocationPresences: List<CompanyPresence> = emptyList(),
    val userLocation: DeviceLocation? = null,
    val isReportingOpen: Boolean = false,
    val isAddLocationOpen: Boolean = false,
    val isReportIssueOpen: Boolean = false,
    val isSubmitting: Boolean = false,
    val lastValidationResult: ValidationResult? = null,
    val submissionMessage: String? = null,
    val currentUserId: String = "",
    val isAdmin: Boolean = false,
    val userSubmissions: List<Location> = emptyList(),
    val pendingLocationsForAdmin: List<Location> = emptyList(),
    val issueReports: List<LocationIssueReport> = emptyList()
)

class MapViewModel(
    private val locationRepository: LocationRepository,
    private val reportRepository: ReportRepository,
    private val authRepository: AuthRepository,
    private val locationTracker: LocationTracker,
    private val aggregateStatusUseCase: AggregateStatusUseCase = AggregateStatusUseCase(),
    private val validateReportLocationUseCase: ValidateReportLocationUseCase = ValidateReportLocationUseCase()
) : ViewModel() {

    private val _uiState = MutableStateFlow(MapUiState())
    val uiState: StateFlow<MapUiState> = _uiState.asStateFlow()

    init {
        loadLocations()
        fetchUserLocation()
        observeAuth()
        observeSubmissions()
    }

    private fun observeAuth() {
        viewModelScope.launch {
            val uid = authRepository.getOrSignInAnonymousUser()
            _uiState.update {
                it.copy(
                    currentUserId = uid,
                    isAdmin = AdminConfig.isAdmin(uid)
                )
            }
        }
    }

    private fun observeSubmissions() {
        viewModelScope.launch {
            locationRepository.userSubmissions.collect { list ->
                _uiState.update { it.copy(userSubmissions = list) }
            }
        }
        viewModelScope.launch {
            locationRepository.pendingLocationsForAdmin.collect { list ->
                _uiState.update { it.copy(pendingLocationsForAdmin = list) }
            }
        }
        viewModelScope.launch {
            locationRepository.issueReports.collect { list ->
                _uiState.update { it.copy(issueReports = list) }
            }
        }
    }

    private fun loadLocations() {
        viewModelScope.launch {
            locationRepository.locations.collect { list ->
                _uiState.update { it.copy(locations = list) }
            }
        }
    }

    fun fetchUserLocation() {
        viewModelScope.launch {
            val loc = locationTracker.getCurrentLocation()
            _uiState.update { it.copy(userLocation = loc) }
        }
    }

    fun selectLocation(location: Location) {
        _uiState.update { it.copy(selectedLocation = location) }
        observeReportsForLocation(location)
    }

    fun clearSelectedLocation() {
        _uiState.update {
            it.copy(
                selectedLocation = null,
                selectedLocationPresences = emptyList(),
                isReportingOpen = false,
                isReportIssueOpen = false
            )
        }
    }

    private fun observeReportsForLocation(location: Location) {
        viewModelScope.launch {
            reportRepository.observeReportsForLocation(location.id).collect { reports ->
                val presences = location.activeCompanies.map { company ->
                    val reportsForCompany = reports.filter { it.companyId == company.id }
                    aggregateStatusUseCase.execute(company, reportsForCompany)
                }
                _uiState.update { it.copy(selectedLocationPresences = presences) }
            }
        }
    }

    fun openReporting(isOpen: Boolean) {
        _uiState.update { it.copy(isReportingOpen = isOpen, submissionMessage = null) }
    }

    fun openAddLocation(isOpen: Boolean) {
        _uiState.update { it.copy(isAddLocationOpen = isOpen, submissionMessage = null) }
    }

    fun openReportIssue(isOpen: Boolean) {
        _uiState.update { it.copy(isReportIssueOpen = isOpen, submissionMessage = null) }
    }

    fun checkDuplicate(name: String, address: String, lat: Double, lng: Double): Location? {
        return locationRepository.checkForDuplicate(name, address, lat, lng)
    }

    fun submitNewLocation(
        name: String,
        address: String,
        city: String,
        type: String,
        lat: Double,
        lng: Double
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }
            val userId = authRepository.getOrSignInAnonymousUser()

            val result = locationRepository.submitLocation(
                name = name,
                address = address,
                city = city,
                type = type,
                latitude = lat,
                longitude = lng,
                submittedByUserId = userId
            )

            _uiState.update {
                it.copy(
                    isSubmitting = false,
                    isAddLocationOpen = false,
                    submissionMessage = if (result.isSuccess) {
                        "Asukoht esitatud kinnitamiseks! Staatus: OOTEL"
                    } else {
                        result.exceptionOrNull()?.message ?: "Viga asukoha lisamisel."
                    }
                )
            }
        }
    }

    fun submitReportIssue(issueType: LocationIssueType, description: String) {
        val location = _uiState.value.selectedLocation ?: return
        viewModelScope.launch {
            val userId = authRepository.getOrSignInAnonymousUser()
            val result = locationRepository.reportLocationIssue(
                locationId = location.id,
                locationName = location.name,
                issueType = issueType,
                description = description,
                reportedByUserId = userId
            )
            _uiState.update {
                it.copy(
                    isReportIssueOpen = false,
                    submissionMessage = if (result.isSuccess) "Veateade edastatud moderaatorile!" else "Viga veateate edastamisel."
                )
            }
        }
    }

    fun approveLocation(locationId: String) {
        viewModelScope.launch {
            val uid = _uiState.value.currentUserId
            val result = locationRepository.approveLocation(locationId, uid)
            _uiState.update {
                it.copy(
                    submissionMessage = if (result.isSuccess) "Asukoht kinnitatud ja lisatud kaardile!" else result.exceptionOrNull()?.message
                )
            }
        }
    }

    fun rejectLocation(locationId: String) {
        viewModelScope.launch {
            val uid = _uiState.value.currentUserId
            val result = locationRepository.rejectLocation(locationId, uid)
            _uiState.update {
                it.copy(
                    submissionMessage = if (result.isSuccess) "Asukoht tagasi lükatud." else result.exceptionOrNull()?.message
                )
            }
        }
    }

    fun submitReport(companyId: String, status: ReportStatus) {
        val location = _uiState.value.selectedLocation ?: return
        val userLoc = _uiState.value.userLocation

        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true) }

            val userId = authRepository.getOrSignInAnonymousUser()
            val userLat = userLoc?.latitude ?: location.latitude
            val userLng = userLoc?.longitude ?: location.longitude
            val accuracy = userLoc?.accuracyMeters ?: 15f

            val validation = validateReportLocationUseCase.execute(location, userLat, userLng, accuracy)
            _uiState.update { it.copy(lastValidationResult = validation) }

            val report = Report(
                id = java.util.UUID.randomUUID().toString(),
                locationId = location.id,
                companyId = companyId,
                status = status,
                timestampMillis = System.currentTimeMillis(),
                anonymousUserId = userId,
                latitude = userLat,
                longitude = userLng,
                gpsAccuracyMeters = accuracy,
                isVerified = validation.isValid,
                userReliabilityWeight = validation.adjustedReliabilityWeight
            )

            val result = reportRepository.submitReport(report)
            _uiState.update {
                it.copy(
                    isSubmitting = false,
                    isReportingOpen = false,
                    submissionMessage = if (result.isSuccess) "Aruanne edukalt salvestatud!" else "Salvestatud kohalikku järjekorda."
                )
            }
        }
    }
}
