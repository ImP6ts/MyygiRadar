package ee.myygi.radar.ui.reports

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import ee.myygi.radar.domain.model.Location
import ee.myygi.radar.domain.model.ReportStatus
import ee.myygi.radar.services.location.DeviceLocation
import ee.myygi.radar.ui.theme.StatusPresent
import ee.myygi.radar.ui.theme.StatusProbablyAbsent

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportSubmissionBottomSheet(
    location: Location,
    userLocation: DeviceLocation?,
    isSubmitting: Boolean,
    onDismiss: () -> Unit,
    onSubmit: (companyId: String, status: ReportStatus) -> Unit
) {
    var selectedCompanyId by remember {
        mutableStateOf(location.activeCompanies.firstOrNull()?.id ?: "go3")
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 16.dp)
        ) {
            Text(
                text = "Kas siin on müügimees?",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = location.name,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // GPS Accuracy notification
            if (userLocation != null && userLocation.accuracyMeters > 50f) {
                Surface(
                    color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = MaterialTheme.colorScheme.error)
                        Text(
                            text = "GPS täpsus on madal (${userLocation.accuracyMeters.toInt()} m). Raport võetakse vastu kohandatud kaaluga.",
                            style = MaterialTheme.typography.labelMedium
                        )
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }

            Text(
                text = "Vali ettevõte:",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Company selection chips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                location.activeCompanies.forEach { company ->
                    val isSelected = company.id == selectedCompanyId
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedCompanyId = company.id },
                        label = { Text(company.name) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Dual Reporting Buttons: Present vs Not Present
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = { onSubmit(selectedCompanyId, ReportStatus.PRESENT) },
                    enabled = !isSubmitting,
                    modifier = Modifier.weight(1f).height(52.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = StatusPresent),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Check, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Jah, on kohal", fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = { onSubmit(selectedCompanyId, ReportStatus.NOT_PRESENT) },
                    enabled = !isSubmitting,
                    modifier = Modifier.weight(1f).height(52.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = StatusProbablyAbsent),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Close, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Ei ole kohal", fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Privacy Guarantee Notice
            Text(
                text = "🔒 Privaatsus: Raportid on anonüümsed. Me ei jälgi ega salvesta konkreetsete inimeste liikumist ega nimesid.",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
            )

            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}
