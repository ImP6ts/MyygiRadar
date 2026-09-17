package ee.myygi.radar

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import ee.myygi.radar.data.local.OfflineReportQueue
import ee.myygi.radar.data.repository.AuthRepository
import ee.myygi.radar.data.repository.LocationRepository
import ee.myygi.radar.data.repository.ReportRepository
import ee.myygi.radar.services.geofence.GeofenceManager
import ee.myygi.radar.services.location.LocationTracker
import ee.myygi.radar.ui.admin.AdminModerationScreen
import ee.myygi.radar.ui.locations.UserSubmissionsScreen
import ee.myygi.radar.ui.map.MapScreen
import ee.myygi.radar.ui.map.MapViewModel
import ee.myygi.radar.ui.nearby.NearbyScreen
import ee.myygi.radar.ui.nearby.NearbyViewModel
import ee.myygi.radar.ui.navigation.Screen
import ee.myygi.radar.ui.settings.SettingsScreen
import ee.myygi.radar.ui.settings.SettingsViewModel
import ee.myygi.radar.ui.theme.MyygiRadarTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var locationRepository: LocationRepository
    private lateinit var reportRepository: ReportRepository
    private lateinit var authRepository: AuthRepository
    private lateinit var locationTracker: LocationTracker
    private lateinit var geofenceManager: GeofenceManager
    private lateinit var offlineQueue: OfflineReportQueue

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true) {
            setupGeofencing()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize dependencies
        offlineQueue = OfflineReportQueue(applicationContext)
        locationRepository = LocationRepository()
        reportRepository = ReportRepository(offlineQueue = offlineQueue)
        authRepository = AuthRepository()
        locationTracker = LocationTracker(applicationContext)
        geofenceManager = GeofenceManager(applicationContext)

        CoroutineScope(Dispatchers.IO).launch {
            authRepository.getOrSignInAnonymousUser()
            locationRepository.syncWithFirestore()
            reportRepository.syncOfflineReports()
        }

        requestAppPermissions()

        setContent {
            MyygiRadarTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route

                val mapViewModel = remember {
                    MapViewModel(
                        locationRepository = locationRepository,
                        reportRepository = reportRepository,
                        authRepository = authRepository,
                        locationTracker = locationTracker
                    )
                }

                val nearbyViewModel = remember {
                    NearbyViewModel(
                        locationRepository = locationRepository,
                        locationTracker = locationTracker
                    )
                }

                val settingsViewModel = remember {
                    SettingsViewModel(applicationContext).apply {
                        updatePermissions(
                            hasLocation = ContextCompat.checkSelfPermission(
                                this@MainActivity,
                                Manifest.permission.ACCESS_FINE_LOCATION
                            ) == PackageManager.PERMISSION_GRANTED,
                            hasNotification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                                ContextCompat.checkSelfPermission(
                                    this@MainActivity,
                                    Manifest.permission.POST_NOTIFICATIONS
                                ) == PackageManager.PERMISSION_GRANTED
                            } else true
                        )
                    }
                }

                val mapUiState by mapViewModel.uiState.collectAsState()

                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            NavigationBarItem(
                                selected = currentRoute == Screen.Map.route,
                                onClick = { navController.navigate(Screen.Map.route) },
                                icon = { Icon(Icons.Default.Map, contentDescription = null) },
                                label = { Text("Kaart") }
                            )
                            NavigationBarItem(
                                selected = currentRoute == Screen.Nearby.route,
                                onClick = { navController.navigate(Screen.Nearby.route) },
                                icon = { Icon(Icons.Default.NearMe, contentDescription = null) },
                                label = { Text("Läheduses") }
                            )
                            NavigationBarItem(
                                selected = currentRoute == Screen.Submissions.route,
                                onClick = { navController.navigate(Screen.Submissions.route) },
                                icon = { Icon(Icons.Default.BookmarkBorder, contentDescription = null) },
                                label = { Text("Minu kohad") }
                            )
                            if (mapUiState.isAdmin) {
                                NavigationBarItem(
                                    selected = currentRoute == Screen.Admin.route,
                                    onClick = { navController.navigate(Screen.Admin.route) },
                                    icon = { Icon(Icons.Default.AdminPanelSettings, contentDescription = null) },
                                    label = { Text("Kinnitamine") }
                                )
                            }
                            NavigationBarItem(
                                selected = currentRoute == Screen.Settings.route,
                                onClick = { navController.navigate(Screen.Settings.route) },
                                icon = { Icon(Icons.Default.Settings, contentDescription = null) },
                                label = { Text("Seaded") }
                            )
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = Screen.Map.route,
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable(Screen.Map.route) {
                            MapScreen(viewModel = mapViewModel)
                        }
                        composable(Screen.Nearby.route) {
                            NearbyScreen(
                                viewModel = nearbyViewModel,
                                onLocationClick = { loc ->
                                    mapViewModel.selectLocation(loc)
                                    navController.navigate(Screen.Map.route)
                                }
                            )
                        }
                        composable(Screen.Submissions.route) {
                            UserSubmissionsScreen(
                                submissions = mapUiState.userSubmissions,
                                onAddNewLocation = {
                                    navController.navigate(Screen.Map.route)
                                    mapViewModel.openAddLocation(true)
                                }
                            )
                        }
                        composable(Screen.Admin.route) {
                            AdminModerationScreen(
                                currentUserId = mapUiState.currentUserId,
                                pendingLocations = mapUiState.pendingLocationsForAdmin,
                                issueReports = mapUiState.issueReports,
                                onApproveLocation = { mapViewModel.approveLocation(it) },
                                onRejectLocation = { mapViewModel.rejectLocation(it) }
                            )
                        }
                        composable(Screen.Settings.route) {
                            SettingsScreen(
                                viewModel = settingsViewModel,
                                onRequestLocationPermission = { requestAppPermissions() },
                                onRequestNotificationPermission = { requestAppPermissions() }
                            )
                        }
                    }
                }
            }
        }
    }

    private fun requestAppPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }
        permissionLauncher.launch(permissions.toTypedArray())
    }

    private fun setupGeofencing() {
        CoroutineScope(Dispatchers.IO).launch {
            geofenceManager.registerGeofences(locationRepository.locations.value)
        }
    }
}
