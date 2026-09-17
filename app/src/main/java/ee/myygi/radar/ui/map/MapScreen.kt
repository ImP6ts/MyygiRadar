package ee.myygi.radar.ui.map

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AddLocationAlt
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.ReportProblem
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import ee.myygi.radar.domain.model.AggregatedStatus
import ee.myygi.radar.domain.model.CompanyPresence
import ee.myygi.radar.domain.model.ReportStatus
import ee.myygi.radar.ui.components.StatusBadge
import ee.myygi.radar.ui.locations.AddLocationBottomSheet
import ee.myygi.radar.ui.locations.ReportLocationIssueBottomSheet
import ee.myygi.radar.ui.reports.ReportSubmissionBottomSheet
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapScreen(
    viewModel: MapViewModel,
    modifier: Modifier = Modifier
) {
    val uiState by viewModel.uiState.collectAsState()

    // Estonia geographic center
    val estoniaCenter = LatLng(58.75, 25.5)
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(estoniaCenter, 7.5f)
    }

    Box(modifier = modifier.fillMaxSize()) {
        GoogleMap(
            modifier = Modifier.fillMaxSize(),
            cameraPositionState = cameraPositionState,
            properties = MapProperties(isMyLocationEnabled = uiState.userLocation != null),
            uiSettings = MapUiSettings(zoomControlsEnabled = false, myLocationButtonEnabled = false)
        ) {
            uiState.locations.forEach { location ->
                Marker(
                    state = MarkerState(position = LatLng(location.latitude, location.longitude)),
                    title = location.name,
                    snippet = location.address,
                    onClick = {
                        viewModel.selectLocation(location)
                        true
                    }
                )
            }
        }

        // Top Action Bar: Add Location ("LISA POOD / OSTUKESKUS") & GPS Center
        Row(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Button: "LISA POOD / OSTUKESKUS"
            ExtendedFloatingActionButton(
                onClick = { viewModel.openAddLocation(true) },
                icon = { Icon(Icons.Default.AddLocationAlt, contentDescription = null) },
                text = { Text("LISA POOD / OSTUKESKUS") },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            )

            // Floating Action Button to center on user location
            FloatingActionButton(
                onClick = {
                    viewModel.fetchUserLocation()
                    uiState.userLocation?.let {
                        cameraPositionState.position = CameraPosition.fromLatLngZoom(
                            LatLng(it.latitude, it.longitude), 14f
                        )
                    }
                },
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.MyLocation, contentDescription = "Minu asukoht")
            }
        }

        // Location Details Bottom Sheet
        uiState.selectedLocation?.let { location ->
            ModalBottomSheet(
                onDismissRequest = { viewModel.clearSelectedLocation() },
                containerColor = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = location.name,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "${location.address}, ${location.city}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                        IconButton(onClick = { viewModel.clearSelectedLocation() }) {
                            Icon(Icons.Default.Close, contentDescription = "Sulge")
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Müügiesindajate staatus",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    if (uiState.selectedLocationPresences.isEmpty()) {
                        Text(
                            text = "Andmeid laaditakse...",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            modifier = Modifier.padding(vertical = 12.dp)
                        )
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.fillMaxWidth().heightIn(max = 280.dp)
                        ) {
                            items(uiState.selectedLocationPresences) { presence ->
                                CompanyPresenceCard(presence = presence)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Primary Reporting Button
                    Button(
                        onClick = { viewModel.openReporting(true) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Teata kohalolust / Kas siin on müügimees?")
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Secondary Action: "TEATA VEAST"
                    OutlinedButton(
                        onClick = { viewModel.openReportIssue(true) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                    ) {
                        Icon(Icons.Default.ReportProblem, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("TEATA VEAST")
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }

        // Report Submission Bottom Sheet Dialog
        if (uiState.isReportingOpen && uiState.selectedLocation != null) {
            ReportSubmissionBottomSheet(
                location = uiState.selectedLocation!!,
                userLocation = uiState.userLocation,
                isSubmitting = uiState.isSubmitting,
                onDismiss = { viewModel.openReporting(false) },
                onSubmit = { companyId, status ->
                    viewModel.submitReport(companyId, status)
                }
            )
        }

        // Add Location Bottom Sheet Dialog ("LISA POOD / OSTUKESKUS")
        if (uiState.isAddLocationOpen) {
            AddLocationBottomSheet(
                initialLat = uiState.userLocation?.latitude ?: 59.4218,
                initialLng = uiState.userLocation?.longitude ?: 24.7937,
                onDismiss = { viewModel.openAddLocation(false) },
                onCheckDuplicate = { name, address, lat, lng ->
                    viewModel.checkDuplicate(name, address, lat, lng)
                },
                onSubmit = { name, address, city, type, lat, lng ->
                    viewModel.submitNewLocation(name, address, city, type, lat, lng)
                }
            )
        }

        // Report Location Issue Bottom Sheet Dialog ("TEATA VEAST")
        if (uiState.isReportIssueOpen && uiState.selectedLocation != null) {
            ReportLocationIssueBottomSheet(
                location = uiState.selectedLocation!!,
                onDismiss = { viewModel.openReportIssue(false) },
                onSubmitIssue = { issueType, description ->
                    viewModel.submitReportIssue(issueType, description)
                }
            )
        }

        // Notification Snackbar if submitted
        uiState.submissionMessage?.let { msg ->
            Snackbar(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
            ) {
                Text(msg)
            }
        }
    }
}

@Composable
fun CompanyPresenceCard(presence: CompanyPresence) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = presence.company.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                StatusBadge(status = presence.status)
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                val timeStr = presence.lastConfirmedTimeMillis?.let {
                    val diffMinutes = (System.currentTimeMillis() - it) / (1000 * 60)
                    when {
                        diffMinutes < 1 -> "just praegu"
                        diffMinutes < 60 -> "$diffMinutes minutit tagasi"
                        else -> "${diffMinutes / 60} tundi tagasi"
                    }
                } ?: "Puudub"

                Text(
                    text = "Viimane kinnitus: $timeStr",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )

                Text(
                    text = "Kinnitusi: ${presence.recentConfirmationsCount}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
            }

            // Persistent presence badge
            if (presence.isPersistentPresenceToday) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "★ ${presence.company.name} kohalolek on täna selles kohas korduvalt kinnitatud.",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
